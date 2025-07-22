import { useRouter } from "next/navigation";
import { FaAngleLeft } from "react-icons/fa6";

export default function BackToAppsButton() {
  const router = useRouter();

  return (
    <button className="w-full flex items-center gap-2 textLgApp font-medium text-slate-600 desktop:hover:text-slate-700" onClick={() => router.push("/")}>
      <FaAngleLeft />
      <p>Back to Apps</p>
    </button>
  );
}
