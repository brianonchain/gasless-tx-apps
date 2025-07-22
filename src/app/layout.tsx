import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3Auth Test",
  description: "Web3Auth Test",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  console.log("root layout.tsx");

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased textSmApp bg-light2 text-lightText1`}>{children}</body>
    </html>
  );
}
