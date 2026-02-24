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
    <section className="page-shell max-w-3xl">
      <div className="mb-4">
        <h2 className="section-title"><FiDownloadCloud className="text-primary" /> Shared File</h2>
        <p className="opacity-70">Secure temporary access powered by DRPY</p>
      </div>
      <ShareDownloadClient
        code={code}
        initialMeta={initialMeta}
        initialError={initialError}
      />
    </section>
  );
}
