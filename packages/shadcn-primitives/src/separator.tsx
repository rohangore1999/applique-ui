"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "./utils"
import { withReact18Ref } from "./applique-react18-compat"

function SeparatorImpl({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

const Separator = withReact18Ref(SeparatorImpl)

export { Separator }
