import { ImSpinner2 } from "react-icons/im";
export default function Spinner({ size = 24 }: { size?: number }) {
  return <ImSpinner2 className="text-white animate-spin" style={{ fontSize: size }} />;
}
