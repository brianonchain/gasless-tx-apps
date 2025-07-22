"use client";
// privy
import { PrivyProvider, PrivyClientConfig } from "@privy-io/react-auth";
// wagmi
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
// viem
import { http } from "viem";
import { sepolia, polygon, base, baseSepolia } from "viem/chains";
// components
import BundlerProvider from "./BundlerProvider";
// utils
import { chainNameToRpcUrl } from "@/utils/web3Constants";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: "all-users",
    showWalletUIs: false,
  },
  supportedChains: [sepolia, baseSepolia, base, polygon],
  loginMethods: ["google", "github"],
  externalWallets: {
    disableAllExternalWallets: true,
  },
};

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [sepolia, baseSepolia, base, polygon],
  transports: {
    [sepolia.id]: http(chainNameToRpcUrl[sepolia.name]),
    [baseSepolia.id]: http(chainNameToRpcUrl[baseSepolia.name]),
    [base.id]: http(chainNameToRpcUrl[base.name]),
    [polygon.id]: http(chainNameToRpcUrl[polygon.name]),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <BundlerProvider>{children}</BundlerProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
