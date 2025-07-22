"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { encodeFunctionData, keccak256, toBytes, hexToBigInt, formatUnits, parseUnits, numberToHex } from "viem";
// import erc20Abi from "@/utils/abis/erc20Abi";
import erc20Abi from "@/utils/abis/erc20Abi.json";
import Spinner from "@/utils/components/Spinner";
import { chainNameToUsdcAddress } from "@/utils/web3Constants";

export const chains: Record<string, any> = {
  Polygon: {
    chainId: "0x89", // 137
    chainName: "Polygon Mainnet",
    rpcUrls: ["https://polygon-rpc.com/"],
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
  Base: {
    chainId: "0x2105", // 8451 in hex
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://basescan.org"],
  },
  Optimism: {
    chainId: "0xa", // 10 in hex
    chainName: "Optimism",
    rpcUrls: ["https://mainnet.optimism.io"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
  },
};

const chainIdToName: { [key: string]: string } = {
  "0x89": "Polygon",
  "0x2105": "Base",
  "0xa": "Optimism",
};

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null); // for optimistic feedback
  const [currentChain, setCurrentChain] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // states for sending usdc
  const [toAddress, setToAddress] = useState<string | null>(null);
  const [usdcAmount, setUsdcAmount] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // check connection & listen to evenst on mount
  useEffect(() => {
    if (!window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    // check connection
    async function checkConnection() {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          switchChain("Polygon"); // automatically switch to Polygon
        }
      } catch (e) {
        setError("Failed to get accounts");
      }
    }
    checkConnection();

    // LISTEN TO EVENTS
    // Event handler functions
    const handleAccountsChanged = (accounts: any) => {
      console.log("detected account change");
      if (accounts.length === 0) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: any) => {
      console.log("detected chain change");
      setCurrentChainWithId(chainId);
    };

    // Add event listeners
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup function
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // get usdc balance on mount and whenever address or currentChain changes
  useEffect(() => {
    if (address && currentChain) {
      if (["Polygon", "Base", "Optimism"].includes(currentChain)) {
        getUsdcBalance();
      } else {
        setUsdcBalance(null);
      }
    }
  }, [address, currentChain]);

  async function connect() {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      switchChain("Polygon"); // automatically switch to Polygon
    } catch (e) {
      setAddress(null);
    }
  }

  // sync selectedChain with currentChain; needed for on mount and if switchChain fails
  useEffect(() => {
    setSelectedChain(currentChain);
  }, [currentChain]);

  async function switchChain(chainName: string) {
    console.log("switching chains..");
    const oldChain = currentChain;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chains[chainName].chainId }],
      });
      setCurrentChain(chainName);
    } catch (e: any) {
      if (e.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chains[chainName]],
          });
          setCurrentChain(chainName);
        } catch (e) {
          setSelectedChain(oldChain); // revert optimistic update
          console.error("Failed to add chain", e);
        }
      } else {
        setSelectedChain(oldChain); // revert optimistic update
        console.error("Failed to switch chain", e);
      }
    }
  }

  function setCurrentChainWithId(chainId: string) {
    if (["0x89", "0x2105", "0xa"].includes(chainId)) {
      setCurrentChain(chainIdToName[chainId]);
    } else {
      setCurrentChain(`${chainId} (not a supported chain)`);
    }
  }

  async function getUsdcBalance() {
    console.log("getting USDC balance...");
    setError(null);
    if (!currentChain || !address) return;

    // manually construct calldata
    // const fnSelector = keccak256(toBytes("balanceOf(address)")).slice(0, 10); // first 4 bytes
    // const arg1 = address.toLowerCase().replace("0x", "").padStart(64, "0");
    // const calldataManual = fnSelector + arg1;

    const calldata = encodeFunctionData({ abi: erc20Abi, functionName: "balanceOf", args: [address] }); // use viem to construct calldata

    try {
      const _usdcBalance = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: chainNameToUsdcAddress[currentChain],
            data: calldata,
          },
          "latest",
        ],
      });
      setUsdcBalance(formatUnits(hexToBigInt(_usdcBalance), 6));
    } catch (e) {
      setUsdcBalance(null);
      setError("Error fetching USDC balance");
    }
  }

  async function sendUsdc() {
    setError(null);
    if (!currentChain || !address || !toAddress || !usdcAmount) {
      setError("Missing fields");
      return;
    }

    if (Number(usdcAmount) > Number(usdcBalance)) {
      setError("Insufficient funds");
      return;
    }
    console.log("sending USDC...");
    setIsSending(true);

    // manually construct calldata
    // const fnSelector = keccak256(toBytes("transfer(address,uint256)")).slice(0, 10);
    // const arg1 = toAddress.replace("0x", "").padStart(64, "0");
    // const arg2 = numberToHex(parseUnits(usdcAmount, 6)).replace("0x", "").padStart(64, "0");
    // const calldataManual = fnSelector + arg1 + arg2;

    const calldata = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [toAddress, parseUnits(usdcAmount, 6)] }); // use viem to construct calldata

    try {
      // 1. Send the transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: chainNameToUsdcAddress[currentChain],
            data: calldata,
          },
          "latest",
        ],
      });
      // 2. Poll for the receipt
      for (let i = 0; i < 20; i++) {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt) {
          console.log("Transaction Receipt:", receipt);
          setTxHash(receipt.transactionHash);
          break;
        }

        await new Promise((res) => setTimeout(res, 2000));
      }
    } catch (e) {
      setError("Error sending USDC");
    }
    setIsSending(false);
    getUsdcBalance();
  }

  return (
    <div className="p-3 w-full flex justify-center">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-4">
        <p className="text-2xl font-bold">App</p>

        <button className="appButton1Sm" onClick={connect} disabled={address ? true : false}>
          {address ? "Connected" : "Connect"}
        </button>

        <div className="flex items-center gap-4">
          {Object.keys(chains).map((i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedChain(i);
                switchChain(i);
              }}
              type="button"
              className={`${
                selectedChain === i ? "border-blue-500" : "border-slate-300 text-slate-400"
              } border-2 px-2 h-[40px] desktop:h-[40px] flex items-center gap-2 rounded-lg desktop:hover:border-blue-500 desktop:hover:text-lightText1!`}
            >
              <Image src={`${i.toLowerCase()}.svg`} alt={i} width={24} height={24} />
              {i}
            </button>
          ))}
        </div>

        <div className="w-full textSmApp space-y-2">
          <p>Status: {address ? "Connected" : "Disconnected"}</p>
          <p>Chain: {currentChain}</p>
          <p>Address: {address}</p>
          <p>USDC Balance: {usdcBalance}</p>
          <p>Error: {error}</p>
        </div>

        {address && (
          <div className="space-y-2 textSmApp">
            <label>To Address:</label>
            <input
              type="text"
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-400 rounded-lg focus:outline-[1px] outline-blue-500"
            />
            <label>USDC Amount:</label>
            <input
              type="text"
              placeholder="0.00"
              onChange={(e) => setUsdcAmount(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-400 rounded-lg focus:outline-[1px] outline-blue-500"
            />
            <button
              type="button"
              onClick={sendUsdc}
              disabled={isSending ? true : false}
              className="mt-2 w-full py-[0.5em] textBaseApp text-white font-medium bg-blue-500 desktop:hover:bg-blue-600 rounded-lg"
            >
              {!isSending && "Send"}
              {isSending && (
                <div className="flex items-center justify-center gap-3">
                  <Spinner />
                  <p>Sending...</p>
                </div>
              )}
            </button>
            {txHash && (
              <p>
                USDC sent!{" "}
                <a className="link" href={`https://polygonscan.com/tx/${txHash}`} target="_blank">
                  View txn
                </a>{" "}
                on PolygonScan
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
