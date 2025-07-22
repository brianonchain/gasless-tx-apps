import { FaTriangleExclamation } from "react-icons/fa6";

export default function ErrorModal({ error, setError }: { error: React.ReactNode; setError: any }) {
  return (
    <div className="z-[200]">
      <div className="errorModalLight">
        <div className="errorModalContentContainer">
          <FaTriangleExclamation className="text-[50px] text-slate-300 dark:text-slate-700" />
          <div className="grow py-[32px]">{error}</div>
          <button onClick={() => setError(null)} className="appButton1 w-full">
            Close
          </button>
        </div>
      </div>
      <div className="modalBlackout"></div>
    </div>
  );
}
