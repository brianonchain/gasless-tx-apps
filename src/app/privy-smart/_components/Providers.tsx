"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { PrivyProvider, PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia, baseSepolia, base, polygon } from "viem/chains";

const queryClient = new QueryClient();

export const supportedChains = [sepolia, baseSepolia, base, polygon];

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: "all-users",
    showWalletUIs: false,
  },
  supportedChains,
  loginMethods: ["google", "github"],
  externalWallets: {
    disableAllExternalWallets: true,
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_SMART_APP_ID!} clientId={process.env.NEXT_PUBLIC_PRIVY_SMART_CLIENT_ID!} config={privyConfig}>
      <SmartWalletsProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
