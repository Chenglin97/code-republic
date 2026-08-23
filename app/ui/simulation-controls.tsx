import styles from "./simulation-controls.module.css";

export type SimulationBusyState = "advance" | "reset" | null;

export interface SimulationControlsProps {
  onAdvance: () => void;
  onReset?: () => void;
  busy?: SimulationBusyState;
  complete?: boolean;
  compact?: boolean;
  nextStep?: string | null;
  className?: string;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function SimulationControls({
  onAdvance,
  onReset,
  busy = null,
  complete = false,
  compact = false,
  nextStep,
  className,
}: SimulationControlsProps) {
  const advanceLabel = busy === "advance"
    ? "Simulating completion…"
    : complete
      ? "Simulation complete"
      : "Simulate completion";

  const advanceDescription = complete
    ? "All scripted completion steps are applied."
    : nextStep ?? "Apply the next scripted completion step.";

  return (
    <div
      className={classNames(styles.controls, compact && styles.compact, className)}
      role="group"
      aria-label="Simulation controls"
      aria-busy={busy !== null}
      data-compact={compact ? "true" : "false"}
    >
      <button
        className={classNames(styles.button, styles.advance, complete && styles.complete)}
        type="button"
        onClick={onAdvance}
        disabled={busy !== null || complete}
        aria-label={advanceLabel}
      >
        <span className={styles.badge}>Simulation</span>
        <span className={styles.copy}>
          <strong>{advanceLabel}</strong>
          {!compact && <small>{advanceDescription}</small>}
        </span>
        <span className={styles.icon} aria-hidden="true">{complete ? "✓" : "→"}</span>
      </button>

      {onReset && (
        <button
          className={classNames(styles.button, styles.reset)}
          type="button"
          onClick={onReset}
          disabled={busy !== null}
          aria-label="Reset completion status for simulation"
        >
          <span className={styles.resetIcon} aria-hidden="true">↺</span>
          <span className={styles.copy}>
            <strong>{busy === "reset" ? "Resetting completion status…" : "Reset completion status for simulation"}</strong>
            {!compact && <small>Return this World to the initial simulation state.</small>}
          </span>
        </button>
      )}
    </div>
  );
}
