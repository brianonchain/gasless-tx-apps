"use client";
// next
import { useState, useMemo, createContext, useContext } from "react";
// web3auth
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
// wagmi
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// viem
import { numberToHex } from "viem";
import { sepolia, baseSepolia, base, polygon } from "viem/chains";
// utils
import { BundlerProvider } from "./BundlerProvider";
import { chainNameToBundlerUrl, chainNameToPaymasterUrl, chainNameToUsdcAddress } from "@/utils/web3Constants";

const queryClient = new QueryClient();

export const supportedChains = [sepolia, baseSepolia, base, polygon];

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_EOA_CLIENT_ID!,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
  },
};

export default function Providers({ children, web3authInitialState }: { children: React.ReactNode; web3authInitialState: IWeb3AuthState | undefined }) {
  console.log("Providers.tsx");

  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <BundlerProvider>{children}</BundlerProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
