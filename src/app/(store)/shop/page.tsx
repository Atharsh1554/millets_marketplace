import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = { title: "Shop millet" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  return <ShopView sp={await searchParams} />;
}
