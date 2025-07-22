"use client";
// next
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// wagmi
import { useAccount, useSwitchChain, useWriteContract, useBalance, useWaitForTransactionReceipt } from "wagmi";
// viem
import { parseUnits, formatUnits, isAddress } from "viem";
import type { Hex, Chain } from "viem";
// privy
import { usePrivy } from "@privy-io/react-auth";
// utils
import { useReadUsdcBalance } from "@/utils/hooks";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import erc20Abi from "@/utils/abis/erc20Abi";
import LogoutButton from "@/utils/components/LogoutButton";
import { chainNameToUsdcAddress } from "@/utils/web3Constants";

export default function App() {
  // refs
  const initializeRef = useRef(false);
  // hooks
  const { status: wagmiStatus, address, chain } = useAccount();
  console.log("chain", chain);
  const { writeContractAsync: sendUsdc, status: sendUsdcStatus } = useWriteContract();
  const { data: gasTokenData } = useBalance({ address });
  const { ready: privyReady, authenticated, logout, user } = usePrivy();
  const { switchChain, chains } = useSwitchChain();
  const router = useRouter();
  // states
  const [toAddress, setToAddress] = useState<string>("");
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // hooks that use states
  const { data: receiptData, status: receiptStatus } = useWaitForTransactionReceipt({ hash: txHash });
  const { data: usdcBalance } = useReadUsdcBalance({ accountAddress: address, chain });
  // logs
  console.log("privyReady", privyReady, "authenticated", authenticated);
  console.log("wagmiStatus", wagmiStatus, "address", address);
  console.log("data", receiptData);
  console.log("user", user);
  console.log("sendUsdcStatus", sendUsdcStatus);
  console.log("receiptStatus", receiptStatus);
  console.log("gasTokenData", gasTokenData);

  // if privyRead is true but authenticated is false, means user is not logged in
  // used for logout and if unathenticated user visits this page
  useEffect(() => {
    if (privyReady && !authenticated && !initializeRef.current) {
      initializeRef.current = true;
      router.push("/privy-eoa/login");
    }
  }, [privyReady, authenticated]);

  async function send1() {
    setTxHash(undefined);
    if (!toAddress || !usdcAmount || !usdcBalance || !isAddress(toAddress) || Number(usdcAmount) > Number(usdcBalance) || !chain) {
      setError("Invalid inputs");
      return;
    }

    const usdcAddress = chainNameToUsdcAddress[chain.name];

    try {
      await sendUsdc(
        {
          abi: erc20Abi,
          address: usdcAddress,
          functionName: "transfer",
          args: [toAddress, parseUnits(usdcAmount, 6)],
        },
        {
          onSuccess: (_txHash) => {
            setTxHash(_txHash);
            setUsdcAmount("");
            setToAddress("");
          },
          // onError: (e) => setError("USDC was not sent."), // like try/catch better, since error is still thrown even with this
        }
      );
    } catch (e) {
      setError("USDC was not sent.");
    }
  }

  async function onClickLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/privy-eoa/login");
    } catch (e) {
      setIsLoggingOut(false);
      console.error("Logout failed", e);
    }
  }

  return (
    <div className="appContainer1">
      <div className="appContainer2">
        {/*--- ACCOUNT INFO ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Your Account Info</p>
          <div>
            <p className="underline underline-offset-2">Login Method</p>
            <div>Google social login</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Account Type</p>
            <p>Privy's embedded EOA</p>
          </div>
          <div>
            <p className="underline underline-offset-2">Address</p>
            <div className="break-all">{address ? address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Network</p>
            <div>{chain ? chain.name : <div className="w-[300px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Gas Token Balance{gasTokenData && <span> ({gasTokenData.symbol})</span>}</p>
            <div>
              {gasTokenData ? formatUnits(gasTokenData.value, gasTokenData.decimals) : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}
            </div>
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
            {chains.map((i: Chain) => (
              <button
                key={i.name}
                className={`${chain?.name === i.name ? "bg-lightButton text-white" : ""} font-medium px-2 py-1 border-2 border-lightButton rounded-md`}
                onClick={() => switchChain({ chainId: i.id })}
              >
                <p>{i.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/*--- SEND USDC ---*/}
        <div className="whiteCard2">
          <div>
            <p className="text-xl font-bold">Send USDC</p>
            <p>You will have to first send some USDC and POL tokens to this account.</p>
          </div>
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
            <button className="mt-2 w-full appButton1" type="button" onClick={send1} disabled={sendUsdcStatus === "pending" ? true : false}>
              {sendUsdcStatus === "pending" ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner />
                  <p>Sending...</p>
                </div>
              ) : (
                "Send"
              )}
            </button>
            {receiptStatus === "success" && txHash && (
              <div>
                <p>USDC sent!</p>
                <p>
                  View on PolygonScan:{" "}
                  <a className="link" href={`https://polygonscan.com/tx/${txHash}`} target="_blank">
                    link
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
        <LogoutButton onClickLogout={onClickLogout} isLoggingOut={isLoggingOut} />
      </div>
      {error && <ErrorModalLight error={error} setError={setError} />}
    </div>
  );
}
