import { Loader2Icon } from "lucide-react"
import { cn } from "./utils"
import { withReact18Ref } from "./applique-react18-compat"
function SpinnerImpl({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
     />
  )
}

const Spinner = withReact18Ref(SpinnerImpl)

export { Spinner }
