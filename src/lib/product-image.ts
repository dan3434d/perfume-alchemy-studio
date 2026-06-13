import defaultBottle from "@/assets/perfume-bottle.jpg";

export const DEFAULT_PRODUCT_IMAGE = defaultBottle;

export const productImage = (url?: string | null) => url || DEFAULT_PRODUCT_IMAGE;
