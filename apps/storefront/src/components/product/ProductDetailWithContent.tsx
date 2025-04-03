import {
    Button,
    Card,
    CardBody,
    CardFooter,
    Center,
    Container,
    Heading,
    HStack,
    SimpleGrid,
    Spinner,
    Text,
    useToast,
    VStack,
    Divider,
  } from "@chakra-ui/react";
  import {
    BuyerProduct,
    InventoryRecord,
    OrderCloudError,
  } from "ordercloud-javascript-sdk";
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
  import { useProductContent } from "../../hooks/useProductContent";

  export interface ProductDetailWithContentProps {
    productId: string;
    renderProductDetail?: (product: BuyerProduct) => JSX.Element;
  }
  
  const ProductDetailWithContent: React.FC<ProductDetailWithContentProps> = ({
    productId,
    renderProductDetail,
  }) => {
    const productContent = useProductContent(productId);
    const navigate = useNavigate();
    const toast = useToast();
    const [activeRecordId, setActiveRecordId] = useState<string>();
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
  
    const [addingToCart, setAddingToCart] = useState(false);
    const [quantity, setQuantity] = useState(
      product?.PriceSchedule?.MinQuantity ?? 1
    );
    const outOfStock = useMemo(
      () => product?.Inventory?.QuantityAvailable === 0,
      [product?.Inventory?.QuantityAvailable]
    );
    const { addCartLineItem } = useShopper();

    const productImages = useMemo(() => {
      if (!productContent.data?.images) {
        return [];
      }

      return productContent.data.images.map(assetUrls => {
        // Find the downloadOriginal URL
        const originalUrl = Object.values(assetUrls).find(
          url => url.resource === 'downloadOriginal'
        )?.url || '';

        // Find the thumbnail URL
        const thumbnailUrl = Object.values(assetUrls).find(
          url => url.resource === 'thumbnail'
        )?.url || '';

        return {
          Url: originalUrl,
          ThumbnailUrl: thumbnailUrl,
          OriginalUrl: ''
        };
      });
    }, [productContent.data?.images]);
  
    useEffect(() => {
      const availableRecord = inventoryRecords?.Items.find(
        (item) => item.QuantityAvailable > 0
      );
      if (availableRecord) {
        setActiveRecordId(availableRecord.ID);
      }
    }, [inventoryRecords?.Items]);
  
    const handleAddToCart = useCallback(async () => {
      if (!product) {
        console.warn("[ProductDetail.tsx] Product not found for ID:", productId);
        return <div>Product not found for ID: {productId}</div>;
      }
  
      if (IS_MULTI_LOCATION_INVENTORY && !activeRecordId) {
        toast({
          title: "No Inventory Available",
          description: "Please select a store with available inventory.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
  
      try {
        setAddingToCart(true);
        await addCartLineItem({
          ProductID: productId,
          Quantity: quantity,
          InventoryRecordID: activeRecordId,
        });
        setAddingToCart(false);
        toast({
          title: `${quantity} ${pluralize("item", quantity)} added to cart`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        navigate("/cart");
      } catch (error) {
        setAddingToCart(false);
        if (error instanceof OrderCloudError) {
          toast({
            title: "Error adding to cart",
            description:
              error.message ||
              "Please ensure all required specifications are filled out.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        } else {
          console.error("Failed to add item to cart:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    }, [product, activeRecordId, productId, toast, addCartLineItem, quantity, navigate]);
  
    return loading ? (
      <Center h="50vh">
        <Spinner size="xl" thickness="10px" />
      </Center>
    ) : product ? (
      renderProductDetail ? (
        renderProductDetail(product)
      ) : (
        <VStack spacing={8} w="full">
          <SimpleGrid
            as={Container}
            gridTemplateColumns={{ lg: "1.5fr 2fr" }}
            gap={12}
            w="full"
            maxW="container.4xl"
          >
            <ProductImageGallery images={productImages} />
            <VStack alignItems="flex-start" maxW="4xl" gap={4}>
              <Heading maxW="2xl" size="xl">
                {product.Name}
              </Heading>
              <Text color="chakra-subtle-text" fontSize="sm">
                {product.ID}
              </Text>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.Description }}
              />
              <Text fontSize="3xl" fontWeight="medium">
                {formatPrice(product?.PriceSchedule?.PriceBreaks?.[0].Price)}
              </Text>
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
              {!outOfStock && IS_MULTI_LOCATION_INVENTORY && (
                <>
                  <Heading size="sm" color="chakra-subtle-text">
                    {`(${inventoryRecords?.Items.length}) locations with inventory`}
                  </Heading>
                  <HStack spacing={4}>
                    {inventoryRecords?.Items.length &&
                      inventoryRecords?.Items.map((item) => (
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
                            alignItems="flext-start"
                            justifyContent="center"
                            flexFlow="column nowrap"
                          >
                            <Text fontSize="sm">
                              {item.Address.AddressName}
                            </Text>
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
              {productContent.isLoading ? (
                <Center py={8}>
                  <Spinner size="lg" />
                </Center>
              ) : (
                <>
                  {productContent.data?.features && (
                    <VStack spacing={4} align="stretch">
                      <Divider />
                      <Heading size="lg">Product Features</Heading>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: productContent.data.features,
                        }}
                      />
                    </VStack>
                  )}

                  {productContent.data?.technicalSpecs && (
                    <VStack spacing={4} align="stretch" mt={8}>
                      <Divider />
                      <Heading size="lg">Technical Specifications</Heading>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: productContent.data.technicalSpecs,
                        }}
                      />
                    </VStack>
                  )}

                  {productContent.data?.sizingChart && (
                    <VStack spacing={4} align="stretch" mt={8}>
                      <Divider />
                      <Heading size="lg">Sizing Chart</Heading>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: productContent.data.sizingChart,
                        }}
                      />
                    </VStack>
                  )}
                </>
              )}
            </VStack>
          </SimpleGrid>
        </VStack>
      )
    ) : (
      <div>Product not found for ID: {productId}</div>
    );
  };
  
  export default ProductDetailWithContent;
  