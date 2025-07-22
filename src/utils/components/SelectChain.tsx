import { Chain } from "viem";

export default function SelectChain({
  chains,
  chain,
  switchChain,
}: {
  chains: Chain[];
  chain: Chain | undefined;
  switchChain: any; // ({ chainId }: { chainId: number }) => Promise<void> | undefined
}) {
  return (
    <div className="space-y-1">
      <p className="text-xl font-bold">Select Chain</p>
      <div className="flex gap-2">
        {chains.map((i: Chain) => (
          <div
            key={i.name}
            className={`${chain?.name === i.name ? "bg-blue-500 text-white" : ""} font-medium px-2 py-1 border-2 border-blue-500 rounded-md`}
            onClick={async () => await switchChain({ chainId: i.id })}
          >
            <p>{i.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
