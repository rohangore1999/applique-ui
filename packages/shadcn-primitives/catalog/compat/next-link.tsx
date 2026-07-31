import * as React from 'react'

type LinkHref =
  | string
  | {
      hash?: string
      pathname?: string
      query?: Record<string, string | number | boolean>
    }

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: LinkHref
  legacyBehavior?: boolean
  locale?: string | false
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
}

function hrefToString(href: LinkHref) {
  if (typeof href === 'string') return href

  const pathname = href.pathname || ''
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(href.query || {})) {
    query.set(key, String(value))
  }

  const queryString = query.toString()
  return `${pathname}${queryString ? `?${queryString}` : ''}${
    href.hash ? `#${href.hash.replace(/^#/, '')}` : ''
  }`
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      href,
      legacyBehavior: _legacyBehavior,
      locale: _locale,
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      ...props
    },
    ref
  ) => <a ref={ref} href={hrefToString(href)} {...props} />
)
Link.displayName = 'CatalogueNextLink'

export default Link
