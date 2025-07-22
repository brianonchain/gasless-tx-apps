import { useState, useEffect } from "react";
// wagmi
import { useReadContract, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
// viem
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import type { Chain, Hex } from "viem";
import { polygon } from "viem/chains";
// utils
import { chainNameToRpcUrl, chainNameToUsdcAddress } from "@/utils/web3Constants";
import erc20Abi from "@/utils/abis/erc20Abi";

export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL!),
});

export const useReadUsdcBalance = ({ accountAddress, chain }: { accountAddress: Hex | undefined; chain: Chain | undefined }) => {
  return useReadContract({
    address: chain ? chainNameToUsdcAddress[chain.name] : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: accountAddress && chain ? true : false,
      select: (data): string => formatUnits(data, 6),
    },
  });
};

export const usePublicUsdcBalanceQuery = ({ accountAddress, chain }: { accountAddress: Hex | undefined; chain: Chain | undefined }) => {
  return useQuery({
    queryKey: ["usdcBalance", accountAddress],
    queryFn: async () => {
      const publicClient = createPublicClient({
        chain,
        transport: http(chainNameToRpcUrl[chain!.name]),
      });
      const balance = await publicClient.readContract({
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [accountAddress!],
      });
      return formatUnits(balance, 6);
    },
    enabled: accountAddress && chain ? true : false,
  });
};

export function useUsdcBalanceQuery({ accountAddress, chain }: { accountAddress: Hex | undefined; chain: Chain | undefined }) {
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingUsdcBalance, setIsLoadingUsdcBalance] = useState(false);
  const [errorUsdcBalance, setErrorUsdcBalance] = useState<any>(null);

  useEffect(() => {
    if (!accountAddress || !chain) {
      setUsdcBalance(null);
      return;
    }

    let isMounted = true;
    setIsLoadingUsdcBalance(true);
    setErrorUsdcBalance(null);

    (async () => {
      console.log(`getting USDC balance for ${accountAddress} on ${chain.name}...`);
      try {
        const publicClient = createPublicClient({ chain, transport: http() });
        const result = await publicClient.readContract({
          address: chainNameToUsdcAddress[chain.name],
          abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
          functionName: "balanceOf",
          args: [accountAddress],
        });
        console.log("result", result);
        if (isMounted) setUsdcBalance(formatUnits(result, 6));
      } catch (err: any) {
        if (isMounted) setErrorUsdcBalance(err);
      } finally {
        if (isMounted) setIsLoadingUsdcBalance(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [chain, accountAddress]);

  return {
    usdcBalance,
    isLoadingUsdcBalance,
    errorUsdcBalance,
  };
}
