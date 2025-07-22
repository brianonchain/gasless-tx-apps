export default function AppCard({
  title,
  login,
  accountType,
  bundlerClient,
  paymaster,
  link,
}: {
  title: string;
  login: string;
  accountType: string;
  bundlerClient: string;
  paymaster: string;
  link: string;
}) {
  return (
    <div className="w-full px-3 py-2 portrait:sm:px-6 portrait:sm:py-4 landscape:lg:px-6 landscape:lg:py-4 desktop:px-6 desktop:py-4 flex flex-col items-center lg:flex-row lg:justify-between gap-2 portrait:sm:gap-6 landscape:lg:gap-6 desktop:gap-4 bg-white rounded-xl shadow-[0px_1px_16px_0px_rgba(30,50,130,0.15)]">
      <div className="flex flex-col gap-1.5">
        <p className="font-bold">{title}</p>
        <div className="grid grid-cols-[auto_1fr] gap-1 items-start">
          <div className="chip">Login</div>
          <p>{login}</p>
          <div className="chip">Account Type</div>
          <p>{accountType}</p>
          <div className="chip">Bundler Client</div>
          <p>{bundlerClient}</p>
          <div className="chip">Paymaster</div>
          <p>{paymaster}</p>
        </div>
      </div>
      <a className="enterAppButton" href={link}>
        Enter App
      </a>
    </div>
  );
}
