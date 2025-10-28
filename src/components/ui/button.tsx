import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-800 to-blue-700 text-white hover:from-blue-900 hover:to-blue-800",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
        outline:
          "border-2 border-blue-800 bg-white text-blue-800 hover:bg-blue-50",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300",
        ghost:
          "hover:bg-blue-50 hover:text-blue-800 text-gray-600",
        link: "text-blue-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-13 px-7 py-3.5 has-[>svg]:px-6",
        sm: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        lg: "h-15 px-9 py-4.5 has-[>svg]:px-7",
        icon: "size-13",
        "icon-sm": "size-11",
        "icon-lg": "size-15",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
