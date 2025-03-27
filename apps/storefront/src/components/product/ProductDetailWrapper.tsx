import { useParams } from "react-router-dom";
import ProductDetailWithContent from "./ProductDetailWithContent";

const ProductDetailWrapper = () => {
  const { productId } = useParams<{ productId: string }>();  
  return <ProductDetailWithContent productId={productId || ""} />;
};

export default ProductDetailWrapper;
