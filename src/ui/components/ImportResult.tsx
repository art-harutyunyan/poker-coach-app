import type { ReactNode } from "react";
import { AlertTriangle, Check, Copy, Loader2, X, XCircle } from "lucide-react";
import type { ImportStatus } from "../useTournamentImport";
import type { ImportResultView } from "../importResultPresentation";

const STATUS_LABEL: Record<ImportStatus, string> = {
  processing: "Processing",
  success: "Imported",
  warning: "Warning",
  duplicate: "Duplicate",
  conflict: "Conflict",
  error: "Error",
};

function StatusIcon({ status }: { status: ImportStatus }) {
  const props = { size: 18, "aria-hidden": true as const };
  switch (status) {
    case "processing":
      return <Loader2 {...props} className="importResultSpinner" />;
    case "success":
      return <Check {...props} />;
    case "warning":
      return <AlertTriangle {...props} />;
    case "duplicate":
      return <Copy {...props} />;
    case "conflict":
      return <X {...props} />;
    case "error":
      return <XCircle {...props} />;
  }
}

export function ImportResult({
  view,
  actions,
  details,
}: {
  view: ImportResultView;
  actions?: ReactNode;
  details?: ReactNode;
}) {
  const urgent = view.status === "error" || view.status === "conflict";
  return (
    <article
      className="importResult"
      data-status={view.status}
      role={urgent ? "alert" : "status"}
      aria-busy={view.status === "processing" || undefined}
    >
      <div className="importResultIcon">
        <StatusIcon status={view.status} />
      </div>
      <div className="importResultContent">
        <span className="importResultStatus">{STATUS_LABEL[view.status]}</span>
        <h3>{view.title}</h3>
        <p className="importResultFile">{view.fileName}</p>
        {view.status === "processing" && (
          <div
            className="importResultProgress"
            role="progressbar"
            aria-label="Import in progress"
          >
            <span />
          </div>
        )}
        {view.detail && <p className="importResultDetail">{view.detail}</p>}
        {view.message && <p className="importResultMessage">{view.message}</p>}
        {details}
      </div>
      {actions && <div className="importResultActions">{actions}</div>}
    </article>
  );
}
