import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-brand-800 hover:shadow-md active:scale-[0.98]",
        accent:
          "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-brand-200 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-brand-100",
        ghost: "text-brand-900 hover:bg-brand-50",
        link: "rounded-none text-brand-600 underline-offset-4 hover:underline",
        white:
          "bg-white text-brand-900 shadow-sm hover:bg-brand-50 active:scale-[0.98]",
        whatsapp:
          "bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe5a] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 gap-1.5 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
