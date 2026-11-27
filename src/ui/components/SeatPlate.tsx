import type { Player } from "../../domain/schemas";
import { formatChips } from "../format";
import { positionLabel } from "./seatLayout";

export type SeatState = "waiting" | "active" | "to-act" | "folded" | "all-in";

function positionTone(position: Player["position"]) {
  if (position === "SB" || position === "BB") return "blinds";
  if (position === "UTG" || position.startsWith("UTG_PLUS_")) return "early";
  if (position === "LJ" || position === "HJ") return "middle";
  return "late";
}

export function SeatPlate({
  name,
  identity,
  position,
  stackBB,
  stackChips,
  status,
  state,
  hero,
  importedOpponent,
}: {
  name: string;
  identity: string;
  position: Player["position"];
  stackBB: number;
  stackChips: number;
  status: string;
  state: SeatState;
  hero: boolean;
  importedOpponent: boolean;
}) {
  const label = positionLabel(position);
  return (
    <div
      className="player-nameplate"
      role="group"
      aria-current={state === "to-act" ? "true" : undefined}
      data-state={state}
      data-tone={positionTone(position)}
      title={`${identity} · ${formatChips(stackChips)} chips`}
      aria-label={`${label}, ${identity}, ${stackBB.toFixed(1)} BB${hero ? ", Hero" : ""}, ${status}${state === "to-act" ? ", Current actor" : ""}`}
    >
      <div className="player-nameplate__top">
        <span
          className={`player-name${importedOpponent ? " importedOpponentName" : ""}`}
          title={identity}
        >
          {name}
        </span>
        <span className="player-position-badge" aria-label={`Position ${label}`}>
          {label}
        </span>
      </div>
      <div className="player-nameplate__bottom">
        <b className="player-stack">
          {stackBB.toFixed(1)} <small>BB</small>
        </b>
        <span className="player-status">{status}</span>
      </div>
    </div>
  );
}
