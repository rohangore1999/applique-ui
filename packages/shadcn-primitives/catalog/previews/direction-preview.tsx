import * as React from 'react'
import { DirectionProvider, useDirection } from '../../src/direction'
import { Example, ExampleWrapper } from '../compat/example'

function DirectionValue() {
  const direction = useDirection()

  return (
    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
      Context: {direction}
    </span>
  )
}

function DirectionSample({
  direction,
  children,
}: {
  direction: 'ltr' | 'rtl'
  children: React.ReactNode
}) {
  return (
    <div
      dir={direction}
      className="flex w-full flex-col gap-3 rounded-lg border border-border p-4"
    >
      <DirectionProvider direction={direction}>
        <DirectionValue />
        <p className="m-0 text-sm">{children}</p>
      </DirectionProvider>
    </div>
  )
}

export default function DirectionPreview() {
  return (
    <ExampleWrapper>
      <Example title="Left to right">
        <DirectionSample direction="ltr">
          Account settings → Notifications
        </DirectionSample>
      </Example>
      <Example title="Right to left">
        <DirectionSample direction="rtl">
          إعدادات الحساب ← الإشعارات
        </DirectionSample>
      </Example>
    </ExampleWrapper>
  )
}
