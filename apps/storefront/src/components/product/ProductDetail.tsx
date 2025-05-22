import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
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
import { BuyerProduct, InventoryRecord, Me } from "ordercloud-javascript-sdk";
import pluralize from "pluralize";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IS_MULTI_LOCATION_INVENTORY } from "../../constants";
import formatPrice from "../../utils/formatPrice";
import OcQuantityInput from "../cart/OcQuantityInput";
import ProductImageGallery from "./product-detail/ProductImageGallery";
import {
  useOcResourceGet,
  useOcResourceList,
  useShopper,
} from "@ordercloud/react-sdk";

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
  const { data: inventoryRecords } = useOcResourceList<InventoryRecord>(
    "Me.ProductInventoryRecords",
    undefined,
    { productID: productId },
    { disabled: !IS_MULTI_LOCATION_INVENTORY }
  );

  const [childProducts, setChildProducts] = useState<BuyerProduct[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedVariantID, setSelectedVariantID] = useState<string | null>(
    null
  );
  const outOfStock = useMemo(
    () => product?.Inventory?.QuantityAvailable === 0,
    [product?.Inventory?.QuantityAvailable]
  );
  const { addCartLineItem } = useShopper();

  const [selectedFacets, setSelectedFacets] = useState<{
    [key: string]: string[];
  }>({});
  const [facetCount, setFacetCount] = useState<number | null>(null);

  const ct = childProducts.find(
    (p) => p.PriceSchedule?.Name === "Cut Tape (CT)"
  );
  const dr = childProducts.find((p) => p.PriceSchedule?.Name === "Digi-Reel®");

  useEffect(() => {
    const availableRecord = inventoryRecords?.Items.find(
      (item) => item.QuantityAvailable > 0
    );
    if (availableRecord) {
      setActiveRecordId(availableRecord.ID);
    }
  }, [inventoryRecords?.Items]);

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

  const effectiveProduct = useMemo(() => {
    if (quantity <= 0 || !childProducts.length) return null;

    // Try to find exact match among non-CT/DR children
    const exactMatch = childProducts.find((p) =>
      p.PriceSchedule?.PriceBreaks?.some((pb) => pb.Quantity === quantity)
    );

    if (exactMatch && exactMatch.ID !== ct?.ID && exactMatch.ID !== dr?.ID) {
      return exactMatch;
    }

    // If user made a selection, honor it
    if (selectedVariantID) {
      return childProducts.find((p) => p.ID === selectedVariantID) ?? null;
    }

    // Default to Cut Tape if there's leftover quantity or fallback needed
    if (ct?.PriceSchedule?.PriceBreaks?.length) return ct;
    if (dr?.PriceSchedule?.PriceBreaks?.length) return dr;

    return null;
  }, [quantity, childProducts, selectedVariantID, ct, dr]);

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

    let bestMatch = null;
    let maxBreakQty = 0;
    for (const variant of standardVariants) {
      const eligibleBreaks = variant.PriceSchedule?.PriceBreaks?.filter(
        (pb) => pb.Quantity && pb.Quantity <= quantity
      );
      const maxBreak = eligibleBreaks?.sort(
        (a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0)
      )[0];
      if (maxBreak && maxBreak.Quantity! > maxBreakQty) {
        bestMatch = variant;
        maxBreakQty = maxBreak.Quantity!;
      }
    }

    if (!bestMatch || maxBreakQty === 0) return null;

    const leftoverQty = quantity - maxBreakQty;
    return {
      standardProduct: bestMatch,
      standardQty: maxBreakQty,
      leftoverQty,
      fallbackProduct: selectedVariantID === dr?.ID ? dr : ct, // must be selected
    };
  }, [quantity, standardVariants, ct, dr, selectedVariantID]);

  const handleAddToCart = useCallback(async () => {
    if (quantity <= 0) return;

    try {
      setAddingToCart(true);

      if (quantitySplit) {
        // Add the standard product first
        await addCartLineItem({
          ProductID: quantitySplit.standardProduct.ID!,
          Quantity: quantitySplit.standardQty,
        });

        // Then add the fallback (CT/DR) product if there's leftover quantity
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
    const params = new URLSearchParams();
    params.set("catalogId", "catalog");
    Object.entries(facets).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(`xp.Facets.${key}`, values.join(", "));
      }
    });
    return params.toString();
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
      const stdUnit = stdBreaks
        .sort((a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0))
        .find((pb) => quantitySplit.standardQty >= (pb.Quantity ?? 0))?.Price;

      const fallbackUnit = (ct?.PriceSchedule?.PriceBreaks || [])
        .sort((a, b) => (b.Quantity ?? 0) - (a.Quantity ?? 0))
        .find((pb) => quantitySplit.leftoverQty >= (pb.Quantity ?? 0))?.Price;

      return (
        (stdUnit ?? 0) * quantitySplit.standardQty +
        (fallbackUnit ?? 0) * quantitySplit.leftoverQty
      );
    }

    return unitPrice !== null ? unitPrice * quantity : null;
  }, [quantitySplit, unitPrice, quantity, ct]);

  useEffect(() => {
    const fetchFacetResults = async () => {
      const params: Record<string, any> = {
        page: 1,
        catalogId: "catalog",
        filters: { IsParent: true },
      };

      Object.entries(selectedFacets).forEach(([key, values]) => {
        if (values.length > 0) {
          params[`xp.Facets.${key}`] = values.join(", ");
        }
      });

      try {
        const res = await Me.ListProducts(params);
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
          <ProductImageGallery images={product.xp?.Images || []} />
          {product?.xp?.Facets && (
            <VStack align="start" w="full" gap={4}>
              <Heading size="md">Product Attributes</Heading>
              <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" w="full">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Facet</Th>
                      <Th>Value</Th>
                      <Th>Filter</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(product.xp.Facets).map(([key, value]) => {
                      const stringValue = String(value);
                      return (
                        <Tr key={key}>
                          <Td>{key}</Td>
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
                    })}
                  </Tbody>
                </Table>
                {facetCount !== null && (
                  <HStack justifyContent="space-between" w="full">
                    <Text>
                      <strong>Matching products:</strong> {facetCount}
                    </Text>
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

        <VStack alignItems="flex-start" maxW="4xl" gap={4}>
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

          {/* {!product.IsParent && (
            <HStack alignItems="center" gap={4} my={3}>
              <Button
                colorScheme="primary"
                type="button"
                onClick={handleAddToCart}
                isDisabled={addingToCart || outOfStock}
              >
                {outOfStock ? "Out of stock" : "Add To Cart"}
              </Button>
              <OcQuantityInput
                controlId="addToCart"
                priceSchedule={product.PriceSchedule}
                quantity={quantity}
                onChange={setQuantity}
              />
            </HStack>
          )} */}
          {product.IsParent && childProducts.length > 0 && (
            <VStack align="start" spacing={4} w="full">
              <OcQuantityInput
                controlId="dynamicQuantity"
                priceSchedule={{
                  Name: "Dynamic", // Required dummy value
                  PriceBreaks: unifiedBreaks,
                }}
                quantity={quantity}
                onChange={setQuantity}
              />
              {unitPrice !== null && (
                <Text fontSize="md">
                  Cost: {formatPrice(totalCost ?? undefined)}
                </Text>
              )}
              {quantity > 0 &&
                (effectiveProduct?.ID === ct?.ID ||
                  effectiveProduct?.ID === dr?.ID) && (
                  <HStack>
                    {ct && (
                      <Button
                        onClick={() => setSelectedVariantID(ct.ID!)}
                        variant={
                          selectedVariantID === ct.ID ? "solid" : "outline"
                        }
                        colorScheme="secondary"
                      >
                        Choose Cut Tape
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
                        Choose Digi-Reel
                      </Button>
                    )}
                  </HStack>
                )}
              {(quantitySplit || effectiveProduct) && (
                <Box w="full">
                  <Heading size="sm" mb={2}>
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
                          {/* Standard product row */}
                          <Tr>
                            <Td>{quantitySplit.standardProduct.Name}</Td>
                            <Td isNumeric>{quantitySplit.standardQty}</Td>
                            <Td isNumeric>
                              {(() => {
                                const breaks =
                                  quantitySplit.standardProduct.PriceSchedule
                                    ?.PriceBreaks ?? [];
                                const unit =
                                  breaks
                                    .sort(
                                      (a, b) =>
                                        (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                    )
                                    .find(
                                      (pb) =>
                                        quantitySplit.standardQty >=
                                        (pb.Quantity ?? 0)
                                    )?.Price ?? 0;
                                return formatPrice(unit);
                              })()}
                            </Td>
                            <Td isNumeric>
                              {(() => {
                                const breaks =
                                  quantitySplit.standardProduct.PriceSchedule
                                    ?.PriceBreaks ?? [];
                                const unit =
                                  breaks
                                    .sort(
                                      (a, b) =>
                                        (b.Quantity ?? 0) - (a.Quantity ?? 0)
                                    )
                                    .find(
                                      (pb) =>
                                        quantitySplit.standardQty >=
                                        (pb.Quantity ?? 0)
                                    )?.Price ?? 0;
                                return formatPrice(
                                  unit * quantitySplit.standardQty
                                );
                              })()}
                            </Td>
                          </Tr>

                          {/* Leftover (CT/DR) product row */}
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
                                  {(() => {
                                    const breaks =
                                      quantitySplit.fallbackProduct
                                        ?.PriceSchedule?.PriceBreaks ?? [];
                                    const unit =
                                      breaks
                                        .sort(
                                          (a, b) =>
                                            (b.Quantity ?? 0) -
                                            (a.Quantity ?? 0)
                                        )
                                        .find(
                                          (pb) =>
                                            quantitySplit.leftoverQty >=
                                            (pb.Quantity ?? 0)
                                        )?.Price ?? 0;
                                    return formatPrice(unit);
                                  })()}
                                </Td>
                                <Td isNumeric>
                                  {(() => {
                                    const breaks =
                                      quantitySplit.fallbackProduct
                                        ?.PriceSchedule?.PriceBreaks ?? [];
                                    const unit =
                                      breaks
                                        .sort(
                                          (a, b) =>
                                            (b.Quantity ?? 0) -
                                            (a.Quantity ?? 0)
                                        )
                                        .find(
                                          (pb) =>
                                            quantitySplit.leftoverQty >=
                                            (pb.Quantity ?? 0)
                                        )?.Price ?? 0;
                                    return formatPrice(
                                      unit * quantitySplit.leftoverQty
                                    );
                                  })()}
                                </Td>
                              </Tr>
                            )}
                        </>
                      ) : effectiveProduct && quantity > 0 ? (
                        <Tr>
                          <Td>
                            {effectiveProduct.ID === ct?.ID
                              ? "Cut Tape"
                              : effectiveProduct.ID === dr?.ID
                                ? "Digi-Reel®"
                                : effectiveProduct.Name}
                          </Td>
                          <Td isNumeric>{quantity}</Td>
                          <Td isNumeric>{formatPrice(unitPrice ?? 0)}</Td>
                          <Td isNumeric>
                            {formatPrice((unitPrice ?? 0) * quantity)}
                          </Td>
                        </Tr>
                      ) : null}
                    </Tbody>
                  </Table>
                </Box>
              )}

              <Button
                colorScheme="primary"
                onClick={handleAddToCart}
                isDisabled={addingToCart || quantity <= 0 || !effectiveProduct}
              >
                Add to Cart
              </Button>
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

          {!outOfStock && IS_MULTI_LOCATION_INVENTORY && (
            <>
              <Heading size="sm" color="chakra-subtle-text">
                {`(${inventoryRecords?.Items.length}) locations with inventory`}
              </Heading>
              <HStack spacing={4}>
                {inventoryRecords?.Items.map((item) => (
                  <Button
                    onClick={() => setActiveRecordId(item.ID)}
                    cursor="pointer"
                    variant="outline"
                    as={Card}
                    h="150px"
                    aspectRatio="1 / 1"
                    key={item.ID}
                    isDisabled={item.QuantityAvailable === 0}
                  >
                    <CardBody
                      fontSize="xs"
                      p={1}
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="center"
                      flexFlow="column nowrap"
                    >
                      <Text fontSize="sm">{item.Address.AddressName}</Text>
                      <Text>{item.Address.Street1}</Text>
                      {item.Address.Street2 && (
                        <Text>{item.Address.Street2}</Text>
                      )}
                      <Text>Stock: {item.QuantityAvailable}</Text>
                    </CardBody>
                    <CardFooter py={2} fontSize="xs">
                      {item.QuantityAvailable === 0
                        ? "Out of stock"
                        : "Select This Store"}
                    </CardFooter>
                  </Button>
                ))}
              </HStack>
            </>
          )}
        </VStack>
      </SimpleGrid>
    )
  ) : (
    <div>Product not found for ID: {productId}</div>
  );
};

export default ProductDetail;
