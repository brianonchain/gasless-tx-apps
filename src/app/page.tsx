import AppCard from "./_components/AppCard";

export default function Home() {
  return (
    <div className="py-6 w-full flex justify-center overflow-y-auto">
      <div className="pageWidth flex flex-col items-center gap-6">
        {/*--- EIP 7702 APPS ---*/}
        <h1>
          Test <span>Gasless ERC-20 Transfers</span> with <span>EIP-7702 EOAs</span>
        </h1>
        <AppCard
          title="Privy 7702 Wallet"
          login="Privy social login"
          accountType="Embedded EOA with EIP-7702 "
          bundlerClient="Viem's bundlerClient"
          paymaster="Pimlico's ERC-20 Paymaster"
          link="/privy-7702"
        />

        {/*--- SMART WALLET APPS ---*/}
        <h1>
          Test <span>Gasless ERC-20 Transfers</span> with <span>Smart Accounts</span>
        </h1>
        <AppCard
          title="Web3Auth Native Smart Wallet"
          login="Web3Auth social login"
          accountType="Web3Auth's Native Smart Account (MetaMask)"
          bundlerClient="Web3Auth's Native bundlerClient"
          paymaster="Pimlico's ERC-20 Paymaster"
          link="/web3Auth-smart-native"
        />
        <AppCard
          title="Web3Auth Custom Smart Wallet"
          login="Web3Auth social login"
          accountType="Safe Smart Account"
          bundlerClient="Viem bundlerClient"
          paymaster="Pimlico's ERC-20 Paymaster"
          link="/web3Auth-smart-custom"
        />
        <AppCard
          title="Privy Smart Wallet"
          login="Privy Social"
          accountType="Privy's native Smart Account (ZeroDev)"
          bundlerClient="Viem bundlerClient"
          paymaster="Pimlico's ERC-20 Paymaster"
          link="/privy-smart"
        />
        <AppCard
          title="Web3Auth Native Smart Wallet + Circle's Paymaster"
          login="Web3Auth social login"
          accountType="Web3Auth's native Smart Account (MetaMask)"
          bundlerClient="Viem bundlerClient"
          paymaster="Circle's ERC-20 Paymaster"
          link="/web3Auth-circle"
        />

        {/*--- LOCAL EOA APPS ---*/}
        <div className="space-y-1">
          <h1>Local EOA Apps</h1>
          <p>These apps require cloning the repo and setting up env vars</p>
        </div>
        <AppCard
          title="Local EOA with EIP-7702 + Circle's Paymaster"
          login="Requires cloning repo and setting up env vars"
          accountType="Local EOA with EIP-7702"
          bundlerClient="Viem's bundlerClient"
          paymaster="Circle's ERC-20 Paymaster"
          link="/circle-7702"
        />
        <AppCard
          title="Local EOA + Circle's Smart Account + Circle's Paymaster"
          login="None (need private keys in env var)"
          accountType="Circle Smart Account"
          bundlerClient="Viem bundlerClient"
          paymaster="Circle's ERC-20 Paymaster"
          link="/circle-4337"
        />

        {/*--- OTHER APPS ---*/}
        <h1>Other Test Apps</h1>
        <AppCard
          title="Web3Auth Standard Wallet"
          login="Web3Auth Social"
          accountType="Embedded EOA (Wagmi integrated)"
          bundlerClient="None"
          paymaster="None"
          link="/web3Auth-eoa"
        />
        <AppCard title="Privy Standard Wallet" login="Privy Social" accountType="Embedded EOA (Wagmi integrated)" bundlerClient="" paymaster="" link="/privy-eoa" />
        <div className="w-full flex flex-col gap-6">
          <div className="whiteCard">
            <div className="grow">
              <span className="font-bold">Back To Basics App</span> - Use the window.ethereum provider to connect a Web3 Wallet, switch accounts, switch chains, get USDC balance,
              and send USDC. No Wagmi, Viem, or Ethers.
            </div>
            <a className="enterAppButton" href="/window-ethereum">
              Enter App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
