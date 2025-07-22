"use client";
// nextjs
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
// web3
import { useWeb3AuthConnect, useWeb3Auth } from "@web3auth/modal/react";
import { WALLET_CONNECTORS, AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/modal";
// import { useAccount } from "wagmi";
// utils
import { SpinningCircleGraySm } from "@/utils/components/SpinningCircleGray";
import BackToAppsButton from "@/utils/components/BackToAppsButton";

export default function Login() {
  console.log("Login.tsx");

  // refs
  const initialized = useRef(false);

  // hooks
  const { connectTo } = useWeb3AuthConnect();
  const { status: web3AuthStatus } = useWeb3Auth();
  // const { status: wagmiStatus, address } = useAccount();
  const router = useRouter();
  console.log("web3AuthStatus:", web3AuthStatus);
  // console.log("wagmiStatus:", wagmiStatus, "address:", address);

  // states
  const [socials, setSocials] = useState<{ name: string; img: string }[]>([
    { name: "Google", img: "/google.svg" },
    { name: "Facebook", img: "/facebook.svg" },
  ]);
  const [selectedSocial, setSelectedSocial] = useState<string | null>(null);

  useEffect(() => {
    if (web3AuthStatus === "connected" && !initialized.current) {
      initialized.current = true;
      console.log("connected, pushing to /...");
      router.push("/web3Auth-smart-native");
    }
  }, [web3AuthStatus]);

  const adminLogin = async (socialName: string) => {
    if (socialName === "Google") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.GOOGLE;
    } else if (socialName === "Facebook") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.FACEBOOK;
    } else if (socialName === "Apple") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.APPLE;
    } else {
      return;
    }
    setSelectedSocial(socialName);
    try {
      await connectTo(WALLET_CONNECTORS.AUTH, { authConnection }); // this will trigger useEffect
    } catch {
      setSelectedSocial(null);
    }
  };

  return (
    <div className="loginContainer1">
      <div className="loginContainer2">
        <BackToAppsButton />
        <p className="loginTitle">Sign In to Web3Auth Native Smart Wallet</p>
        <div className="loginButtonContainer">
          {socials.map((i) => (
            <button key={i.name} className="loginWeb3AuthButton" onClick={() => adminLogin(i.name)}>
              <Image src={i.img} alt={i.name} width={40} height={40} className="w-auto h-[32px] desktop:h-[26px]" />
              <div>
                {i.name === selectedSocial ? (
                  <div className="flex items-center gap-2">
                    <SpinningCircleGraySm />
                    <p>Signing in...</p>
                  </div>
                ) : (
                  <p>Sign In With {i.name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
