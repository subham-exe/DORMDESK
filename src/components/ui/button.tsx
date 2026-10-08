import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    // Base styles:
    // - font-medium (500) per typography.md
    // - min-h-[44px] for touch targets per components.md (using min-h-11 which is 44px in tailwind)
    // - rounded-md per spacing.md
    // - inline-flex, center content, focus rings
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
    
    const variants = {
      primary: "bg-primary text-text-inverse hover:bg-primary-hover shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-border",
      outline: "border border-border bg-transparent hover:bg-secondary",
      ghost: "bg-transparent hover:bg-secondary",
      destructive: "bg-error text-text-inverse hover:bg-error/90",
    };

    const sizes = {
      default: "h-11 px-4 py-2", // 44px height
      sm: "h-9 px-3 text-sm min-h-[44px]", // Minimum touch target retained on mobile via min-h
      lg: "h-12 px-8 text-lg",
      icon: "h-11 w-11", // 44x44
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (asChild) {
      const { children, ...restProps } = props;
      if (React.isValidElement(children)) {
        const childProps = children.props as any;
        return React.cloneElement(children as React.ReactElement, {
          ...restProps,
          ...childProps,
          className: childProps.className ? `${classes} ${childProps.className}` : classes,
          ref: (node: any) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
            const childRef = (children as any).ref;
            if (typeof childRef === 'function') childRef(node);
            else if (childRef) childRef.current = node;
          }
        });
      }
    }

    return (
      <button ref={ref} className={classes} {...props} />
    );
  }
);
Button.displayName = "Button";
