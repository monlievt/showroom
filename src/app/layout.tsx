import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nur Mobil | Showroom Mobil Bekas Apa Adanya & Bergaransi Cek Fisik",
  description:
    "Showroom jual-beli mobil bekas transparan di Jawa Timur. Rusak dibilang rusak, eks laka dibilang eks laka. Setiap unit disertai lembar uji mikron cat 34 titik dan garansi bebas banjir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
