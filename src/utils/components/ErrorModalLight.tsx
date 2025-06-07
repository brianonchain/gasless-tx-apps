export default function ErrorModal({ errorModal, setErrorModal }: { errorModal: React.ReactNode; setErrorModal: any }) {
  return (
    <div className="z-200">
      <div className="errorModalLight">
        <div className="errorModalContentContainer gap-[40px]">
          <div className="min-h-[80px]">{errorModal}</div>
          <button onClick={() => setErrorModal(null)} className="appButton1Light w-full">
            Close
          </button>
        </div>
      </div>
      <div className="modalBlackout"></div>
    </div>
  );
}
