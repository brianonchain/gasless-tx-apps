"use client";
// nextjs
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
// web3
import { useWeb3AuthConnect, useWeb3AuthUser, useWeb3Auth } from "@web3auth/modal/react";
import { WALLET_CONNECTORS, AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/modal";
import { useAccount } from "wagmi";
// utils
import ErrorModalLight from "@/utils/components/ErrorModalLight";
import { SpinningCircleGraySm } from "@/utils/components/SpinningCircleGray";
import { Social } from "@/utils/types";

export default function Login() {
  console.log("Login.tsx");

  // hooks
  const { connectTo } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { web3Auth, isConnected: isWeb3AuthConnected } = useWeb3Auth();

  const { address } = useAccount();
  const initialized = useRef(false);

  // states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState("");
  const [socials, setSocials] = useState<Social[]>([
    { name: "Google", img: "/google.svg" },
    { name: "Facebook", img: "/facebook.svg" },
  ]);
  const [errorModal, setErrorModal] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (isWeb3AuthConnected && address && userInfo && !initialized.current) {
      initialized.current = true;
      init(address);
    }
  }, [isWeb3AuthConnected, address]);

  async function init(address: `0x${string}`) {
    console.log("initializing...");
    const pubKey = (await web3Auth?.provider?.request({ method: "public_key" })) as `0x${string}`;
    if (!userInfo?.idToken || !pubKey) return;
    // await setAppCookiesAction({ merchantEvmAddress: address, pubKey, idToken: userInfo.idToken });
  }

  const adminLogin = async (social: string) => {
    if (social === "Google") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.GOOGLE;
    } else if (social === "Facebook") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.FACEBOOK;
    } else if (social === "Apple") {
      var authConnection: AUTH_CONNECTION_TYPE = AUTH_CONNECTION.APPLE;
    } else {
      return;
    }
    setSelectedSocial(social);
    setIsLoggingIn(true);
    try {
      await connectTo(WALLET_CONNECTORS.AUTH, { authConnection: authConnection }); // this will trigger useEffect
    } catch {
      setSelectedSocial("");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="pt-24 w-full h-screen flex flex-col items-center gap-12 overflow-y-auto ">
      <p className="text-2xl font-bold">Web3Auth Test</p>
      <div className="w-full max-w-[400px] desktop:max-w-[280px] space-y-8">
        {socials.map((i: Social) => (
          <button
            key={i.name}
            className="px-4 w-full h-16 desktop:h-13 flex items-center gap-4 font-medium bg-white rounded-[8px] shadow-md hover:shadow-lg active:shadow-lg transition-all duration-300 cursor-pointer select-none"
            onClick={() => adminLogin(i.name)}
          >
            <Image src={i.img} alt={i.name} width={40} height={40} className="w-auto h-[32px] desktop:h-[26px]" />
            <div>
              {isLoggingIn && i.name === selectedSocial ? (
                <div className="flex items-center">
                  <SpinningCircleGraySm />
                  <p>&nbsp;&nbsp;Signing in...</p>
                </div>
              ) : (
                <p>Sign In With {i.name}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {errorModal && <ErrorModalLight errorModal={errorModal} setErrorModal={setErrorModal} />}
    </div>
  );
}
