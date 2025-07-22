"use client";
// next
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// privy
import { usePrivy, useSign7702Authorization } from "@privy-io/react-auth";
// viem
import { parseUnits, isAddress, createPublicClient, http, parseAbi } from "viem";
import type { Hex, Chain } from "viem";
// wagmi
import { useAccount, useSwitchChain } from "wagmi";
// utils
import { useReadUsdcBalance } from "@/utils/hooks";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import { chainNameToRpcUrl, chainNameToUsdcAddress } from "@/utils/web3Constants";
import { getGasFeeFromLogs } from "@/utils/functions";
import { useBundlerClient } from "./BundlerProvider";

export default function App() {
  // refs
  const initializeRef = useRef(false);
  // hooks
  const { status: wagmiStatus, address, chain } = useAccount();
  const { ready: privyReady, authenticated, logout, user } = usePrivy();
  const { signAuthorization } = useSign7702Authorization();
  const router = useRouter();
  const { chains, switchChain } = useSwitchChain();
  const bundlerClient = useBundlerClient();
  // states
  const [toAddress, setToAddress] = useState<string>("");
  const [usdcAmount, setUsdcAmount] = useState<string>("");
  const [sendUsdcStatus, setSendUsdcStatus] = useState("initial"); // initial | sending | sent
  const [error, setError] = useState<string | undefined>(undefined);
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const [gasFee, setGasFee] = useState<string | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // hooks that use states
  const { data: usdcBalance } = useReadUsdcBalance({ accountAddress: address, chain });
  // logs
  console.log("privyReady", privyReady, "authenticated", authenticated);
  console.log("wagmiStatus", wagmiStatus, "address", address);
  console.log("chain", chain);

  // if privyRead is true but authenticated is false, means user is not logged in
  // used for logout and if unathenticated user visits this page
  useEffect(() => {
    if (privyReady && !authenticated && !initializeRef.current) {
      initializeRef.current = true;
      router.push("/privy-7702/login");
    }
  }, [privyReady, authenticated]);

  async function send() {
    setTxHash(undefined);
    if (!chain || !address || !bundlerClient || !toAddress || !isAddress(toAddress) || !usdcAmount || !usdcBalance || Number(usdcAmount) > Number(usdcBalance)) {
      setError("Invalid inputs");
      return;
    }

    try {
      setSendUsdcStatus("sending");
      const usdcAddress = chainNameToUsdcAddress[chain.name];
      const rpcUrl = chainNameToRpcUrl[chain.name];
      const paymasterAddress = "0x888888888888Ec68A58AB8094Cc1AD20Ba3D2402"; // 0x777777777777AeC03fd955926DbF81597e66834C

      // sign authorization
      const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
      const authorization = await signAuthorization({
        contractAddress: "0xe6Cae83BdE06E4c305530e199D7217f42808555B", // Simple account implementation address (same for all chains)
        chainId: chain.id,
        nonce: await publicClient.getTransactionCount({ address }),
      });

      // send transaction
      const userOpHash = await bundlerClient.sendUserOperation({
        calls: [
          {
            to: usdcAddress,
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: [paymasterAddress, parseUnits("0.2", 6)],
          },
          {
            to: usdcAddress,
            abi: parseAbi(["function transfer(address,uint)"]),
            functionName: "transfer",
            args: [toAddress, parseUnits(usdcAmount, 6)],
          },
        ],
        factory: "0x7702",
        factoryData: "0x",
        authorization,
      });

      // get tx hash & gas fee
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
      console.log("receipt", receipt);
      const _txHash = receipt.receipt.transactionHash;
      if (_txHash && receipt) {
        setTxHash(_txHash);
        const _gasFee = getGasFeeFromLogs(receipt.logs);
        setGasFee(_gasFee);
        setSendUsdcStatus("sent");
        setUsdcAmount("");
        setToAddress("");
      } else {
        throw new Error("no txHash or receipt");
      }
    } catch (e) {
      console.log(e);
      setError(`Transaction failed`);
      setSendUsdcStatus("initial");
    }
  }

  async function onClickLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/privy-7702/login");
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
            <p>Embedded EOA (7702-enabled)</p>
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
            <p className="">Send USDC to another address with gas paid by USDC in the embedded EOA. You will have to first send some USDC to this account first.</p>
          </div>
          {/*--- inputs ---*/}
          <div className="space-y-2">
            <label className="font-medium">To Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-400 rounded-md focus:outline-[1px] outline-lightButton"
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
              className="w-full p-2 border border-gray-400 rounded-md focus:outline-[1px] outline-lightButton"
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
            <button className="mt-2 w-full appButton1" type="button" onClick={send} disabled={sendUsdcStatus === "sending" ? true : false}>
              {sendUsdcStatus === "sending" ? (
                <div className="flex items-center justify-center gap-3">
                  <Spinner />
                  <p>Sending...</p>
                </div>
              ) : (
                "Send"
              )}
            </button>
            {txHash && (
              <div className="flex items-center gap-2">
                <p>USDC successfully sent!</p>
                <a className="link" href={`${chain?.blockExplorers?.default.url}/tx/${txHash}`} target="_blank">
                  View on {chain?.blockExplorers?.default.name}
                </a>
              </div>
            )}
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
