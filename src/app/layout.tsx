import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Devanagari, Noto_Sans_Malayalam, Noto_Sans_Tamil, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { getDictionary, getLocale } from "@/i18n/server";
import { en } from "@/i18n/dictionaries/en";

const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "600", "700"] });
// Script fallbacks for Tamil, Malayalam and Hindi. Only downloaded when those characters are shown.
const tamil = Noto_Sans_Tamil({ variable: "--font-tamil", subsets: ["tamil"], weight: ["400", "600", "700"], preload: false });
const malayalam = Noto_Sans_Malayalam({ variable: "--font-malayalam", subsets: ["malayalam"], weight: ["400", "600", "700"], preload: false });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "600", "700"], preload: false });

export const metadata: Metadata = {
  title: { default: "Millet Market — From Farmer Harvest to Your Family", template: "%s · Millet Market" },
  description:
    "Quality millet products sourced from farmers and carefully reviewed, physically tested and procured through our marketplace.",
};

export const viewport: Viewport = {
  themeColor: "#2f5d34",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const fonts = [body, display, tamil, malayalam, devanagari].map((f) => f.variable).join(" ");
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} dict={getDictionary(locale)} fallback={en}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
