import ShareDownloadClient from "./ShareDownloadClient";
import { getDb } from "@/lib/db";
import { getShareMetaByCode } from "@/lib/shareLookup";

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
    <section className="max-w-3xl mx-auto py-10">
      <div className="mb-4">
        <h2>Shared File</h2>
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
