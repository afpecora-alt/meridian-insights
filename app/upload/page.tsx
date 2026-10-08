import { Navbar } from "@/components/Navbar";
import { UploadPanel } from "./UploadPanel";

export const metadata = { title: "Upload · Meridian Insights" };

export default function UploadPage() {
  return (
    <>
      <Navbar active="/upload" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Upload data</h1>
        <p className="mt-2 text-sm text-muted">
          Drop in a Meridian deals export to generate insights. The file stays in this
          browser until you choose to share it.
        </p>
        <UploadPanel />
      </main>
    </>
  );
}
