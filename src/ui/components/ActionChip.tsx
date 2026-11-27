export function ActionChip({
  kind,
  label,
  amount,
}: {
  kind: string;
  label: string;
  amount?: string;
}) {
  return (
    <span className="player-action-slot" data-kind={kind}>
      <span className={`player-action-text action-${kind}`}>
        <span>{label}</span>
        {amount && (
          <b>
            {" "}
            {amount} <small>BB</small>
          </b>
        )}
      </span>
    </span>
  );
}
