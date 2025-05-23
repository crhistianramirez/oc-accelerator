import {
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { BuyerProduct, Me } from "ordercloud-javascript-sdk";
import pluralize from "pluralize";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import formatPrice from "../../utils/formatPrice";
import OcQuantityInput from "../cart/OcQuantityInput";
import ProductImageGallery from "./product-detail/ProductImageGallery";
import { useOcResourceGet, useShopper } from "@ordercloud/react-sdk";

export interface ProductDetailProps {
  productId: string;
  renderProductDetail?: (product: BuyerProduct) => JSX.Element;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  renderProductDetail,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: product, isLoading: loading } = useOcResourceGet<BuyerProduct>(
    "Me.Products",
    { productID: productId }
  );
  // const { data: inventoryRecords } = useOcResourceList<InventoryRecord>(
  //   "Me.ProductInventoryRecords",
  //   undefined,
  //   { productID: productId },
  //   { disabled: !IS_MULTI_LOCATION_INVENTORY }
  // );

  const [childProducts, setChildProducts] = useState<BuyerProduct[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedVariantID, setSelectedVariantID] = useState<string | null>(
    null
  );
  // const outOfStock = useMemo(
  //   () => product?.Inventory?.QuantityAvailable === 0,
  //   [product?.Inventory?.QuantityAvailable]
  // );
  const { addCartLineItem } = useShopper();

  const [selectedFacets, setSelectedFacets] = useState<{
    [key: string]: string[];
  }>({});
  const [facetCount, setFacetCount] = useState<number | null>(null);

  const ct = childProducts.find(
    (p) => p.PriceSchedule?.Name === "Cut Tape (CT)"
  );
  const dr = childProducts.find((p) => p.PriceSchedule?.Name === "Digi-Reel®");

  // useEffect(() => {
  //   const availableRecord = inventoryRecords?.Items.find(
  //     (item) => item.QuantityAvailable > 0
  //   );
  //   if (availableRecord) {
  //     setActiveRecordId(availableRecord.ID);
  //   }
  // }, [inventoryRecords?.Items]);

  useEffect(() => {
    const fetchChildProducts = async () => {
      if (product && product.IsParent) {
        try {
          const res = await Me.ListProducts({
            filters: { ParentID: product.ID },
          });
          setChildProducts(res.Items || []);
        } catch (err) {
          console.error("Failed to fetch child products", err);
        }
      }
    };
    fetchChildProducts();
  }, [product]);

  const hasCTorDR = !!ct || !!dr;

  const effectiveProduct = useMemo(() => {
    if (quantity <= 0 || !childProducts.length) return null;

    if (hasCTorDR) {
      // STRICT: only match exact price breaks or fallback to CT/DR
      const exactMatch = childProducts.find((p) =>
        p.PriceSchedule?.PriceBreaks?.some((pb) => pb.Quantity === quantity)
      );

      if (exactMatch && exactMatch.ID !== ct?.ID && exactMatch.ID !== dr?.ID) {
        return exactMatch;
      }

      if (selectedVariantID) {
        return childProducts.find((p) => p.ID === selectedVariantID) ?? null;
      }

      if (ct?.PriceSchedule?.PriceBreaks?.length) return ct;
      if (dr?.PriceSchedule?.PriceBreaks?.length) return dr;

      return null;
    } else {
      // FLEXIBLE: find best fit product that can fulfill any quantity
      return (
        childProducts.find((p) =>
          p.PriceSchedule?.PriceBreaks?.some(
            (pb) => quantity >= (pb.Quantity ?? 0)
          )
        ) ?? null
      );
    }
  }, [quantity, childProducts, selectedVariantID, ct, dr, hasCTorDR]);

  useEffect(() => {
    const needsSplit =
      quantity > 0 &&
      effectiveProduct?.ID === ct?.ID &&
      !selectedVariantID &&
      ct?.ID;

    if (needsSplit) {
      setSelectedVariantID(ct.ID!); // Default to Cut Tape
    }
  }, [quantity, effectiveProduct, selectedVariantID, ct]);

  const standardVariants = useMemo(
    () =>
      childProducts.filter(
        (p) =>
          p.ID !== ct?.ID &&
          p.ID !== dr?.ID &&
          p.PriceSchedule?.PriceBreaks?.length
      ),
    [childProducts, ct?.ID, dr?.ID]
  );

  // NEW LOGIC: Find best fit standard variant for as much quantity as possible
  const quantitySplit = useMemo(() => {
    if (
      quantity <= 0 ||
      !standardVariants.length ||
      !ct?.PriceSchedule?.PriceBreaks
    ) {
      return null;
    }

    let bestMatch: BuyerProduct | null = null;
    let maxUsableQty = 0;

    for (const variant of standardVariants) {
      const breaks = [...(variant.PriceSchedule?.PriceBreaks || [])]
        .filter((pb) => typeof pb.Quantity === "number" && pb.Quantity! > 0)
        .sort((a, b) => b.Quantity! - a.Quantity!); // sort desc

      if (!breaks.length) continue;

      let usedQty = 0;
      let remaining = quantity;

      for (const pb of breaks) {
        const times = Math.floor(remaining / pb.Quantity!);
        if (times > 0) {
          usedQty += pb.Quantity! * times;
          remaining -= pb.Quantity! * times;
        }
      }

      if (usedQty > maxUsableQty) {
        maxUsableQty = usedQty;
        bestMatch = variant;
      }
    }

    if (!bestMatch || maxUsableQty === 0) return null;

    const leftoverQty = quantity - maxUsableQty;

    return {
      standardProduct: bestMatch,
      standardQty: maxUsableQty,
      leftoverQty,
      fallbackProduct: selectedVariantID === dr?.ID ? dr : ct,
    };
  }, [quantity, standardVariants, ct, dr, selectedVariantID]);

  const isAddToCartDisabled =
    quantity <= 0 ||
    addingToCart ||
    (ct && dr && (quantitySplit?.leftoverQty ?? 0) > 0 && !selectedVariantID);

  const handleAddToCart = useCallback(async () => {
    if (quantity <= 0) return;

    try {
      setAddingToCart(true);

      if (quantitySplit) {
        await addCartLineItem({
          ProductID: quantitySplit.standardProduct.ID!,
          Quantity: quantitySplit.standardQty,
        });

        if (
          quantitySplit.leftoverQty > 0 &&
          quantitySplit.fallbackProduct?.ID
        ) {
          await addCartLineItem({
            ProductID: quantitySplit.fallbackProduct.ID!,
            Quantity: quantitySplit.leftoverQty,
          });
        }
      } else if (effectiveProduct?.ID) {
        await addCartLineItem({
          ProductID: effectiveProduct.ID,
          Quantity: quantity,
        });
      }

      toast({
        title: `${quantity} ${pluralize("item", quantity)} added to cart`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate("/cart");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add item(s) to cart.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAddingToCart(false);
    }
  }, [
    quantity,
    effectiveProduct,
    quantitySplit,
    addCartLineItem,
    toast,
    navigate,
  ]);

  const handleCheckboxChange = (facetKey: string, facetValue: string) => {
    setSelectedFacets((prev) => {
      const currentValues = prev[facetKey] || [];
      const isSelected = currentValues.includes(facetValue);
      return {
        ...prev,
        [facetKey]: isSelected
          ? currentValues.filter((v) => v !== facetValue)
          : [...currentValues, facetValue],
      };
    });
  };

  const generateFacetQueryString = (facets: Record<string, string[]>) => {
    const parts: string[] = [];

    parts.push("IsParent=true");
    parts.push("catalogID=catalog");

    for (const [key, values] of Object.entries(facets)) {
      if (values.length > 0) {
        // Encode each value individually, but preserve the pipe separator
        const encodedValues = values
          .map((v) => encodeURIComponent(v))
          .join("|");
        parts.push(`xp.Facets.${key}=${encodedValues}`);
      }
    }

    return parts.join("&");
  };

  const hasSelectedFacets = useMemo(
    () => Object.values(selectedFacets).some((values) => values.length > 0),
    [selectedFacets]
  );

  const arePriceBreaksEqual = (
    a?: { Quantity?: number; Price?: number }[],
    b?: { Quantity?: number; Price?: number }[]
  ): boolean => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      const other = b[index];
      return (
        typeof item.Quantity === "number" &&
        typeof item.Price === "number" &&
        typeof other?.Quantity === "number" &&
        typeof other?.Price === "number" &&
        item.Quantity === other.Quantity &&
        item.Price === other.Price
      );
    });
  };

  const unifiedBreaks =
    ct &&
    dr &&
    arePriceBreaksEqual(
      ct.PriceSchedule?.PriceBreaks,
      dr.PriceSchedule?.PriceBreaks
    )
      ? ct.PriceSchedule?.PriceBreaks || []
      : [];

  const unitPrice = useMemo(() => {
    const breaks = effectiveProduct?.PriceSchedule?.PriceBreaks;
    if (!breaks) return null;
    const matching = breaks
      .filter((pb) => typeof pb.Quantity === "number")
      .sort((a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0))
      .find((pb) => quantity >= (pb.Quantity ?? 0));
    return matching?.Price ?? null;
  }, [effectiveProduct, quantity]);

  const totalCost = useMemo(() => {
    if (quantitySplit) {
      const stdBreaks =
        quantitySplit.standardProduct.PriceSchedule?.PriceBreaks || [];
      const stdUnitPrice =
        [...stdBreaks]
          .sort((a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0))
          .find((pb) => quantitySplit.standardQty >= (pb.Quantity ?? 0))
          ?.Price ?? 0;

      const ctBreaks =
        quantitySplit.fallbackProduct?.PriceSchedule?.PriceBreaks || [];
      const ctUnitPrice =
        [...ctBreaks]
          .sort((a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0))
          .find((pb) => quantitySplit.leftoverQty >= (pb.Quantity ?? 0))
          ?.Price ?? 0;

      return (
        parseFloat((stdUnitPrice * quantitySplit.standardQty).toFixed(2)) +
        parseFloat((ctUnitPrice * quantitySplit.leftoverQty).toFixed(2))
      );
    }

    return unitPrice !== null
      ? parseFloat((unitPrice * quantity).toFixed(2))
      : null;
  }, [quantitySplit, unitPrice, quantity]);

  useEffect(() => {
    const fetchFacetResults = async () => {
      try {
        // Build the full query string
        const queryString = generateFacetQueryString(selectedFacets);

        // Convert the query string back into an object for Me.ListProducts
        const searchParams = new URLSearchParams(queryString);
        const filters: Record<string, string> = {};

        for (const [key, value] of searchParams.entries()) {
          filters[key] = value;
        }

        const res = await Me.ListProducts({ filters, page: 1 });

        setFacetCount(res?.Meta?.TotalCount ?? 0);
        console.log("Facet-based product count:", res?.Meta?.TotalCount);
      } catch (err) {
        console.error("Failed to fetch facet-based results", err);
        setFacetCount(null);
      }
    };

    fetchFacetResults();
  }, [selectedFacets]);

  const groupedCTDR = useMemo(() => {
    if (
      ct &&
      dr &&
      arePriceBreaksEqual(
        ct.PriceSchedule?.PriceBreaks,
        dr.PriceSchedule?.PriceBreaks
      )
    ) {
      return {
        label: "Cut Tape (CT) & Digi-Reel®",
        priceBreaks: (ct.PriceSchedule?.PriceBreaks || []).filter(
          (pb): pb is { Quantity: number; Price: number } =>
            typeof pb.Quantity === "number" && typeof pb.Price === "number"
        ),
        ids: [ct.ID, dr.ID],
      };
    }
    return null;
  }, [ct, dr]);

  const renderGroupedChildProducts = () => {
    const grouped: {
      label: string;
      priceBreaks: { Quantity: number; Price: number }[];
    }[] = [];
    const used = new Set<string>();

    if (groupedCTDR) {
      grouped.push({
        label: groupedCTDR.label,
        priceBreaks: groupedCTDR.priceBreaks,
      });
      groupedCTDR.ids.forEach((id) => id && used.add(id));
    }

    childProducts.forEach((p) => {
      if (!p.ID || used.has(p.ID)) return;
      const label = p.PriceSchedule?.Name || p.ID;
      if (Array.isArray(p.PriceSchedule?.PriceBreaks)) {
        grouped.push({
          label,
          priceBreaks: p.PriceSchedule.PriceBreaks.filter(
            (pb): pb is { Quantity: number; Price: number } =>
              typeof pb.Quantity === "number" && typeof pb.Price === "number"
          ),
        });
      }
    });

    return grouped.map((group, i) => (
      <Box
        key={i}
        w="full"
        mb={6}
        bg="white"
        p={4}
        borderRadius="lg"
        boxShadow="sm"
      >
        <Heading size="sm" mb={2}>
          {group.label}
        </Heading>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Quantity</Th>
              <Th>Price</Th>
            </Tr>
          </Thead>
          <Tbody>
            {group.priceBreaks.map((pb, idx) => (
              <Tr key={idx}>
                <Td>{pb.Quantity}</Td>
                <Td>{formatPrice(pb.Price)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    ));
  };

  const formatFacetKey = (key: string): string =>
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // Add space between camelCase words
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

  return loading ? (
    <Center h="50vh">
      <Spinner size="xl" thickness="10px" />
    </Center>
  ) : product ? (
    renderProductDetail ? (
      renderProductDetail(product)
    ) : (
      <SimpleGrid
        as={Container}
        gridTemplateColumns={{ lg: "1.5fr 2fr" }}
        gap={12}
        w="full"
        maxW="container.4xl"
      >
        <VStack alignItems="flex-start" gap={6}>
          <Box maxW="400px" w="100%">
            <ProductImageGallery images={product.xp?.Images || []} />
          </Box>
          {product?.xp?.Facets && (
            <VStack align="start" w="full" gap={4}>
              <Heading size="md">Product Attributes</Heading>
              <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" w="full">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th>Select</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(product.xp.Facets).map(([key, value]) => {
                      const valuesArray = Array.isArray(value)
                        ? value
                        : [value];
                      return valuesArray.map((val, index) => {
                        const stringValue = String(val);
                        return (
                          <Tr key={`${key}-${stringValue}`}>
                            <Td fontWeight="bold">
                              {index === 0 ? formatFacetKey(key) : ""}
                            </Td>
                            <Td>{stringValue}</Td>
                            <Td>
                              <Checkbox
                                isChecked={selectedFacets[key]?.includes(
                                  stringValue
                                )}
                                onChange={() =>
                                  handleCheckboxChange(key, stringValue)
                                }
                              />
                            </Td>
                          </Tr>
                        );
                      });
                    })}
                  </Tbody>
                </Table>
                {facetCount !== null && (
                  <HStack justifyContent="flex-end" spacing={4} w="full">
                    <Text fontWeight="medium">{facetCount} remaining</Text>
                    <Button
                      as="a"
                      colorScheme="primary"
                      href={`/shop/catalog/products?${generateFacetQueryString(selectedFacets)}`}
                      isDisabled={!hasSelectedFacets}
                    >
                      View Similar
                    </Button>
                  </HStack>
                )}
              </Box>
            </VStack>
          )}
        </VStack>

        <VStack alignItems="flex-start" maxW="4xl" gap={6}>
          <Heading maxW="2xl" size="xl">
            {product.Name}
          </Heading>
          <Text color="chakra-subtle-text" fontSize="sm">
            {product.ID}
          </Text>
          <Text maxW="prose">{product.Description}</Text>
          <Text fontSize="3xl" fontWeight="medium">
            {formatPrice(product?.PriceSchedule?.PriceBreaks?.[0].Price)}
          </Text>

          {product.IsParent && childProducts.length > 0 && (
            <VStack align="start" spacing={6} w="full">
              <Box w="full">
                <Text fontWeight="semibold" mb={1}>
                  Enter Quantity
                </Text>
                <HStack spacing={4} alignItems="center" flexWrap="wrap">
                  <Box flex="none">
                    <OcQuantityInput
                      controlId="dynamicQuantity"
                      priceSchedule={{
                        Name: "Dynamic", // Required dummy value
                        PriceBreaks: unifiedBreaks,
                      }}
                      quantity={quantity}
                      onChange={setQuantity}
                    />
                  </Box>

                  {(effectiveProduct?.ID === ct?.ID ||
                    effectiveProduct?.ID === dr?.ID) && (
                    <>
                      {ct && (
                        <Button
                          onClick={() => setSelectedVariantID(ct.ID!)}
                          variant={
                            selectedVariantID === ct.ID ? "solid" : "outline"
                          }
                          colorScheme="secondary"
                        >
                          Cut Tape
                        </Button>
                      )}
                      {dr && (
                        <Button
                          onClick={() => setSelectedVariantID(dr.ID!)}
                          variant={
                            selectedVariantID === dr.ID ? "solid" : "outline"
                          }
                          colorScheme="secondary"
                        >
                          Digi-Reel®
                        </Button>
                      )}
                    </>
                  )}
                </HStack>
              </Box>

              {quantity > 0 && (
                <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" w="full">
                  <Heading size="sm" mb={4} fontWeight="semibold">
                    Order Breakdown
                  </Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Variant</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Unit Price</Th>
                        <Th isNumeric>Subtotal</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {quantitySplit ? (
                        <>
                          <Tr>
                            <Td>{quantitySplit.standardProduct.Name}</Td>
                            <Td isNumeric>{quantitySplit.standardQty}</Td>
                            <Td isNumeric>
                              {formatPrice(
                                [
                                  ...(quantitySplit.standardProduct
                                    .PriceSchedule?.PriceBreaks || []),
                                ]
                                  .sort(
                                    (a, b) =>
                                      (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                  )
                                  .find(
                                    (pb) =>
                                      quantitySplit.standardQty >=
                                      (pb.Quantity ?? 0)
                                  )?.Price ?? 0
                              )}
                            </Td>
                            <Td isNumeric>
                              {formatPrice(
                                ([
                                  ...(quantitySplit.standardProduct
                                    .PriceSchedule?.PriceBreaks || []),
                                ]
                                  .sort(
                                    (a, b) =>
                                      (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                  )
                                  .find(
                                    (pb) =>
                                      quantitySplit.standardQty >=
                                      (pb.Quantity ?? 0)
                                  )?.Price ?? 0) * quantitySplit.standardQty
                              )}
                            </Td>
                          </Tr>
                          {quantitySplit.leftoverQty > 0 &&
                            quantitySplit.fallbackProduct && (
                              <Tr>
                                <Td>
                                  {quantitySplit.fallbackProduct.ID === ct?.ID
                                    ? "Cut Tape"
                                    : quantitySplit.fallbackProduct.ID ===
                                        dr?.ID
                                      ? "Digi-Reel®"
                                      : quantitySplit.fallbackProduct.Name}
                                </Td>
                                <Td isNumeric>{quantitySplit.leftoverQty}</Td>
                                <Td isNumeric>
                                  {formatPrice(
                                    [
                                      ...(quantitySplit.fallbackProduct
                                        .PriceSchedule?.PriceBreaks || []),
                                    ]
                                      .sort(
                                        (a, b) =>
                                          (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                      )
                                      .find(
                                        (pb) =>
                                          quantitySplit.leftoverQty >=
                                          (pb.Quantity ?? 0)
                                      )?.Price ?? 0
                                  )}
                                </Td>
                                <Td isNumeric>
                                  {formatPrice(
                                    ([
                                      ...(quantitySplit.fallbackProduct
                                        .PriceSchedule?.PriceBreaks || []),
                                    ]
                                      .sort(
                                        (a, b) =>
                                          (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                      )
                                      .find(
                                        (pb) =>
                                          quantitySplit.leftoverQty >=
                                          (pb.Quantity ?? 0)
                                      )?.Price ?? 0) * quantitySplit.leftoverQty
                                  )}
                                </Td>
                              </Tr>
                            )}
                        </>
                      ) : effectiveProduct ? (
                        <Tr>
                          <Td>
                            {groupedCTDR?.ids.includes(effectiveProduct.ID!)
                              ? selectedVariantID === ct?.ID
                                ? "Cut Tape"
                                : selectedVariantID === dr?.ID
                                  ? "Digi-Reel®"
                                  : groupedCTDR.label
                              : effectiveProduct.Name}
                          </Td>
                          <Td isNumeric>{quantity}</Td>
                          <Td isNumeric>
                            {formatPrice(
                              [
                                ...(effectiveProduct.PriceSchedule
                                  ?.PriceBreaks || []),
                              ]
                                .sort(
                                  (a, b) =>
                                    (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                )
                                .find((pb) => quantity >= (pb.Quantity ?? 0))
                                ?.Price ?? 0
                            )}
                          </Td>
                          <Td isNumeric>
                            {formatPrice(
                              ([
                                ...(effectiveProduct.PriceSchedule
                                  ?.PriceBreaks || []),
                              ]
                                .sort(
                                  (a, b) =>
                                    (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                )
                                .find((pb) => quantity >= (pb.Quantity ?? 0))
                                ?.Price ??
                                0 ??
                                0) * quantity
                            )}
                          </Td>
                        </Tr>
                      ) : (
                        <Tr>
                          <Td colSpan={4}>
                            <Text>
                              No matching variant could be determined.
                            </Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}

              {unitPrice !== null && (
                <Box w="full" textAlign="right" pt={2}>
                  <Text fontSize="4xl" fontWeight="semibold" color="gray.800">
                    <Text as="span" fontWeight="bold">
                      {formatPrice(totalCost ?? undefined)}
                    </Text>
                  </Text>
                  <Button
                    mt={4}
                    colorScheme="primary"
                    onClick={handleAddToCart}
                    isDisabled={isAddToCartDisabled}
                  >
                    Add to Cart
                  </Button>
                </Box>
              )}
            </VStack>
          )}

          {product.IsParent && childProducts.length > 0 && (
            <VStack align="start" spacing={6} mt={6} width="full">
              <Heading size="md">Available Variants</Heading>
              <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" w="full">
                {renderGroupedChildProducts()}
              </Box>
            </VStack>
          )}
        </VStack>
      </SimpleGrid>
    )
  ) : (
    <div>Product not found for ID: {productId}</div>
  );
};

export default ProductDetail;
