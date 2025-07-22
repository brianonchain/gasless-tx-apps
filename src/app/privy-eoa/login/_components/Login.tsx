"use client";
// nextjs
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
// utils
import BackToAppsButton from "@/utils/components/BackToAppsButton";

export default function Login() {
  console.log("Login.tsx");
  // refs
  const initializedRef = useRef(false);
  // hooks
  const { ready: privyReady, user, authenticated, login } = usePrivy();
  const { status: wagmiStatus, address } = useAccount();
  const router = useRouter();
  // const { wallets, ready: walletsReady } = useWallets();
  // logs
  console.log("privyReady:", privyReady, "authenticated:", authenticated);
  console.log("wagmiStatus:", wagmiStatus, "address:", address);
  console.log("user:", user);

  const disableLogin = !privyReady || (privyReady && authenticated);

  useEffect(() => {
    if (privyReady && authenticated && !initializedRef.current) {
      initializedRef.current = true;
      router.push("/privy-eoa");
    }
  }, [privyReady, authenticated]);

  return (
    <div className="loginContainer1">
      <div className="loginContainer2">
        <BackToAppsButton />
        <p className="loginTitle">Login to Privy Standard Wallet</p>
        <div className="loginButtonContainer">
          <button className="loginPrivyButton" onClick={login}>
            Log In With Privy
          </button>
        </div>
      </div>
    </div>
  );
}
