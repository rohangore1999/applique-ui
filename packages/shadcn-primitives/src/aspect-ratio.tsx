import { cn } from "./utils"
import { withReact18Ref } from "./applique-react18-compat"

function AspectRatioImpl({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  )
}

const AspectRatio = withReact18Ref(AspectRatioImpl)

export { AspectRatio }
