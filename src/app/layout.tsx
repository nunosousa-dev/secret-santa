import type { Metadata } from "next";
import { SiteHeader, SiteFooter, SampleNotice } from "@/components/site-header";
import { getStore } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amigo Secreto · O nosso Natal", template: "%s · Amigo Secreto" },
  description: "Um cantinho da família para partilhar desejos e escolher presentes com carinho.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" data-scroll-behavior="smooth">
      <body>
        <a href="#content" className="skip-link" data-print-hidden>Saltar para o conteúdo</a>
        <SiteHeader />
        {children}
        {getStore().getFamily().demo && <SampleNotice />}
        <SiteFooter year={getStore().getFamily().year} />
      </body>
    </html>
  );
}
