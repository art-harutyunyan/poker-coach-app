import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function PrototypeDialog({
  kind,
  onClose,
}: {
  kind: "upload" | "profile";
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="prototypeDialog"
      aria-labelledby="prototype-dialog-title"
      onCancel={onClose}
    >
      <header>
        <h2 id="prototype-dialog-title">
          {kind === "upload" ? "Upload tournament" : "Settings & profile"}
        </h2>
        <button
          className="iconButton"
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      {kind === "upload" ? (
        <p>
          Tournament imports are not connected in Phase 0. Continue reviewing the
          included Daily Classic sample; no files are uploaded or processed.
        </p>
      ) : (
        <>
          <p>Jacob S. · Demo profile</p>
          <p>
            This review uses mock data. Accounts and saved profile preferences are not
            connected in Phase 0.
          </p>
        </>
      )}
      <button className="secondaryButton" type="button" onClick={onClose}>
        Return to review
      </button>
    </dialog>
  );
}
