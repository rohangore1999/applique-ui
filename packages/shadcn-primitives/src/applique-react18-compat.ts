import * as React from 'react'

export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | null | undefined>
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value)
      else if (ref != null) {
        const mutableRef = ref as React.MutableRefObject<T | null>
        mutableRef.current = value
      }
    }
  }
}

/**
 * The pinned shadcn source treats `ref` as a normal prop, which is supported by
 * React 19. React 18 removes `ref` before invoking a function component. This
 * wrapper puts the forwarded ref back into the props object so the normalized
 * component can pass it to its DOM or primitive target.
 *
 * Returning the original component type preserves generic and third-party prop
 * surfaces while changing only the runtime ref transport.
 */
export function withReact18Ref<
  Component extends (props: any) => React.ReactElement | null
>(Component: Component): Component {
  const Forwarded = React.forwardRef<
    unknown,
    React.ComponentProps<Component>
  >((props, ref) => {
    const forwardedProps =
      ref == null ? props : ({ ...props, ref } as Parameters<Component>[0])

    return Component(forwardedProps as Parameters<Component>[0])
  })

  Forwarded.displayName = Component.name.replace(/Impl$/, '')

  return Forwarded as unknown as Component
}
