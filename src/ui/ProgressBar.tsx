type ProgressBarProps = {
  label: string;
  value: number;
  max: number;
  className?: string;
  valueText?: string;
};

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function ProgressBar({ label, value, max, className = '', valueText }: ProgressBarProps) {
  const safeMax = Math.max(1, finite(max, 1));
  const safeValue = Math.max(0, Math.min(safeMax, finite(value, 0)));
  const percent = (safeValue / safeMax) * 100;

  return (
    <div
      className={`bar ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      aria-valuetext={valueText}
    >
      <i aria-hidden="true" style={{ width: `${percent}%` }} />
    </div>
  );
}
