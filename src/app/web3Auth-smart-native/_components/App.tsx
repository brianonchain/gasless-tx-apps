"use client";
// next
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// wagmi
import { useAccount, useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
// viem
import { parseAbi, parseUnits, isAddress, numberToHex } from "viem";
import { polygon } from "viem/chains";
import type { Hex } from "viem";
// web3auth
import { useWeb3Auth, useWeb3AuthDisconnect, useSwitchChain } from "@web3auth/modal/react";
import type { UserInfo } from "@web3auth/modal";
// components
import { supportedChains } from "./Providers";
// utils
import { useReadUsdcBalance } from "@/utils/hooks";
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import Spinner from "@/utils/components/Spinner";
import { replacer, getGasFeeFromLogs } from "@/utils/functions";
// import usePimlicoGas from "@/utils/usePimlicoGas";
import { chainNameToUsdcAddress } from "@/utils/web3Constants";
import LogoutButton from "@/utils/components/LogoutButton";

const chains = [polygon];

export default function App() {
  // hooks
  const { status: wagmiStatus, chain, address } = useAccount();
  const config = useConfig();
  const { status: web3AuthStatus, isConnected: isWeb3AuthConnected, web3Auth } = useWeb3Auth();
  const router = useRouter();
  const { disconnect, loading: isLoggingOut } = useWeb3AuthDisconnect();
  const { data: usdcBalance } = useReadUsdcBalance({ accountAddress: address, chain });
  const { switchChain, loading } = useSwitchChain();
  // const { estimatedGasFee } = usePimlicoGas(web3Auth, wagmiStatus);
  // states
  const [toAddress, setToAddress] = useState<string | undefined>(""); // used as input value so must use ""
  const [usdcAmount, setUsdcAmount] = useState<string | undefined>(""); // used as input value so must use ""
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState("initial"); // initial | sending | sent
  const [gasFee, setGasFee] = useState<string | undefined>(undefined); // actual gas fee
  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | undefined>(undefined);
  const [ownerAddress, setOwnerAddress] = useState<Hex | string | undefined>(undefined);
  // logs
  console.log("web3AuthStatus:", web3AuthStatus, "isWeb3AuthConnected:", isWeb3AuthConnected);
  console.log("wagmiStatus:", wagmiStatus, "address:", address);
  console.log("web3Auth.provider.chainId:", web3Auth?.provider?.chainId);
  console.log("web3Auth.accountAbstractionProvider", web3Auth?.accountAbstractionProvider);

  console.log(
    "wagmiChain:",
    chain?.name,
    "bundlerClient's chain:",
    web3Auth?.accountAbstractionProvider?.bundlerClient?.chain?.name,
    "smartAccount's chain:",
    web3Auth?.accountAbstractionProvider?.smartAccount?.client?.chain?.name
  );

  // logout if web3AuthStatus = "ready", which means there is no (and will be no) connection
  useEffect(() => {
    if (web3AuthStatus === "ready") {
      console.log("web3AuthStatus === ready, so pushed to /login");
      router.push("/web3Auth-smart-native/login");
    }
  }, [web3AuthStatus]);

  // set userInfo and ownerAddress on mount
  // ownerAddress = embedded EOA address cannot be easily retrieved, as Wagmi is connected to the smart account
  useEffect(() => {
    if (address) {
      (async () => {
        try {
          // set userInfo
          console.log("setting userInfo...");
          const _userInfo = await web3Auth?.getUserInfo();
          setUserInfo(_userInfo);

          // set ownerAddress
          const ownerAddress = await readContract(config, {
            address: address,
            abi: parseAbi(["function owner() view returns (address)"]),
            functionName: "owner",
          });
          console.log("ownerAddress", ownerAddress);
          setOwnerAddress(ownerAddress);
        } catch (error) {
          console.error("Error fetching user info or owner address:", error);
        }
      })();
    }
  }, [address]);

  async function send() {
    setTxHash(undefined);
    setGasFee(undefined);
    const bundlerClient = web3Auth?.accountAbstractionProvider?.bundlerClient;

    try {
      if (!chain || !toAddress || !usdcAmount || !usdcBalance || usdcAmount > usdcBalance || !isAddress(toAddress) || !bundlerClient) throw new Error("Invalid inputs");
      setIsSending("sending");

      const usdcAddress = chainNameToUsdcAddress[chain.name];
      if (!usdcAddress) throw new Error(`USDC address not found for chain: ${chain.name}`);

      const paymasterAddress = "0x777777777777AeC03fd955926DbF81597e66834C";

      // send user operation
      const userOpHash = await bundlerClient.sendUserOperation({
        calls: [
          {
            to: usdcAddress,
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: [paymasterAddress, parseUnits("0.1", 6)],
          },
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
      console.error(e);
      setError(`Transaction failed.`);
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
            <div className="break-all">{ownerAddress ? ownerAddress : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
          </div>
          <div>
            <p className="underline underline-offset-2">Smart Account</p>
            <div className="break-all">{address ? address : <div className="w-full bg-slate-300 text-transparent animate-pulse rounded-md">0</div>}</div>
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

        {/*--- SELECT CHAIN ---*/}
        <div className="whiteCard2">
          <p className="text-xl font-bold">Select Chain</p>
          <div className="flex gap-2">
            {supportedChains.map((i: any) => (
              <button
                key={i.name}
                className={`${chain?.name === i.name ? "bg-blue-500 text-white" : ""} font-medium px-2 py-1 border-2 border-blue-500 rounded-md`}
                onClick={async () => {
                  switchChain(numberToHex(i.id));
                }}
              >
                <p>{i.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/*--- SEND USDC ---*/}
        <div className="whiteCard2">
          {/*--- description ---*/}
          <div>
            <p className="text-xl font-bold">Send USDC</p>
            <p>Gas fees will be paid by USDC tokens in the Smart Contract Wallet. You will have to send some USDC to your Smart Contract Wallet first.</p>
          </div>
          {/*--- inputs ---*/}
          <div className="space-y-2">
            <label>To Address:</label>
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
            <label>USDC Amount:</label>
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
                {gasFee && <p>Gas fee: {gasFee} USDC</p>}
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
