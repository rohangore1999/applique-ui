'use client'

import * as React from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb'

export interface BreadCrumbItemProps
  extends React.ComponentPropsWithoutRef<'li'> {}

/**
 * A declarative breadcrumb item. The root turns it into the matching shadcn
 * item and owns separators/current-page behavior.
 */
function BreadCrumbItem(
  _props: BreadCrumbItemProps
): React.ReactElement | null {
  return null
}

BreadCrumbItem.displayName = 'BreadCrumb.Item'

export interface BreadCrumbProps
  extends React.ComponentPropsWithoutRef<'nav'> {}

const BreadCrumbRoot = React.forwardRef<HTMLElement, BreadCrumbProps>(
  ({ children, ...props }, ref) => {
    const childNodes = React.Children.toArray(children)
    const itemNodes = childNodes.filter(isBreadCrumbItem)
    const lastItem = itemNodes[itemNodes.length - 1]
    let renderedItems = 0

    return (
      <Breadcrumb {...props} ref={ref}>
        <BreadcrumbList>
          {childNodes.map((child, index) => {
            // Preserve non-marker children exactly as the legacy <ol> did.
            if (!isBreadCrumbItem(child)) return child

            const separator = renderedItems > 0
            renderedItems += 1
            const isCurrentPage = child === lastItem
            const { children: itemChildren, ...itemProps } = child.props

            return (
              <React.Fragment key={child.key ?? index}>
                {separator ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem {...itemProps}>
                  {isCurrentPage ? (
                    <BreadcrumbPage>
                      {getCurrentPageContent(itemChildren)}
                    </BreadcrumbPage>
                  ) : (
                    itemChildren
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
)

BreadCrumbRoot.displayName = 'BreadCrumb'

function isBreadCrumbItem(
  child: React.ReactNode
): child is React.ReactElement<BreadCrumbItemProps> {
  return React.isValidElement(child) && child.type === BreadCrumbItem
}

/**
 * Legacy examples commonly wrap the last label in a plain anchor. A current
 * page is not a navigation target, so retain the anchor's content rather than
 * its href. Custom link components remain intact because their behavior cannot
 * be inferred safely.
 */
function getCurrentPageContent(children: React.ReactNode): React.ReactNode {
  const nodes = React.Children.toArray(children)
  const onlyChild = nodes.length === 1 ? nodes[0] : null

  if (
    React.isValidElement<{ children?: React.ReactNode }>(onlyChild) &&
    onlyChild.type === 'a'
  ) {
    return onlyChild.props.children
  }

  return children
}

const BreadCrumb = Object.assign(BreadCrumbRoot, { Item: BreadCrumbItem })

export { BreadCrumb, BreadCrumbItem }
