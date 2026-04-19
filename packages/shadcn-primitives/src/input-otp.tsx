import * as React from 'react'
import * as InputOTPLib from 'input-otp'
import { Dot } from 'lucide-react'
import { cn } from './utils'

const OTPInputPrimitive: any = (InputOTPLib as any).OTPInput
const OTPInputContext: React.Context<any> = (InputOTPLib as any).OTPInputContext

const InputOTP = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & {
    maxLength: number
    containerClassName?: string
    value?: string
    onChange?: (v: string) => void
    pattern?: string
  }
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInputPrimitive
    ref={ref}
    data-slot="input-otp"
    containerClassName={cn(
      'flex items-center gap-2 has-[:disabled]:opacity-50',
      containerClassName
    )}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-otp-group"
    className={cn('flex items-center', className)}
    {...props}
  />
))
InputOTPGroup.displayName = 'InputOTPGroup'

interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<'div'> {
  index: number
}

const InputOTPSlot = React.forwardRef<React.ElementRef<'div'>, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

    return (
      <div
        ref={ref}
        data-slot="input-otp-slot"
        className={cn(
          'relative flex h-9 w-9 items-center justify-center border-y border-r border-solid border-input text-sm shadow-xs transition-all',
          'first:rounded-l-md first:border-l last:rounded-r-md',
          isActive && 'z-10 ring-[3px] ring-ring/50 border-ring',
          className
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
          </div>
        )}
      </div>
    )
  }
)
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} data-slot="input-otp-separator" role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
