import ShareDownloadClient from "./ShareDownloadClient";
import { getDb } from "@/lib/db";
import { getShareMetaByCode } from "@/lib/shareLookup";
import { FiDownloadCloud } from "react-icons/fi";

export const metadata = {
  title: "Download | DRPY",
};

export default async function SharePage({ params }) {
  const { code } = await params;
  const db = await getDb();
  const result = await getShareMetaByCode(db, code);
  const initialMeta = result.status === 200 ? result.data : null;
  const initialError = result.status === 200 ? "" : result.error;

  return (
    <section className="flex flex-col items-center justify-center min-h-[80dvh] px-2">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <FiDownloadCloud className="text-primary text-2xl" />
          <h2 className="text-2xl font-bold section-title">Shared File</h2>
        </div>
        <p className="opacity-70 mb-4">
          Secure temporary access powered by DRPY
        </p>
        <ShareDownloadClient
          code={code}
          initialMeta={initialMeta}
          initialError={initialError}
        />
      </div>
    </section>
  );
}
