"use client";
import { useEffect, useState, createContext, useContext } from "react";
// privy
import { usePrivy } from "@privy-io/react-auth";
// viem
import { entryPoint08Address, createBundlerClient, BundlerClient } from "viem/account-abstraction";
import { createPublicClient, http } from "viem";
// wagmi
import { useAccount } from "wagmi";
import { useWalletClient } from "wagmi";
// permissionless
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { toSimpleSmartAccount } from "permissionless/accounts";
// utils
import { chainNameToRpcUrl, chainNameToBundlerUrl, chainNameToUsdcAddress } from "@/utils/web3Constants";

// Create context & custom hook to use it
const BundlerContext = createContext<BundlerClient | undefined>(undefined);
export const useBundlerClient = () => useContext(BundlerContext);

export default function BundlerProvider({ children }: { children: React.ReactNode }) {
  // hooks
  const { authenticated } = usePrivy();
  const { data: walletClient } = useWalletClient();
  const { chain } = useAccount();
  // states
  const [bundlerClient, setBundlerClient] = useState<BundlerClient | undefined>(undefined);

  // set bundlerClient on mount
  useEffect(() => {
    (async () => {
      if (authenticated && walletClient && chain) {
        console.log("setting bundlerClient...");
        try {
          // create simpleSmartAccount
          const publicClient = createPublicClient({ chain, transport: http(chainNameToRpcUrl[chain.name]) });
          const simpleSmartAccount = await toSimpleSmartAccount({
            client: publicClient,
            owner: walletClient,
            entryPoint: {
              address: entryPoint08Address,
              version: "0.8",
            },
            address: walletClient.account.address,
          });

          // create & set bundler client
          const pimlicoClient = createPimlicoClient({ transport: http(chainNameToBundlerUrl[chain.name]) });
          const bundlerClient = createBundlerClient({
            account: simpleSmartAccount,
            chain,
            transport: http(chainNameToBundlerUrl[chain.name]),
            paymaster: pimlicoClient,
            paymasterContext: {
              token: chainNameToUsdcAddress[chain.name],
            },
            userOperation: {
              estimateFeesPerGas: async () => {
                return (await pimlicoClient.getUserOperationGasPrice()).fast;
              },
            },
          });
          setBundlerClient(bundlerClient);
        } catch (error) {
          console.error("Error creating bundler client:", error);
          setBundlerClient(undefined);
        }
      } else {
        setBundlerClient(undefined);
      }
    })();
  }, [authenticated, walletClient, chain]);

  return <BundlerContext.Provider value={bundlerClient}>{children}</BundlerContext.Provider>;
}

// create smart account client (permissionless's version of bundlerClient)
// const _smartAccountClient = createSmartAccountClient({
//   account: simpleSmartAccount,
//   chain,
//   bundlerTransport: http(chainNameToBundlerUrl[chain.name]),
//   paymaster: pimlicoClient,
//   userOperation: {
//     estimateFeesPerGas: async () => {
//       return (await pimlicoClient.getUserOperationGasPrice()).fast;
//     },
//   },
// });
// console.log("smartAccountClient", _smartAccountClient);
