"use client";
// next
import { useState, useEffect } from "react";
// viem
import { createPublicClient, http, getContract, encodePacked, parseUnits, hexToBigInt, parseAbi, isAddress } from "viem";
import type { Hex, Chain, Call } from "viem";
import { baseSepolia, sepolia, base, polygon } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction";
import type { GetPaymasterStubDataReturnType, ToSimple7702SmartAccountReturnType, GetPaymasterStubDataParameters } from "viem/account-abstraction";
// utils
import { chainNameToChain, chainNameToUsdcAddress, chainNameToBundlerUrl, chainNameToRpcUrl } from "@/utils/web3Constants";
import { useUsdcBalanceQuery } from "@/utils/hooks";
import { signPermit } from "@/utils/permit";
import Spinner from "@/utils/components/Spinner";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import { chainNameToCirclePaymasterV08Address } from "@/utils/web3Constants";
import { getGasFeeFromLogs } from "@/utils/functions";

// create local EOA
const owner = privateKeyToAccount(process.env.NEXT_PUBLIC_PRIVATE_KEY! as Hex);
// define supported chains
const supportedChains = [sepolia, baseSepolia, base, polygon];

export default function App() {
  // states
  const [smartAccount, setSmartAccount] = useState<ToSimple7702SmartAccountReturnType | undefined>(undefined);
  const [chain, setChain] = useState<Chain | undefined>(sepolia);
  const [toAddress, setToAddress] = useState<string>("");
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [gasFee, setGasFee] = useState<string | undefined>(undefined);
  // hooks that use states
  const { usdcBalance } = useUsdcBalanceQuery({ chain, accountAddress: owner.address });

  // initialize smart account
  useEffect(() => {
    if (chain) {
      (async () => {
        const client = createPublicClient({ chain: chain, transport: http(chainNameToRpcUrl[chain.name]) });
        const _smartAccount = await toSimple7702SmartAccount({ client, owner });
        setSmartAccount(_smartAccount);
      })();
    }
  }, [chain]);

  async function send() {
    if (!smartAccount || !chain || !toAddress || !usdcAmount || !isAddress(toAddress) || Number(usdcAmount) > Number(usdcBalance)) {
      setError("Invalid inputs");
      return;
    }

    setIsSending("sending");

    const usdcAddress = chainNameToUsdcAddress[chain.name];
    const paymasterAddress = chainNameToCirclePaymasterV08Address[chain.name];
    const permitAmount = "0.05"; // estimated gas fee

    // create public client
    const publicClient = createPublicClient({ chain, transport: http(chainNameToRpcUrl[chain.name]) });

    // define getPaymasterData(), same return type as pm_getPaymasterStubData
    async function getPaymasterData(userOperation: GetPaymasterStubDataParameters): Promise<GetPaymasterStubDataReturnType> {
      // sign permit
      const permitSignature = await signPermit({
        tokenAddress: usdcAddress,
        account: smartAccount,
        client: publicClient,
        spenderAddress: paymasterAddress,
        permitAmount: parseUnits(permitAmount, 6),
      });

      // create paymaster data
      const paymasterData = encodePacked(["uint8", "address", "uint256", "bytes"], [0, usdcAddress, parseUnits(permitAmount, 6), permitSignature]);

      return {
        paymaster: paymasterAddress,
        paymasterData,
        paymasterVerificationGasLimit: 200000n,
        paymasterPostOpGasLimit: 15000n,
        isFinal: true,
      };
    }

    // create bundler client; useOps sent to Pimlico's Bundler
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

    // sign authorization
    const authorization = await owner.signAuthorization({
      chainId: chain.id,
      nonce: await publicClient.getTransactionCount({ address: owner.address }),
      contractAddress: smartAccount.authorization.address,
    });

    // send user operation
    const userOpHash = await bundlerClient.sendUserOperation({
      calls: [
        {
          to: usdcAddress,
          abi: parseAbi(["function transfer(address,uint)"]),
          functionName: "transfer",
          args: [toAddress as Hex, parseUnits(usdcAmount, 6)],
        },
      ],
      authorization,
    });

    // get tx hash & gas fee
    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
    console.log("receipt", receipt);
    const _txHash = receipt.receipt.transactionHash;
    if (_txHash) {
      setTxHash(_txHash);
      const _gasFee = getGasFeeFromLogs(receipt.logs);
      setGasFee(_gasFee);
      setIsSending("sent");
      setUsdcAmount("");
      setToAddress("");
    } else {
      throw new Error("no txHash");
    }
  }

  return (
    <div className="pt-6 px-3 w-full h-screen flex flex-col items-center justify-between textSmApp">
      <div className="w-full max-w-[400px] h-full flex flex-col gap-4">
        {/*--- ACCOUNT INFO ---*/}
        <div className="space-y-2">
          <p className="text-xl font-bold">Account Info</p>
          <div>
            <p className="underline underline-offset-2">Local EOA</p>
            <div>{owner.address}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Singleton Smart Account Address</p>
            {/* <div>{address ? address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div> */}
          </div>
          <div>
            <p className="underline underline-offset-2">Network</p>
            <div>{chain?.name}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">USDC Balance</p>
            <div>{usdcBalance ? usdcBalance : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
        </div>

        {/*--- Select Chain ---*/}
        <div className="space-y-1">
          <p className="text-xl font-bold">Select Chain</p>
          <div className="flex gap-2">
            {supportedChains.map((i: any) => (
              <button
                key={i.name}
                className={`${chain?.name === i.name ? "bg-blue-500 text-white" : ""} font-medium px-2 py-1 border-2 border-blue-500 rounded-md`}
                onClick={async () => setChain(i)}
              >
                <p>{i.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/*--- SEND USDC ---*/}
        <div className="space-y-2">
          {/*--- description ---*/}
          <div>
            <p className="text-xl font-bold">Send USDC</p>
            <p className="text-sm leading-tight"></p>
          </div>
          {/*--- inputs ---*/}
          <div className="space-y-2">
            <label>To Address:</label>
            <input
              type="text"
              className="w-full px-2 py-1 border border-gray-400 rounded-md focus:outline-[1px] outline-blue-500"
              onChange={(e) => setToAddress(e.target.value)}
              onBlur={(e) => {
                if (e.target.value && !isAddress(e.target.value)) {
                  setToAddress("");
                  setError("Invalid address");
                }
              }}
              value={toAddress}
            />
            <label>USDC Amount:</label>
            <input
              type="text"
              className="w-full px-2 py-1 border border-gray-400 rounded-md focus:outline-[1px] outline-blue-500"
              placeholder="0.00"
              onChange={(e) => setUsdcAmount(e.target.value)}
              onBlur={(e) => {
                if (e.target.value) {
                  if (Number(e.target.value) > Number(usdcBalance)) {
                    setUsdcAmount("");
                    setError("Insufficient funds");
                  }
                }
              }}
              value={usdcAmount}
            />
            <button className="mt-1 w-full appButton1Light" type="button" onClick={send} disabled={isSending === "sending" ? true : false}>
              {isSending === "sending" ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner />
                  <p>Sending...</p>
                </div>
              ) : (
                "Send"
              )}
            </button>
            {txHash && (
              <div>
                <p>
                  USDC sent!{" "}
                  <a className="link" href={`${chain?.blockExplorers?.default.url}/tx/${txHash}`} target="_blank">
                    View on {chain?.blockExplorers?.default.name}
                  </a>
                </p>
                {gasFee && <p>Gas fee: {gasFee} USDC</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <ErrorModalLight error={error} setError={setError} />}
    </div>
  );
}
