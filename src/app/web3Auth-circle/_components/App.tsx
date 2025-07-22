"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// wagmi
import { useAccount, useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
// web3Auth
import { useWeb3Auth, useWeb3AuthDisconnect } from "@web3auth/modal/react";
// viem
import { parseAbi, parseUnits, formatUnits, isAddress, hexToBigInt, parseGwei, decodeFunctionData, createPublicClient, http, encodePacked } from "viem";
import { createBundlerClient, GetPaymasterStubDataParameters, GetPaymasterStubDataReturnType } from "viem/account-abstraction";
// utils
import { chainNameToUsdcAddress, chainNameToRpcUrl, chainNameToBundlerUrl } from "@/utils/web3Constants";
import { useReadUsdcBalance } from "@/utils/hooks";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import entryPoint07Abi from "@/utils/abis/entryPoint07Abi.json";
import { replacer, getGasFeeFromLogs } from "@/utils/functions";
import { signPermit } from "@/utils/permit";
import LogoutButton from "@/utils/components/LogoutButton";

export default function App() {
  // hooks
  const { address, chain } = useAccount();
  const config = useConfig();
  const { status: web3AuthStatus, web3Auth } = useWeb3Auth();
  const { data: usdcBalance } = useReadUsdcBalance({ accountAddress: address, chain });
  const router = useRouter();
  const { disconnect, loading: isLoggingOut } = useWeb3AuthDisconnect();
  // states
  const [toAddress, setToAddress] = useState<string | undefined>(""); // used as input value so must use ""
  const [usdcAmount, setUsdcAmount] = useState<string | undefined>(""); // used as input value so must use ""
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState("initial"); // initial | sending | sent
  const [estimatedGasFee, setEstimatedGasFee] = useState<string | undefined>(undefined);
  const [gasFee, setGasFee] = useState<string | undefined>(undefined); // actual gas fee
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  // logs
  console.log("web3AuthStatus:", web3AuthStatus);

  // web3AuthStatus=ready means there is (and will be) no connection
  useEffect(() => {
    if (web3AuthStatus === "ready") {
      router.push("/web3Auth-circle/login");
    }
  }, [web3AuthStatus]);

  async function send() {
    setTxHash(undefined);
    setGasFee(undefined);
    if (!chain) throw new Error("No chain");

    const usdcAddress = chainNameToUsdcAddress[chain.name];
    const paymasterAddress = "0x6C973eBe80dCD8660841D4356bf15c32460271C9";
    const rpcUrl = chainNameToRpcUrl[chain.name];
    const bundlerUrl = chainNameToBundlerUrl[chain.name];
    const smartAccount = web3Auth?.accountAbstractionProvider?.smartAccount;

    try {
      if (!toAddress || !usdcAmount || !usdcBalance || usdcAmount > usdcBalance || !isAddress(toAddress) || !smartAccount || !chain) throw new Error("Invalid inputs");
      setIsSending("sending");

      // create public client
      const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

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
        transport: http(bundlerUrl),
        paymaster: { getPaymasterData },
        userOperation: {
          estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
            const { standard: fees } = await (bundlerClient as any).request({ method: "pimlico_getUserOperationGasPrice" });
            return { maxFeePerGas: hexToBigInt(fees.maxFeePerGas), maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas) };
          },
        },
      });

      // send user operation
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
    } catch (e) {
      setError(`Transaction failed`);
      console.error(e);
      setIsSending("initial");
    }
  }

  async function onClickLogout() {
    try {
      await disconnect();
      router.push("/web3Auth-pimlico/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  return (
    <div className="appContainer1">
      <div className="appContainer2">
        {/*--- ACCOUNT INFO ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Smart Contract Wallet Info</p>
          <div>
            <p className="underline underline-offset-2">Smart Account Address</p>
            <div>{address ? address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Network</p>
            <div>{chain ? chain.name : <div className="w-[300px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">USDC Balance</p>
            <div>{usdcBalance ? usdcBalance : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
        </div>

        {/*--- ACTIONS ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Send USDC</p>
          <p className="text-sm leading-tight">
            Send USDC tokens from this Smart Contract Wallet to any address. Gas fees will be paid by USDC tokens in the Smart Contract Wallet using Circle's ERC-20 Paymaster. You
            may need to send some USDC to your Smart Contract Wallet first.
          </p>
          {/*--- inputs ---*/}
          <div className="space-y-2">
            <label className="font-medium">To Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-400 rounded-md focus:outline-[1px] outline-blue-500"
              onChange={(e) => setToAddress(e.target.value)}
              onBlur={(e) => {
                if (e.target.value && !isAddress(e.target.value)) {
                  setError("Invalid address");
                }
              }}
              value={toAddress}
            />
            <label className="font-medium">USDC Amount</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-400 rounded-md focus:outline-[1px] outline-blue-500"
              placeholder="0.00"
              onChange={(e) => setUsdcAmount(e.target.value)}
              onBlur={(e) => {
                if (e.target.value) {
                  if (Number(e.target.value) > Number(usdcBalance)) {
                    setError("Insufficient funds");
                  }
                }
              }}
              value={usdcAmount}
            />
            {/* <div>
              Estimated max gas fee: {estimatedGasFee ? estimatedGasFee : <span className="inline-block w-[80px] bg-slate-300 animate-pulse text-transparent rounded-md">0</span>}
            </div> */}
            <button className="mt-2 w-full appButton1" type="button" onClick={send} disabled={isSending === "sending" ? true : false}>
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
                <p>USDC sent!</p>
                <p>
                  View on PolygonScan:{" "}
                  <a className="link" href={`https://polygonscan.com/tx/${txHash}`} target="_blank">
                    link
                  </a>
                </p>
                <p>Gas fee: {gasFee} USDC</p>
              </div>
            )}
          </div>
        </div>
        <LogoutButton isLoggingOut={isLoggingOut} onClickLogout={onClickLogout} />
      </div>
      {error && <ErrorModalLight error={error} setError={setError} />}
    </div>
  );
}
