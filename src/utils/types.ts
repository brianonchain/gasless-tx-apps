import type { PaymasterActions } from "viem/account-abstraction";

export type UserOpPaymasterType =
  | true
  | {
      getPaymasterData?: PaymasterActions["getPaymasterData"] | undefined;
      getPaymasterStubData?: PaymasterActions["getPaymasterStubData"] | undefined;
    }
  | undefined;

export type Social = { name: string; img: string };

export type Chain = {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls: string[];
};
