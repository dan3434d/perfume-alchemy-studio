import defaultBottle from "@/assets/products/Imagination_Storm.jpeg.asset.json";

export const DEFAULT_PRODUCT_IMAGE = defaultBottle.url;

export const productImage = (url?: string | null) => url || DEFAULT_PRODUCT_IMAGE;

