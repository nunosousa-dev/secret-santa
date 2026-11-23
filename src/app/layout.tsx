import type { Metadata, Viewport } from "next";
import { InstallBanner } from "@/components/install-banner";
import { SiteHeader, SiteFooter, SampleNotice } from "@/components/site-header";
import { TouchFeedback } from "@/components/touch-feedback";
import { getStore } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amigo Secreto · O nosso Natal", template: "%s · Amigo Secreto" },
  description: "Um cantinho da família para partilhar desejos e escolher presentes com carinho.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#234f3e" };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const family = getStore().getFamily();
  return (
    <html lang="pt-PT">
      <body>
        <a href="#content" className="skip-link" data-print-hidden>Saltar para o conteúdo</a>
        <SiteHeader />
        <InstallBanner />
        {children}
        {family.demo && <SampleNotice />}
        <SiteFooter />
        <TouchFeedback />
      </body>
    </html>
  );
}
