import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { CH_GRAPHQL_ENDPOINT, CH_GRAPHQL_API_KEY } from "../constants";

interface MultiLanguageContent {
  "en-US": string;
}

interface AssetUrl {
  url: string;
  expiredOn: string | null;
  resource: string;
  metadata: {
    colorspace?: string;
    content_type: string;
    extension?: string;
    filename?: string;
    filesize?: number;
    filesizebytes?: string;
    group?: string;
    height?: string;
    megapixels?: string;
    resolution?: string;
    width?: string;
  };
}

interface AssetUrls {
  [key: string]: AssetUrl;
}

interface Asset {
  urls: AssetUrls;
}

interface MasterAsset {
  pCMProductToAsset: {
    results: Asset[];
  };
}

interface ProductAsset {
  pCMProductToMasterAsset: {
    results: MasterAsset[];
  };
  urls: AssetUrls;
}

interface Product {
  productLongDescription: MultiLanguageContent;
  productFeatures: MultiLanguageContent;
  productTechnicalSpecifications: MultiLanguageContent;
  productSizingChart: MultiLanguageContent;
  pCMProductToAsset: {
    results: ProductAsset[];
  };
}

interface ProductResponse {
  data: {
    allM_PCM_Product: {
      results: Product[];
    };
  };
}

interface SimplifiedProduct {
  description: string;
  features: string;
  technicalSpecs: string;
  sizingChart: string | null;
  coverImage: AssetUrl[] | null;
  images: AssetUrls[] | null;
}

function getCoverImageRenditions(product: Product): AssetUrl[] | null {
  // There should only be one master asset per product
  const firstMasterAsset = product.pCMProductToAsset.results.find(asset => asset.pCMProductToMasterAsset.results.length > 0);
  if (!firstMasterAsset) return null;
  const assets = firstMasterAsset.pCMProductToMasterAsset.results[0]?.pCMProductToAsset.results;
  return assets.map(asset => Object.values(asset.urls)).flat();
}

const fetchProduct = async (productId: string): Promise<SimplifiedProduct | null> => {
  const { data } = await axios.post<ProductResponse>(
    CH_GRAPHQL_ENDPOINT,
    {
      query: `
        query GetProduct($productId: String!) {
          allM_PCM_Product(where: { orderCloudID_eq: $productId }) {
            results {
              productLongDescription
              productFeatures
              productTechnicalSpecifications
              productSizingChart
              pCMProductToAsset {
                results {
                  pCMProductToMasterAsset {
                    results {
                      pCMProductToAsset {
                        results {
                          urls
                        }
                      }
                    }
                  }
                  urls
                }
              }
            }
          }
        }
      `,
      variables: {
        productId,
      },
    },
    {
      headers: {
        "X-GQL-Token": CH_GRAPHQL_API_KEY,
      },
    }
  );

  const results = data.data.allM_PCM_Product.results;
  const hasResults = results.length > 0;
  if (!hasResults) return null;
  const product = results[0];

  // Transform the data into a simpler structure
  return {
    description: product.productLongDescription["en-US"],
    features: product.productFeatures["en-US"],
    technicalSpecs: product.productTechnicalSpecifications["en-US"],
    sizingChart: product.productSizingChart["en-US"],
    coverImage: getCoverImageRenditions(product),
    images: product.pCMProductToAsset.results.map(asset => asset.urls)
  };
};

export const useProductContent = (productId: string) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
    retry: 3,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
