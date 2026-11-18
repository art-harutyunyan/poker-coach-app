import { useId } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import "./nocturne.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function NocturneSurface({
  raised = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { raised?: boolean }) {
  return (
    <div
      {...props}
      className={`noc-surface${raised ? " noc-surface--raised" : ""} ${className}`.trim()}
    />
  );
}

export function NocturneButton({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`noc-button noc-button--${variant} ${className}`.trim()}
    />
  );
}

export function NocturneIconButton({
  className = "",
  type = "button",
  ...props
}: ButtonProps & { "aria-label": string }) {
  return (
    <button {...props} type={type} className={`noc-icon-button ${className}`.trim()} />
  );
}

export function NocturneBadge({
  status = "neutral",
  children,
  className = "",
}: {
  status?: "neutral" | "success" | "warning" | "error" | "unavailable";
  children: string;
  className?: string;
}) {
  return (
    <span className={`noc-badge ${className}`.trim()} data-status={status}>
      {children}
    </span>
  );
}

export type NocturneGrade = "best" | "good" | "inaccuracy" | "mistake" | "major";

export function NocturneGradePill({
  grade,
  label,
  className = "",
}: {
  grade: NocturneGrade;
  label: string;
  className?: string;
}) {
  return (
    <span className={`noc-grade-pill ${className}`.trim()} data-grade={grade}>
      {label}
    </span>
  );
}

export function NocturneSearchInput({
  label,
  id,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={`noc-search ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <input {...props} id={inputId} type="search" />
    </div>
  );
}

export function NocturneFilterChip({
  selected = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps & { selected?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      data-selected={selected}
      className={`noc-filter-chip ${className}`.trim()}
    />
  );
}

export function NocturneSegmentedControl({
  label,
  options,
  value,
  onValueChange,
  className = "",
}: {
  label: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  value: string;
  onValueChange(value: string): void;
  className?: string;
}) {
  return (
    <div
      className={`noc-segmented ${className}`.trim()}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          aria-pressed={value === option.value}
          data-selected={value === option.value}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function NocturneUnavailable({ label = "Unavailable" }: { label?: string }) {
  return (
    <span className="noc-unavailable">
      <span aria-hidden="true">—</span>
      <span className="noc-visually-hidden">{label}</span>
    </span>
  );
}

export function NocturneEmptyState({
  title,
  description,
  icon,
  actions,
  headingLevel = 2,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="noc-empty-state">
      {icon && <div className="noc-empty-state__icon">{icon}</div>}
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {actions && <div className="noc-empty-state__actions">{actions}</div>}
    </div>
  );
}
