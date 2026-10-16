import type {
  ChipTheme,
  PreviewTableSize,
  ReplayerCardTheme,
  TableTheme,
  VisualPreviewSelection,
} from "./visualThemes";
import {
  chipThemeOptions,
  previewTableSizeOptions,
  replayerCardThemeOptions,
  tableThemeOptions,
} from "./visualThemes";
import { SlidersHorizontal } from "lucide-react";

export function VisualPreviewControl({
  onChange,
  value,
}: {
  onChange: (value: VisualPreviewSelection) => void;
  value: VisualPreviewSelection;
}) {
  return (
    <details className="visualPreviewDisclosure">
      <summary>
        <SlidersHorizontal size={14} aria-hidden="true" />
        Visual preview
      </summary>
      <div className="visualPreviewControl" aria-label="Development visual preview">
        <label className="previewField">
          <span>Card Theme</span>
          <select
            aria-label="Card deck preview"
            value={value.cardTheme}
            onChange={(event) =>
              onChange({
                ...value,
                cardTheme: event.currentTarget.value as ReplayerCardTheme,
              })
            }
          >
            {replayerCardThemeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="previewField">
          <span>Table Theme</span>
          <select
            aria-label="Table skin preview"
            value={value.tableTheme}
            onChange={(event) =>
              onChange({
                ...value,
                tableTheme: event.currentTarget.value as TableTheme,
              })
            }
          >
            {tableThemeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="previewField">
          <span>Chip Theme</span>
          <select
            aria-label="Chip style preview"
            value={value.chipTheme}
            onChange={(event) =>
              onChange({ ...value, chipTheme: event.currentTarget.value as ChipTheme })
            }
          >
            {chipThemeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="previewField">
          <span>Table Size</span>
          <select
            aria-label="Table size preview"
            value={value.tableSize}
            onChange={(event) =>
              onChange({
                ...value,
                tableSize: Number(event.currentTarget.value) as PreviewTableSize,
              })
            }
          >
            {previewTableSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}
