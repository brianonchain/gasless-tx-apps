import Providers from "./_components/Providers";

export default async function layout({ children }: Readonly<{ children: React.ReactNode }>) {
  console.log("layout.tsx");

  return <Providers>{children}</Providers>;
}
