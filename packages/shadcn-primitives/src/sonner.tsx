import * as React from 'react'
import * as SonnerLib from 'sonner'

const SonnerToaster: any = (SonnerLib as any).Toaster

const Toaster = (props: React.ComponentProps<typeof SonnerToaster>) => (
  <SonnerToaster
    data-slot="toaster"
    theme="light"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }}
    {...props}
  />
)

const toast: any = (SonnerLib as any).toast
export { Toaster, toast }
