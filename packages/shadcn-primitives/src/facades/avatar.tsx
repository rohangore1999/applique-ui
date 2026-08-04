'use client'

import * as React from 'react'

import {
  Avatar as InternalAvatar,
  AvatarFallback as InternalAvatarFallback,
} from '../avatar'

type InternalAvatarProps = React.ComponentPropsWithoutRef<typeof InternalAvatar>

export interface AvatarProps extends Omit<InternalAvatarProps, 'size'> {
  /** The name used to generate initials and the default accessible label. */
  name: string
  /** Preserves the existing Applique size vocabulary. */
  size?: 'small' | 'medium' | 'large'
}

const sizeMap = {
  small: 'sm',
  medium: 'default',
  large: 'lg',
} as const

const dimensionMap = {
  small: '16px',
  medium: '32px',
  large: '64px',
} as const

const initialsFontSizeMap = {
  small: '9px',
  medium: '18px',
  large: '36px',
} as const

const letterPattern = /^[a-z\u00c0-\u017f]/i

function makeInitials(name: string) {
  const nameTokens = name.toUpperCase().split(/[\s+-]/)
  const tokens: string[] = []
  let initials = ''

  for (const token of nameTokens) {
    if (!letterPattern.test(token)) break
    tokens.push(token)
  }

  if (tokens.length >= 1) initials += tokens[0].substring(0, 1)

  if (tokens.length >= 2) {
    const firstNonInitial = tokens.slice(1).find((token) => !token.match(/.\./))
    initials += (firstNonInitial || tokens[1]).substring(0, 1)
  }

  return initials
}

const Avatar = React.forwardRef<HTMLElement, AvatarProps>(
  (
    {
      'aria-label': ariaLabel,
      children,
      name,
      role = 'img',
      size,
      style,
      title,
      ...internalProps
    },
    ref
  ) => {
    const normalizedName = name
      .replace(
        /([^ ])([A-Z])/g,
        (_match, first, second) => `${first} ${second}`
      )
      .trim()
    const dimensions = {
      height: size ? dimensionMap[size] : '1em',
      width: size ? dimensionMap[size] : '1em',
    }
    const resolvedStyle: InternalAvatarProps['style'] =
      typeof style === 'function'
        ? (state) => ({ ...dimensions, ...style(state) })
        : { ...dimensions, ...style }

    return (
      <InternalAvatar
        {...internalProps}
        ref={ref}
        aria-label={ariaLabel ?? name}
        role={role}
        size={sizeMap[size ?? 'small']}
        style={resolvedStyle}
        title={title ?? name}
      >
        {children === undefined ? (
          <InternalAvatarFallback
            aria-hidden="true"
            data-test-id="initials"
            style={{ fontSize: size ? initialsFontSizeMap[size] : '0.5625em' }}
          >
            {makeInitials(normalizedName)}
          </InternalAvatarFallback>
        ) : (
          children
        )}
      </InternalAvatar>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
