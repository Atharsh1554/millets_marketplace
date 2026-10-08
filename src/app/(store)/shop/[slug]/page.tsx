import type { Metadata } from "next";
import { ProductView } from "@/components/shop/product-view";
import { productBySlug } from "@/server/services/catalog";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const p = await productBySlug((await params).slug);
  return { title: p?.name ?? "Product", description: p?.description.slice(0, 150) };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return <ProductView slug={(await params).slug} />;
}
