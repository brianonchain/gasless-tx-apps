import { useState, useEffect, useRef } from "react";
import { getPimlicoGasPrice, getPimlicoTokenRates } from "@/utils/functions";
import { parseAbi, parseUnits, formatUnits, type Call } from "viem";
import type { Web3Auth } from "@web3auth/modal";

export default function usePimlicoGas(web3Auth: Web3Auth | null, wagmiStatus: "connecting" | "reconnecting" | "connected" | "disconnected") {
  // refs
  const initCalcGasRef = useRef(false); // in case wagmiStatus goes from "connected" to "some other state" and back to "connected", this ref will prevent the gas from being calculated again
  //states
  const [estimatedGasFee, setEstimatedGasFee] = useState<string | undefined>(undefined);

  // calculaet gas
  useEffect(() => {
    (async () => {
      if (wagmiStatus === "connected" && !initCalcGasRef.current) {
        initCalcGasRef.current = true;
        const gasPrice = await getPimlicoGasPrice();
        console.log("gasPrice", gasPrice);
        const rate = await getPimlicoTokenRates();
        console.log("rate", rate);
        calcGas(gasPrice, rate);
      }
    })();
  }, [wagmiStatus]);

  async function calcGas(gasPrice: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }, rate: number) {
    console.log("calculating gas...");
    const isDeployed = await web3Auth?.accountAbstractionProvider?.smartAccount?.isDeployed();
    if (!isDeployed) setEstimatedGasFee("Cannot estimate for 1st txn");
    if (!gasPrice || !rate || !isDeployed) return;

    const bundlerClient = web3Auth?.accountAbstractionProvider?.bundlerClient!;

    const calls: Call[] = [
      {
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        abi: parseAbi(["function approve(address,uint)"]),
        functionName: "approve",
        args: ["0x777777777777AeC03fd955926DbF81597e66834C", parseUnits("0.1", 6)],
      },
      {
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        abi: parseAbi(["function transfer(address,uint)"]),
        functionName: "transfer",
        args: ["0xA206df5844dA81470C82d07AE1b797d139bE58C2", parseUnits("0.01", 6)],
      },
    ];

    try {
      const estimatedGas = await bundlerClient.estimateUserOperationGas({
        calls,
        ...gasPrice,
        paymasterVerificationGasLimit: 1000000n,
      });
      console.log("estimatedGas", estimatedGas);
      let totalGas = 0n;
      for (const gas of Object.values(estimatedGas)) {
        totalGas += gas;
      }
      console.log("totalGas", totalGas);
      const gasTokenAmount = formatUnits(totalGas * gasPrice.maxFeePerGas, 18);
      console.log("gasTokenAmount", gasTokenAmount);
      const cost = Number(gasTokenAmount) * rate;
      console.log("cost", cost);
      setEstimatedGasFee(`${cost.toFixed(6)} USDC`);
    } catch (e) {
      console.error(`Error when calling estimateUserOperationGas. Error: ${e}`);
    }
  }

  return { estimatedGasFee };
}
