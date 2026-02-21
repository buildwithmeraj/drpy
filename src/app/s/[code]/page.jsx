import ShareDownloadClient from "./ShareDownloadClient";
import clientPromise from "@/lib/mongodb";
import { getShareMetaByCode } from "@/lib/shareLookup";

export const metadata = {
  title: "Download | DRPY",
};

export default async function SharePage({ params }) {
  const { code } = await params;
  const client = await clientPromise;
  const db = client.db();
  const result = await getShareMetaByCode(db, code);
  const initialMeta = result.status === 200 ? result.data : null;
  const initialError = result.status === 200 ? "" : result.error;

  return (
    <section className="max-w-xl mx-auto py-10">
      <h2>Shared File</h2>
      <ShareDownloadClient
        code={code}
        initialMeta={initialMeta}
        initialError={initialError}
      />
    </section>
  );
}
