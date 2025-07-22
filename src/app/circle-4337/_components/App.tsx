"use client";
// next
import { useState, useEffect } from "react";
// viem
import { createPublicClient, http, getContract, encodePacked, parseUnits, hexToBigInt, parseAbi } from "viem";
import type { Hex, Chain, Call } from "viem";
import { base, arbitrum, polygon, optimism } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient } from "viem/account-abstraction";
import type { GetPaymasterStubDataReturnType, GetPaymasterStubDataParameters } from "viem/account-abstraction";
// permissionless
import { toSafeSmartAccount } from "permissionless/accounts";
// circle
import { toCircleSmartAccount, type ToCircleSmartAccountReturnType } from "@circle-fin/modular-wallets-core";
// utils
import { chainNameToChain, chainNameToUsdcAddress, chainNameToBundlerUrl, chainNameToRpcUrl } from "@/utils/web3Constants";
import { useUsdcBalanceQuery } from "@/utils/hooks";
import { signPermit } from "@/utils/permit";

const owner = privateKeyToAccount(process.env.NEXT_PUBLIC_PRIVATE_KEY! as Hex);

export default function App() {
  // states
  const [smartAccount, setSmartAccount] = useState<ToCircleSmartAccountReturnType | null>(null);
  const [chain, setChain] = useState<Chain | null>(base);
  // hooks
  const { usdcBalance } = useUsdcBalanceQuery({ accountAddress: smartAccount?.address, chain });

  // initialize smart account
  useEffect(() => {
    if (chain) {
      (async () => {
        const client = createPublicClient({ chain: chain, transport: http(chainNameToRpcUrl[chain.name]) });
        const _smartAccount = await toCircleSmartAccount({ client, owner });
        console.log("smartAccount", _smartAccount);
        setSmartAccount(_smartAccount);
      })();
    }
  }, [chain]);

  async function switchChain(chainName: string) {
    const newChain = chainNameToChain[chainName];
    setChain(newChain);
  }

  async function send() {
    if (!smartAccount || !chain) return;
    const toAddress = process.env.NEXT_PUBLIC_TO_ADDRESS! as Hex;
    const usdcAmount = "0.02";
    const usdcAddress = chainNameToUsdcAddress[chain.name];
    const paymasterAddress = "0x6C973eBe80dCD8660841D4356bf15c32460271C9";

    // create public client
    const publicClient = createPublicClient({ chain: chain!, transport: http(chainNameToRpcUrl[chain.name]) });

    // define getPaymasterData() custom function, same return type as pm_getPaymasterStubData
    async function getPaymasterData(userOperation: GetPaymasterStubDataParameters): Promise<GetPaymasterStubDataReturnType> {
      const permitAmount = parseUnits("0.1", 6);
      const permitSignature = await signPermit({
        tokenAddress: usdcAddress,
        account: smartAccount,
        client: publicClient,
        spenderAddress: paymasterAddress,
        permitAmount: permitAmount,
      });
      const paymasterData = encodePacked(["uint8", "address", "uint256", "bytes"], [0, usdcAddress, permitAmount, permitSignature]);
      return {
        paymaster: paymasterAddress,
        paymasterData,
        paymasterVerificationGasLimit: 200000n,
        paymasterPostOpGasLimit: 15000n,
        isFinal: true,
      };
    }

    // create bundler client
    const bundlerClient = createBundlerClient({
      account: smartAccount,
      client: publicClient,
      transport: http(chainNameToBundlerUrl[chain.name]),
      paymaster: { getPaymasterData },
      userOperation: {
        estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
          const { standard: fees } = await (bundlerClient as any).request({ method: "pimlico_getUserOperationGasPrice" });
          return { maxFeePerGas: hexToBigInt(fees.maxFeePerGas), maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas) };
        },
      },
    });

    const userOpHash = await bundlerClient.sendUserOperation({
      calls: [
        {
          to: usdcAddress,
          abi: parseAbi(["function transfer(address,uint)"]),
          functionName: "transfer",
          args: [toAddress, parseUnits(usdcAmount, 6)],
        },
      ],
    });

    console.log("waiting for user operation receipt...");
    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
    console.log("Transaction hash", receipt.receipt.transactionHash);
  }

  return (
    <div className="pt-8 px-3 w-full h-screen flex flex-col items-center justify-between textSmApp">
      <div className="w-full max-w-[400px] h-full flex flex-col gap-4">
        <p>Address: {smartAccount?.address}</p>
        <p>USDC Balance: {usdcBalance}</p>
        <button onClick={send} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Send
        </button>
      </div>
    </div>
  );
}
