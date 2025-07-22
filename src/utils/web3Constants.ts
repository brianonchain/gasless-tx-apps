import { base, arbitrum, optimism, polygon, sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { numberToHex } from "viem";
import type { Hex, Chain } from "viem";

export const chainHexToWagmiChain: { [key: string]: Chain } = {
  [numberToHex(base.id)]: base,
  [numberToHex(arbitrum.id)]: arbitrum,
  [numberToHex(optimism.id)]: optimism,
  [numberToHex(polygon.id)]: polygon,
  [numberToHex(sepolia.id)]: sepolia,
  [numberToHex(baseSepolia.id)]: baseSepolia,
};

export const chainNameToUsdcAddress: { [key: string]: Hex } = {
  [base.name]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [arbitrum.name]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [optimism.name]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  [polygon.name]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  [sepolia.name]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [baseSepolia.name]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const chainNameToChain: { [key: string]: Chain } = {
  [base.name]: base,
  [arbitrum.name]: arbitrum,
  [optimism.name]: optimism,
  [polygon.name]: polygon,
  [sepolia.name]: sepolia,
  [baseSepolia.name]: baseSepolia,
};

export const chainNameToRpcUrl: { [key: string]: string } = {
  [base.name]: process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL!,
  [arbitrum.name]: process.env.NEXT_PUBLIC_ALCHEMY_ARBITRUM_URL!,
  [optimism.name]: process.env.NEXT_PUBLIC_ALCHEMY_OP_URL!,
  [polygon.name]: process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL!,
  [sepolia.name]: process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL!,
  [baseSepolia.name]: process.env.NEXT_PUBLIC_ALCHEMY_BASE_SEPOLIA_URL!,
};

export const chainNameToBundlerUrl: { [key: string]: string } = {
  [base.name]: process.env.NEXT_PUBLIC_PIMLICO_BASE_URL!,
  [arbitrum.name]: process.env.NEXT_PUBLIC_PIMLICO_ARBITRUM_URL!,
  [optimism.name]: process.env.NEXT_PUBLIC_PIMLICO_OP_URL!,
  [polygon.name]: process.env.NEXT_PUBLIC_PIMLICO_POLYGON_URL!,
  [sepolia.name]: process.env.NEXT_PUBLIC_PIMLICO_SEPOLIA_URL!,
  [baseSepolia.name]: process.env.NEXT_PUBLIC_PIMLICO_BASE_SEPOLIA_URL!,
};

export const chainNameToPaymasterUrl: { [key: string]: string } = {
  [base.name]: process.env.NEXT_PUBLIC_PIMLICO_BASE_URL!,
  [arbitrum.name]: process.env.NEXT_PUBLIC_PIMLICO_ARBITRUM_URL!,
  [optimism.name]: process.env.NEXT_PUBLIC_PIMLICO_OP_URL!,
  [polygon.name]: process.env.NEXT_PUBLIC_PIMLICO_POLYGON_URL!,
  [sepolia.name]: process.env.NEXT_PUBLIC_PIMLICO_SEPOLIA_URL!,
  [baseSepolia.name]: process.env.NEXT_PUBLIC_PIMLICO_BASE_SEPOLIA_URL!,
};

export const chainNameToCirclePaymasterV07Address: { [key: string]: string } = {
  [baseSepolia.name]: "0x31BE08D380A21fc740883c0BC434FcFc88740b58",
  [arbitrumSepolia.name]: "0x31BE08D380A21fc740883c0BC434FcFc88740b58",
  [base.name]: "0x6C973eBe80dCD8660841D4356bf15c32460271C9",
  [arbitrum.name]: "0x6C973eBe80dCD8660841D4356bf15c32460271C9",
};

export const chainNameToCirclePaymasterV08Address: { [key: string]: Hex } = {
  [sepolia.name]: "0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966",
  [baseSepolia.name]: "0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966",
  [base.name]: "0x0578cFB241215b77442a541325d6A4E6dFE700Ec",
  [polygon.name]: "0x0578cFB241215b77442a541325d6A4E6dFE700Ec",
};
