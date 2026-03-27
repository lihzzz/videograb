import { cn } from "../../utils";

type ProgressProps = {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
};

export function Progress({ value, max = 100, className, showLabel = true }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
