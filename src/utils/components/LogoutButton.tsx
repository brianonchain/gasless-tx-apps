export default function LogoutButton({ onClickLogout, isLoggingOut }: { onClickLogout: () => void; isLoggingOut: boolean }) {
  return (
    <div className="whiteCard2">
      <p className="text-xl font-bold">Log Out</p>
      <button className="w-full appButtonRed" onClick={onClickLogout}>
        {isLoggingOut ? "Logging Out..." : "Log Out"}
      </button>
    </div>
  );
}
