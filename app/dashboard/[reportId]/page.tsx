app/dashboard/[reportId]/page.tsx
import { createServerClient } from "@/lib/supabase";
import { ReportConfiguration, DeliveryLog, ReportSnapshot } from "@/types";
import ReportTable from "@/components/ReportTable";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: { reportId: string };
}

async function getReportDetail(reportId: string): Promise<{
  report: ReportConfiguration | null;
  deliveries: (DeliveryLog & { snapshot: ReportSnapshot | null })[];
}> {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { report: null, deliveries: [] };
  }

  const { data: report, error: reportError } = await supabase
    .from("report_configurations")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", session.user.id)
    .single();

  if (reportError || !report) {
    return { report: null, deliveries: [] };
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("delivery_logs")
    .select(
      `
      *,
      snapshot:report_snapshots(*)
    `
    )
    .eq("report_configuration_id", reportId)
    .order("delivered_at", { ascending: false })
    .limit(10);

  if (deliveriesError) {
    return { report, deliveries: [] };
  }

  return {
    report,
    deliveries: (deliveries ?? []) as (DeliveryLog & {
      snapshot: ReportSnapshot | null;
    })[],
  };
}

export default async function ReportDetailPage({ params }: PageProps) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const { report, deliveries } = await getReportDetail(params.reportId);

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Back to dashboard"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {report.name}
              </h1>
              <p className="text-sm text-gray-500">Report Detail</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                report.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {report.is_active ? "Active" : "Paused"}
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Report Config Summary */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Configuration Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Schedule
              </p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {report.schedule ?? "Not set"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Recipients
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {Array.isArray(report.recipients)
                  ? report.recipients.length
                  : 0}{" "}
                recipient
                {Array.isArray(report.recipients) &&
                report.recipients.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Boards
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {Array.isArray(report.board_ids)
                  ? report.board_ids.length
                  : 0}{" "}
                board
                {Array.isArray(report.board_ids) &&
                report.board_ids.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Deliveries
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {deliveries.length}
              </p>
            </div>
          </div>

          {Array.isArray(report.recipients) && report.recipients.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Recipient Emails
              </p>
              <div className="flex flex-wrap gap-2">
                {(report.recipients as string[]).map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Delivery History */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Recent Deliveries
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Last 10 report deliveries
              </p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
              {deliveries.length} of 10
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No deliveries yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Deliveries will appear here once the report has been sent.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deliveries.map((delivery) => (
                <DeliveryRow key={delivery.id} delivery={delivery} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DeliveryRow({
  delivery,
}: {
  delivery: DeliveryLog & { snapshot: ReportSnapshot | null };
}) {
  const deliveredAt = delivery.delivered_at
    ? new Date(delivery.delivered_at)
    : null;

  const formattedDate = deliveredAt
    ? deliveredAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  const formattedTime = deliveredAt
    ? deliveredAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const statusColor =
    delivery.status === "delivered"
      ? "bg-green-100 text-green-700"
      : delivery.status === "failed"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <details className="group">
      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
            <p className="text-xs text-gray-500">{formattedTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}
          >
            {delivery.status}
          </span>

          {delivery.snapshot ? (
            <span className="text-xs text-blue-600 font-medium group-open:hidden">
              View Report ▼
            </span>
          ) : (
            <span className="text-xs text-gray-400">No snapshot</span>
          )}
          {delivery.snapshot && (
            <span className="text-xs text-blue-600 font-medium hidden group-open:inline">
              Collapse ▲
            </span>
          )}
        </div>
      </summary>

      {delivery.snapshot && (
        <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Report Snapshot
            </h3>
            <span className="text-xs text-gray-400">
              Captured{" "}
              {delivery.snapshot.created_at
                ? new Date(delivery.snapshot.created_at).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "at delivery time"}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <ReportTable snapshot={delivery.snapshot} />
          </div>
        </div>
      )}
    </details>
  );
}