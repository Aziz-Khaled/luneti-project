import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Lunetty",
  description: "Espace client et opticien",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
