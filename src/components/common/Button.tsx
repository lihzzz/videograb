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
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "shadow-sm hover:shadow-md",
        {
          "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800": variant === "default",
          "border border-border bg-background hover:bg-muted": variant === "outline",
          "hover:bg-muted/50": variant === "ghost",
          "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800": variant === "destructive",
          "h-9 px-4 text-sm": size === "sm",
          "h-11 px-6 py-2": size === "md",
          "h-12 px-8 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
