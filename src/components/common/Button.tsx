import { cn } from "../../utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-primary-600 text-white hover:bg-primary-700": variant === "default",
          "border border-border bg-background hover:bg-muted": variant === "outline",
          "hover:bg-muted": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
          "h-8 px-3 text-sm": size === "sm",
          "h-10 px-4 py-2": size === "md",
          "h-12 px-6 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
