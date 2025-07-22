import { headers } from "next/headers";
import Providers from "./_components/Providers";
import { cookieToWeb3AuthState } from "@web3auth/modal";

export default async function layout({ children }: Readonly<{ children: React.ReactNode }>) {
  console.log("layout.tsx");
  const web3authInitialState = cookieToWeb3AuthState(decodeURIComponent((await headers()).get("cookie") ?? ""));

  return <Providers web3authInitialState={web3authInitialState}>{children}</Providers>;
}
