import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// web3auth
import { headers } from "next/headers";
import Providers from "./_components/Providers";
import { cookieToWeb3AuthState } from "@web3auth/modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3Auth Test",
  description: "Web3Auth Test",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  console.log("layout.tsx");
  const web3authInitialState = cookieToWeb3AuthState(decodeURIComponent((await headers()).get("cookie") ?? ""));

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased textBaseApp bg-light2 text-lightText1`}>
        <Providers web3authInitialState={web3authInitialState}>{children}</Providers>
      </body>
    </html>
  );
}
