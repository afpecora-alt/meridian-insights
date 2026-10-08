import { Navbar } from "@/components/Navbar";
import { InsightsView } from "./InsightsView";

export const metadata = { title: "Insights · Meridian Insights" };

export default function InsightsPage() {
  return (
    <>
      <Navbar active="/insights" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <InsightsView />
      </main>
    </>
  );
}
