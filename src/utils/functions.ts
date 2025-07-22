import { formatUnits, hexToBigInt } from "viem";

export function replacer(key: string, value: any) {
  if (typeof value === "function") {
    return value.toString();
  }
  if (typeof value === "bigint") {
    return value.toString() + "n"; // or just value.toString() if you prefer
  }
  return value;
}

export function getGasFeeFromLogs(logs: any[]) {
  const transferLogs = logs.filter((log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"); // keccak256(Transfer(address,address,uint256))
  const gasFeeTransferLog = transferLogs[1];
  const _gasFee = formatUnits(hexToBigInt(gasFeeTransferLog.data), 6);
  return _gasFee;
}

export async function getPimlicoGasPrice() {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_PIMLICO_POLYGON_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "pimlico_getUserOperationGasPrice",
        params: [],
        id: 1,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const maxFeePerGas = hexToBigInt(data.result.standard.maxFeePerGas);
    const maxPriorityFeePerGas = hexToBigInt(data.result.standard.maxPriorityFeePerGas);
    return { maxFeePerGas, maxPriorityFeePerGas };
  } catch (e) {
    throw new Error(`Error fetching Pimlico gas price. Error: ${e}`);
  }
}

export async function getPimlicoTokenRates() {
  const res = await fetch(process.env.NEXT_PUBLIC_PIMLICO_POLYGON_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "pimlico_getTokenQuotes",
      params: [{ tokens: ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"] }, "0x0000000071727De22E5E9d8BAf0edAc6f37da032", "0x89"],
      id: 1,
    }),
  });
  const data = await res.json();
  const rates = Number(formatUnits(hexToBigInt(data.result.quotes[0].exchangeRate), 6));
  return rates;
}
