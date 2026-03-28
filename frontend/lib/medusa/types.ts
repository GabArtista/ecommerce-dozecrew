// Medusa v2 API response types

export type MedusaProduct = {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  images: { url: string; id: string }[];
  variants: MedusaVariant[];
  options: MedusaOption[];
  tags: { value: string }[];
  categories: { handle: string; name: string }[];
  updated_at: string;
};

export type MedusaVariant = {
  id: string;
  title: string;
  inventory_quantity: number;
  prices: { amount: number; currency_code: string }[];
  options: { option_id: string; value: string }[];
};

export type MedusaOption = {
  id: string;
  title: string;
  values: { value: string }[];
};

export type MedusaCollection = {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  updated_at: string;
};

export type MedusaCart = {
  id: string;
  items: MedusaLineItem[];
  region: { currency_code: string };
  subtotal: number;
  total: number;
  tax_total: number;
};

export type MedusaLineItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total: number;
  variant_id: string;
  title: string;
  variant: MedusaVariant & { product: MedusaProduct };
};

// Re-export shared types used across the app
export type { Cart, CartItem, Collection, Image, Menu, Money, Page, Product, ProductOption, ProductVariant, SEO } from "lib/shopify/types";
