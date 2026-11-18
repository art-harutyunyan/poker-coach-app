import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Home,
  Settings,
  Spade,
  Trophy,
  Upload,
} from "lucide-react";

export type AppRoute =
  "dashboard" | "tournaments" | "development" | "training" | "playbook";

const destinations = [
  { route: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: Home },
  { route: "tournaments", label: "Tournaments", shortLabel: "Events", icon: Trophy },
  {
    route: "development",
    label: "Development",
    shortLabel: "Develop",
    icon: BarChart3,
  },
  { route: "training", label: "Training", shortLabel: "Train", icon: GraduationCap },
  { route: "playbook", label: "Playbook", shortLabel: "Playbook", icon: BookOpen },
] as const;

type ShellProps = {
  route: AppRoute;
  replayerScreen?: boolean;
  onNavigate: (route: AppRoute) => void;
  onUpload: () => void;
  onSettings: () => void;
  children: ReactNode;
};

export function ApplicationShell({
  route,
  replayerScreen = false,
  onNavigate,
  onUpload,
  onSettings,
  children,
}: ShellProps) {
  return (
    <div
      className={`appShell studyShell nocturneShell${!replayerScreen ? " studyPage" : ""}`}
      data-replayer-screen={replayerScreen}
    >
      <aside className="sidebar" aria-label="Application rail">
        <div className="brandLockup" aria-label="The Study">
          <div className="brandMark" aria-hidden="true">
            S
          </div>
        </div>
        <nav className="navList" aria-label="Primary navigation">
          {destinations.map(({ route: destination, label, shortLabel, icon: Icon }) => (
            <button
              className="navButton"
              data-active={route === destination}
              aria-current={route === destination ? "page" : undefined}
              aria-label={label}
              title={label}
              key={destination}
              onClick={() => onNavigate(destination)}
              type="button"
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span aria-hidden="true">{shortLabel}</span>
            </button>
          ))}
        </nav>
        <button
          className="sidebarUpload"
          type="button"
          onClick={onUpload}
          title="Upload tournament"
          aria-label="Upload tournament"
        >
          <Upload size={20} strokeWidth={1.8} aria-hidden="true" />
          <span aria-hidden="true">Import</span>
        </button>
        <button
          className="sidebarSettings"
          type="button"
          onClick={onSettings}
          title="Settings & profile"
          aria-label="Settings & profile"
        >
          <Settings size={20} strokeWidth={1.8} aria-hidden="true" />
          <span aria-hidden="true">Settings</span>
        </button>
        <div className="sidebarAccount" aria-label="Demo account: Jacob S.">
          <div className="accountAvatar" aria-hidden="true">
            JS
          </div>
        </div>
      </aside>

      <nav className="mobileNav" aria-label="Mobile navigation">
        <div className="mobileBrand">
          <Spade size={20} fill="currentColor" aria-hidden="true" />
          <div>
            <strong>The Study</strong>
          </div>
        </div>
        <label className="mobileNavSelect">
          <span>Screen</span>
          <select
            aria-label="Primary mobile screen"
            value={route}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (next === "upload") onUpload();
              else if (next === "profile") onSettings();
              else onNavigate(next as AppRoute);
            }}
          >
            {destinations.map(({ route: destination, label }) => (
              <option key={destination} value={destination}>
                {label}
              </option>
            ))}
            <option value="upload">Upload tournament</option>
            <option value="profile">Settings & profile</option>
          </select>
        </label>
      </nav>
      {children}
    </div>
  );
}

export function MainWorkspace({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={`mainSurface ${className}`.trim()}>{children}</main>;
}
