import { cn } from "./utils"
import { withReact18Ref } from "./applique-react18-compat"

function SkeletonImpl({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

const Skeleton = withReact18Ref(SkeletonImpl)

export { Skeleton }
