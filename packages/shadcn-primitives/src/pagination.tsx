import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import * as React from "react"

import { cn } from "./utils"
import { withReact18Ref } from "./applique-react18-compat"
import { Button } from "./button"
function PaginationImpl({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContentImpl({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItemImpl({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLinkImpl({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPreviousImpl({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon
        data-icon="inline-start"
        className="cn-rtl-flip"
       />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNextImpl({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon
        data-icon="inline-end"
        className="cn-rtl-flip"
       />
    </PaginationLink>
  )
}

function PaginationEllipsisImpl({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
       />
      <span className="sr-only">More pages</span>
    </span>
  )
}

const Pagination = withReact18Ref(PaginationImpl)
const PaginationContent = withReact18Ref(PaginationContentImpl)
const PaginationItem = withReact18Ref(PaginationItemImpl)
const PaginationLink = withReact18Ref(PaginationLinkImpl)
const PaginationPrevious = withReact18Ref(PaginationPreviousImpl)
const PaginationNext = withReact18Ref(PaginationNextImpl)
const PaginationEllipsis = withReact18Ref(PaginationEllipsisImpl)

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
