"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export const setAppCookiesAction = async ({ address, idToken }: { address: `0x${string}`; idToken: string }) => {
  console.log("setting App cookies...");
  const cookiesStore = await cookies();

  cookiesStore.set("address", address, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 365, path: "/" });
  cookiesStore.set("idToken", idToken, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7, path: "/" });

  redirect("/web3Auth-pimlico");
};

export const refreshWeb3AuthState = async (path: string) => {
  revalidatePath(path);
};
