"use client";
// web3auth
import { Web3AuthProvider, type Web3AuthContextConfig } from "@web3auth/modal/react";
import { IWeb3AuthState, WEB3AUTH_NETWORK } from "@web3auth/modal";
// wagmi
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// viem
import { numberToHex } from "viem";
import { sepolia, baseSepolia, base, polygon } from "viem/chains";
// utils
import { chainNameToUsdcAddress, chainNameToBundlerUrl } from "@/utils/web3Constants";

const queryClient = new QueryClient();

export const supportedChains = [polygon];

const accountAbstractionConfigChains = supportedChains.map((i) => ({
  chainId: numberToHex(i.id),
  bundlerConfig: {
    url: chainNameToBundlerUrl[i.name],
    paymasterContext: {
      token: chainNameToUsdcAddress[i.name],
    },
  },
}));
console.log("accountAbstractionConfigChains", accountAbstractionConfigChains);

const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_SMART_SINGLE_CLIENT_ID!,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    ssr: true,
    defaultChainId: "0x89",
    accountAbstractionConfig: {
      smartAccountType: "metamask",
      chains: accountAbstractionConfigChains,
    },
  },
};

export default function Providers({ children, web3authInitialState }: { children: React.ReactNode; web3authInitialState: IWeb3AuthState | undefined }) {
  console.log("Providers.tsx");

  return (
    <Web3AuthProvider config={web3AuthContextConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
