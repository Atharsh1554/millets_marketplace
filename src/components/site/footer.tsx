import Link from "next/link";
import { getT } from "@/i18n/server";
import { Logo } from "./brand";

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="mt-20 bg-earth-900 text-earth-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm text-earth-200">{t("footer.about")}</p>
          <p className="mt-4 text-xs text-earth-300">{t("footer.qualityNote")}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{t("footer.shop")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-millet-300" href="/shop?category=WHOLE_GRAIN">{t("footer.wholeGrains")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/shop?category=FLOUR">{t("footer.flour")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/shop?category=SNACKS">{t("footer.snacks")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/shop?category=READY_MIX">{t("footer.readyMixes")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{t("footer.farmersQuality")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-millet-300" href="/sell">{t("footer.sellHarvest")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/how-it-works">{t("footer.howItWorks")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/traceability">{t("footer.traceability")}</Link></li>
            <li><Link className="hover:text-millet-300" href="/login">{t("footer.staffSignIn")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-earth-800 py-5 text-center text-xs text-earth-300">{t("footer.copyright", { year: new Date().getFullYear() })}</div>
    </footer>
  );
}
