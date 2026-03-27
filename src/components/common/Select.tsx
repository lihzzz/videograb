import { cn } from "../../utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
};

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-background px-3 py-2",
        "text-sm ring-offset-background appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgMTIgOCI+CiAgPGNpcmNsZSBjeD0iMSIgY3k9IjciIHI9IjEiIGZpbGw9IiM0NzU2NmIiLz4KICA8Y2lyY2xlIGN4PSI1IiBjeT0iNyIgcj0iMSIgZmlsbD0iIzQ3NTY2YiIvPgogIDxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSIxIiBmaWxsPSIjNDc1NjZiIi8+Cjwvc3ZnPg==')] bg-no-repeat bg-[right_10px_center] pl-3 pr-10",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
