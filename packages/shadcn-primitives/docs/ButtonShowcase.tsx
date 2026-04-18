import React from 'react'
import { ShadcnButton } from '../src/button'
import { Spinner } from '../src/spinner'
import '../src/tokens.css'

// Icon Components
const CircleArrowLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8l-4 4 4 4M16 12H8" />
  </svg>
)

const ArrowRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const ArrowUp = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const Sun = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

export default function ButtonShowcase() {
  return (
    <div className="bg-background border border-border flex flex-col gap-16 items-center justify-center px-4 py-32 relative rounded-2xl w-full">
      {/* Theme indicator (sun icon in top right) */}
      <div className="absolute top-4 right-4">
        <Sun className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Default Size Buttons */}
      <ShadcnButton intent="default">Button</ShadcnButton>
      <ShadcnButton intent="default" disabled>Button</ShadcnButton>
      <ShadcnButton intent="outline">Outline</ShadcnButton>
      <ShadcnButton intent="ghost">Ghost</ShadcnButton>
      <ShadcnButton intent="destructive">Destructive</ShadcnButton>
      <ShadcnButton intent="secondary">Secondary</ShadcnButton>
      <ShadcnButton intent="link">Link</ShadcnButton>

      {/* Buttons with Icons */}
      <ShadcnButton intent="outline">
        <CircleArrowLeft />
        Send
      </ShadcnButton>

      <ShadcnButton intent="outline">
        Learn more
        <ArrowRight />
      </ShadcnButton>

      {/* Loading Button */}
      <ShadcnButton intent="outline" disabled>
        <Spinner />
        Please wait
      </ShadcnButton>

      {/* Small Size Buttons */}
      <ShadcnButton size="sm" intent="default">Small</ShadcnButton>
      <ShadcnButton size="sm" intent="outline">Outline</ShadcnButton>
      <ShadcnButton size="sm" intent="ghost">Ghost</ShadcnButton>
      <ShadcnButton size="sm" intent="destructive">Destructive</ShadcnButton>
      <ShadcnButton size="sm" intent="secondary">Secondary</ShadcnButton>
      <ShadcnButton size="sm" intent="link">Link</ShadcnButton>

      {/* Small with Icons */}
      <ShadcnButton size="sm" intent="outline">
        <CircleArrowLeft />
        Send
      </ShadcnButton>

      {/* Small with Focus state */}
      <ShadcnButton size="sm" intent="outline" className="ring-2 ring-ring ring-offset-2">
        Learn more
        <ArrowRight />
      </ShadcnButton>

      {/* Small Loading */}
      <ShadcnButton size="sm" intent="outline" disabled>
        <Spinner />
        Please wait
      </ShadcnButton>

      {/* Large Size Buttons */}
      <ShadcnButton size="lg" intent="default">Large</ShadcnButton>
      <ShadcnButton size="lg" intent="outline">Outline</ShadcnButton>
      <ShadcnButton size="lg" intent="ghost">Ghost</ShadcnButton>
      <ShadcnButton size="lg" intent="destructive">Destructive</ShadcnButton>
      <ShadcnButton size="lg" intent="secondary">Secondary</ShadcnButton>

      {/* Large with Icons */}
      <ShadcnButton size="lg" intent="link">
        <CircleArrowLeft />
        Link
        <ArrowRight />
      </ShadcnButton>

      <ShadcnButton size="lg" intent="outline">
        <CircleArrowLeft />
        Send
      </ShadcnButton>

      <ShadcnButton size="lg" intent="outline">
        Learn more
        <ArrowRight />
      </ShadcnButton>

      {/* Large Loading */}
      <ShadcnButton size="lg" intent="outline" disabled>
        <Spinner />
        Please wait
      </ShadcnButton>

      {/* Rounded Buttons */}
      <div className="flex gap-2 items-center">
        <ShadcnButton intent="default" className="rounded-full">Get Started</ShadcnButton>
        <ShadcnButton intent="outline" size="icon" className="rounded-full">
          <ArrowUp />
        </ShadcnButton>
      </div>
    </div>
  )
}
