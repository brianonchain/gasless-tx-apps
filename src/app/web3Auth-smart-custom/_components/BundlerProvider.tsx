"use client";
import { useState, useEffect, useContext, createContext } from "react";
// viem
import { createPublicClient, http, hexToBigInt } from "viem";
import { createBundlerClient, createPaymasterClient, entryPoint07Address } from "viem/account-abstraction";
import type { BundlerClient } from "viem/account-abstraction";
// permissionless
import { toSafeSmartAccount } from "permissionless/accounts";
// wagmi
import { useWalletClient, useAccount } from "wagmi";
// utils
import { chainNameToPaymasterUrl, chainNameToBundlerUrl, chainNameToUsdcAddress, chainNameToRpcUrl } from "@/utils/web3Constants";

const BundlerClientContext = createContext<BundlerClient | undefined>(undefined);
export const useBundlerClient = () => useContext(BundlerClientContext);

export const BundlerProvider = ({ children }: { children: React.ReactNode }) => {
  const { chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [bundlerClient, setBundlerClient] = useState<BundlerClient | undefined>(undefined);
  console.log("BundlerProvider.tsx, walletClient:", walletClient);

  useEffect(() => {
    if (walletClient && chain) {
      (async () => {
        // create smart account
        const publicClient = createPublicClient({
          chain,
          transport: http(chainNameToRpcUrl[chain.name]),
        });
        const smartAccount = await toSafeSmartAccount({
          client: publicClient,
          owners: [walletClient],
          entryPoint: {
            address: entryPoint07Address,
            version: "0.7",
          },
          version: "1.4.1",
        });

        // create bundlerClient
        const paymasterClient = createPaymasterClient({
          transport: http(chainNameToPaymasterUrl[chain.name]),
        });
        const bundlerClient = createBundlerClient({
          account: smartAccount,
          client: publicClient,
          transport: http(chainNameToBundlerUrl[chain.name]),
          paymaster: paymasterClient,
          paymasterContext: {
            token: chainNameToUsdcAddress[chain.name],
          },
          userOperation: {
            estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
              const { standard: fees } = await (bundlerClient as any).request({ method: "pimlico_getUserOperationGasPrice" });
              return { maxFeePerGas: hexToBigInt(fees.maxFeePerGas), maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas) };
            },
          },
        });

        setBundlerClient(bundlerClient);
      })();
    }
  }, [walletClient, chain]);

  return <BundlerClientContext.Provider value={bundlerClient}>{children}</BundlerClientContext.Provider>;
};
