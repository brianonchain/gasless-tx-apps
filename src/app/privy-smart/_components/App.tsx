"use client";
// next
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// privy
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
// viem
import { parseUnits, isAddress, parseAbi, encodeFunctionData, http, createPublicClient } from "viem";
import type { Hex, Call, Chain } from "viem";
import { createPaymasterClient, createBundlerClient } from "viem/account-abstraction";
import { polygon } from "viem/chains";
// utils
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import { replacer, getGasFeeFromLogs, getPimlicoGasPrice } from "@/utils/functions";
import { supportedChains } from "./Providers";
import { useUsdcBalanceQuery } from "@/utils/hooks";
import { chainNameToRpcUrl, chainNameToUsdcAddress } from "@/utils/web3Constants";

export default function App() {
  // hooks
  const { ready: privyReady, authenticated, logout, user } = usePrivy();
  const { client: bundlerClient } = useSmartWallets();
  const router = useRouter();
  const { wallets } = useWallets();
  // states
  const [toAddress, setToAddress] = useState<string>("");
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sendStatus, setSendStatus] = useState("initial"); // initial | sending | sent
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [gasFee, setGasFee] = useState<string | undefined>(undefined);
  const [gasPrice, setGasPrice] = useState<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | undefined>(undefined);
  // hooks that use states
  const { usdcBalance } = useUsdcBalanceQuery({ accountAddress: user?.smartWallet?.address as Hex, chain: bundlerClient?.chain });
  // logs
  console.log("privyReady", privyReady, "authenticated", authenticated);
  console.log("bundlerClient", bundlerClient);
  console.log("user", user);
  console.log("user.linkedAccounts", user?.linkedAccounts);
  console.log("wallets", wallets);

  // if privyRead is true but authenticated is false, means user is not logged in, used for logout and if unathenticated user visits this page
  useEffect(() => {
    if (privyReady && !authenticated) {
      router.push("/privy-smart/login");
    }
  }, [privyReady, authenticated]);

  // set gas price
  useEffect(() => {
    // getTokenQuotes();
    // getGasPrice();
  }, []);

  async function getGasPrice() {
    const _gasPrice = await getPimlicoGasPrice();
    setGasPrice(_gasPrice);
  }

  async function resetStates() {
    setTxHash(undefined);
    setGasFee(undefined);
  }

  async function send() {
    resetStates();

    // validate inputs
    if (!bundlerClient || !toAddress || !usdcAmount || !usdcBalance || !isAddress(toAddress) || Number(usdcAmount) > Number(usdcBalance)) {
      setError("Invalid inputs");
      return;
    }
    setSendStatus("sending");

    // define constants
    const rpcUrl = chainNameToRpcUrl[bundlerClient.chain.name];
    const usdcAddress = chainNameToUsdcAddress[bundlerClient.chain.name];
    const paymasterAddress = "0x777777777777AeC03fd955926DbF81597e66834C"; // Pimlico's ERC-20 Paymaster v0.7

    // send transaction
    const _txHash = await bundlerClient.sendTransaction({
      calls: [
        {
          to: usdcAddress,
          data: encodeFunctionData({
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: [paymasterAddress, parseUnits("0.1", 6)],
          }),
        },
        {
          to: usdcAddress,
          data: encodeFunctionData({
            abi: parseAbi(["function transfer(address,uint)"]),
            functionName: "transfer",
            args: [toAddress, parseUnits(usdcAmount, 6)],
          }),
        },
      ],
      paymasterContext: { token: usdcAddress },
    });
    console.log("txHash", _txHash);

    // get txHash and gas
    if (!_txHash) throw new Error("No txHash");
    const publicClient = createPublicClient({
      chain: bundlerClient.chain,
      transport: http(rpcUrl),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: _txHash });
    console.log("receipt", receipt);
    if (!receipt) throw new Error("No receipt");
    setTxHash(_txHash);
    const _gasFee = getGasFeeFromLogs(receipt.logs);
    setGasFee(_gasFee);
    setSendStatus("sent");
    setUsdcAmount("");
    setToAddress("");
  }

  async function onClickLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/privy-smart/login");
    } catch (e) {
      setIsLoggingOut(false);
      console.error("Logout failed", e);
    }
  }

  return (
    <div className="py-6 px-3 w-full min-h-screen flex justify-center">
      <div className="w-full max-w-[400px] space-y-4">
        {/*--- ACCOUNT INFO ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Account Info</p>
          <div>
            <p className="underline underline-offset-2">Login Method</p>
            <div>{user?.linkedAccounts?.[0]?.type}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Embedded EOA (owner of Smart Account)</p>
            <div>{user ? user.wallet?.address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Smart Account</p>
            <div>{user ? user.smartWallet?.address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Smart Account Type</p>
            <p>{user?.smartWallet?.smartWalletType}</p>
          </div>
          <div>
            <p className="underline underline-offset-2">Network</p>
            <div>{bundlerClient ? bundlerClient.chain?.name : <div className="w-[300px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">USDC Balance</p>
            <div>{usdcBalance ? usdcBalance : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
        </div>

        {/*--- SELECT CHAIN ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Select Chain</p>
          <div className="flex gap-2">
            {supportedChains.map((i: Chain) => (
              <button
                key={i.name}
                type="button"
                className={`${bundlerClient?.chain?.name === i.name ? "bg-lightButton text-white" : ""} font-medium px-2 py-1 border-2 border-lightButton rounded-md`}
                onClick={async () => {
                  resetStates();
                  await bundlerClient?.switchChain({ id: i.id });
                }}
              >
                <p>{i.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/*--- MAKE GASLESS USDC TRANSFER ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Make Gasless USDC Transfer</p>
          {/*--- description ---*/}
          <p className="text-sm leading-tight">
            First, send some USDC to this account. Then, send USDC to any address. Gas will be paid by USDC in this account using Pimlico's ERC-20 Paymaster.
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
            <button className="mt-2 w-full appButton1" type="button" onClick={send} disabled={sendStatus === "sending" ? true : false}>
              {sendStatus === "sending" ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner />
                  <p>Sending...</p>
                </div>
              ) : (
                "Send"
              )}
            </button>
            {txHash && (
              <p className="mt-1">
                USDC sent!{" "}
                <a className="link" href={`${bundlerClient?.chain?.blockExplorers?.default.url}/tx/${txHash}`} target="_blank">
                  View on {bundlerClient?.chain?.blockExplorers?.default.name}
                </a>
              </p>
            )}
            {gasFee && <p>Gas Fee: {gasFee} USDC</p>}
          </div>
        </div>

        {/*--- LOGOUT BUTTON ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Logout</p>
          <button className="w-full appButtonRed" onClick={onClickLogout}>
            {isLoggingOut ? "Logging Out..." : "Log Out"}
          </button>
        </div>
      </div>

      {error && <ErrorModalLight error={error} setError={setError} />}
    </div>
  );
}
