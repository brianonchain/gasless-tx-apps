"use client";
// nextjs
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export default function Login() {
  console.log("Login.tsx");
  // refs
  const initializedRef = useRef(false);
  // hooks
  const { ready: privyReady, authenticated, login } = usePrivy();
  const router = useRouter();
  // logs
  console.log("privyReady:", privyReady, "authenticated:", authenticated);

  useEffect(() => {
    if (privyReady && authenticated && !initializedRef.current) {
      initializedRef.current = true;
      router.push("/privy-smart");
    }
  }, [privyReady, authenticated]);

  return (
    <div className="pt-24 px-6 w-full h-screen flex flex-col items-center gap-12 overflow-y-auto ">
      <p className="text-3xl font-semibold">Login</p>
      <div className="w-full max-w-[400px] desktop:max-w-[280px] flex flex-col gap-8">
        <button
          className="px-4 w-full h-16 desktop:h-13 flex items-center justify-center gap-4 font-medium text-slate-700 border-[1.5px] border-slate-400 rounded-xl shadow-sm hover:bg-slate-200 active:shadow-lg transition-all duration-300 select-none"
          onClick={login}
        >
          Log In With Privy
        </button>
      </div>
    </div>
  );
}
