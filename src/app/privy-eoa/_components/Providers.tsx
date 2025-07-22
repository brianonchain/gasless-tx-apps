"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider, PrivyClientConfig } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { http } from "viem";
import { sepolia, baseSepolia, base, polygon } from "viem/chains";
import { chainNameToRpcUrl } from "@/utils/web3Constants";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: false,
  },
  supportedChains: [sepolia, baseSepolia, base, polygon],
  loginMethods: ["google"],
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
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
