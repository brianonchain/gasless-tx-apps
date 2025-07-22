"use client";
// next
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// wagmi
import { useAccount, useConfig } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
// viem
import { parseAbi, parseUnits, isAddress } from "viem";
import type { Hex } from "viem";
// web3auth
import { useWeb3Auth, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import type { UserInfo } from "@web3auth/modal";
import { useSwitchChain } from "@web3auth/modal/react";
// utils
import { useReadUsdcBalance } from "@/utils/hooks";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import { getGasFeeFromLogs } from "@/utils/functions";
import { chainNameToUsdcAddress } from "@/utils/web3Constants";
import LogoutButton from "@/utils/components/LogoutButton";

export default function App() {
  // hooks
  const { status: wagmiStatus, address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const config = useConfig();
  const { status: web3AuthStatus, isConnected: isWeb3AuthConnected, web3Auth } = useWeb3Auth();
  const router = useRouter();
  const { disconnect, loading: isLoggingOut } = useWeb3AuthDisconnect();
  const { data: usdcBalance } = useReadUsdcBalance({ accountAddress: address, chain });
  // states
  const [toAddress, setToAddress] = useState<string | undefined>(""); // used as input value so must use ""
  const [usdcAmount, setUsdcAmount] = useState<string | undefined>(""); // used as input value so must use ""
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState("initial"); // initial | sending | sent
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | undefined>(undefined);
  const [gasFee, setGasFee] = useState<string | undefined>(undefined);
  // logs
  console.log("web3AuthStatus:", web3AuthStatus, "isWeb3AuthConnected:", isWeb3AuthConnected);
  console.log("wagmiStatus:", wagmiStatus, "address:", address);
  console.log("web3Auth:", web3Auth);
  console.log("userInfo:", userInfo);
  console.log("chain.id:", chain?.id);
  console.log("web3Auth?.provider?.chainId:", web3Auth?.provider?.chainId);
  console.log("web3Auth?.coreOptions?.chains:", web3Auth?.coreOptions?.chains);

  // logout if web3AuthStatus = "ready", which means there is (and will be) no connection
  useEffect(() => {
    if (web3AuthStatus === "ready") {
      console.log("web3AuthStatus === ready, so pushed to /login");
      router.push("/web3Auth-eoa/login");
    }
  }, [web3AuthStatus]);

  // set userInfo on mount
  useEffect(() => {
    if (address) {
      (async () => {
        const _userInfo = await web3Auth?.getUserInfo();
        setUserInfo(_userInfo);
      })();
    }
  }, [address]);

  async function send() {
    setTxHash(undefined);
    setGasFee(undefined);
    try {
      if (!chain || !toAddress || !usdcAmount || !usdcBalance || usdcAmount > usdcBalance || !isAddress(toAddress)) throw new Error("Invalid inputs");
      setIsSending("sending");

      const usdcAddress = chainNameToUsdcAddress[chain.name];

      // send tx
      const txHash = await writeContract(config, {
        address: usdcAddress,
        abi: parseAbi(["function transfer(address,uint256)"]),
        functionName: "transfer",
        args: [toAddress, parseUnits(usdcAmount, 6)],
      });

      // get tx hash & gas fee
      const receipt = await waitForTransactionReceipt(config, { hash: txHash });
      console.log("receipt", receipt);
      const _txHash = receipt.transactionHash;
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
      setError(`Transaction failed. Error: ${e}`);
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
          <p className="text-xl font-bold">Account Info</p>
          <div>
            <p className="underline underline-offset-2">Login Method</p>
            <div>{userInfo ? userInfo.authConnection : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Embedded EOA</p>
            <div>{address ? address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Network</p>
            <div>{chain ? chain.name : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">USDC Balance</p>
            <div>{usdcBalance ? usdcBalance : <div className="w-[100px] bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
        </div>

        {/*--- SWITCH CHAIN ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Switch Chain</p>
          <div className="flex gap-2">
            {web3Auth?.coreOptions?.chains?.map((i: any) => (
              <button
                key={i.chainId}
                className={`${web3Auth.currentChainId === i.chainId ? "bg-lightButton text-white" : ""} font-medium px-2 py-1 border-2 border-lightButton rounded-md`}
                onClick={async () => await switchChain(i.chainId)}
              >
                <p>{i.displayName}</p>
              </button>
            ))}
          </div>
        </div>

        {/*--- SEND USDC ---*/}
        <div className="whiteCard2">
          <div>
            <p className="text-xl font-bold">Send USDC</p>
            <p>Send USDC tokens</p>
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
            {/* <div>
                Estimated max gas fee: {estimatedGasFee ? estimatedGasFee : <span className="inline-block w-[80px] bg-slate-300 animate-pulse text-transparent rounded-md">0</span>}
              </div> */}
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
                {gasFee && <p>Gas fee: {gasFee}</p>}
              </div>
            )}
          </div>
        </div>

        {/*--- LOGOUT BUTTON ---*/}
        <LogoutButton onClickLogout={onClickLogout} isLoggingOut={isLoggingOut} />
      </div>
      {error && <ErrorModalLight error={error} setError={setError} />}
    </div>
  );
}
