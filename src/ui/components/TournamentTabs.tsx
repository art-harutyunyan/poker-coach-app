import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export type TournamentTab = "overview" | "replayer" | "review";
export function TournamentTabs({
  value,
  onChange,
  header,
  children,
}: {
  value: TournamentTab;
  onChange(tab: TournamentTab): void;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Tabs.Root
      className="tournamentTabs"
      data-active-screen={value}
      value={value}
      onValueChange={(value) => onChange(value as TournamentTab)}
    >
      {header}
      <Tabs.List className="tabList" aria-label="Tournament sections">
        {(
          [
            ["overview", "Overview"],
            ["replayer", "Replayer"],
            ["review", "Review Queue"],
          ] as const
        ).map(([tab, label]) => (
          <Tabs.Trigger
            className="tabTrigger"
            key={tab}
            value={tab}
            onClick={() => onChange(tab)}
          >
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}
