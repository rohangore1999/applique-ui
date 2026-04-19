import React from 'react'
import { Button } from '../src/button'
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
      <Button intent="default">Button</Button>
      <Button intent="default" disabled>Button</Button>
      <Button intent="outline">Outline</Button>
      <Button intent="ghost">Ghost</Button>
      <Button intent="destructive">Destructive</Button>
      <Button intent="secondary">Secondary</Button>
      <Button intent="link">Link</Button>

      {/* Buttons with Icons */}
      <Button intent="outline">
        <CircleArrowLeft />
        Send
      </Button>

      <Button intent="outline">
        Learn more
        <ArrowRight />
      </Button>

      {/* Loading Button */}
      <Button intent="outline" disabled>
        <Spinner />
        Please wait
      </Button>

      {/* Small Size Buttons */}
      <Button size="sm" intent="default">Small</Button>
      <Button size="sm" intent="outline">Outline</Button>
      <Button size="sm" intent="ghost">Ghost</Button>
      <Button size="sm" intent="destructive">Destructive</Button>
      <Button size="sm" intent="secondary">Secondary</Button>
      <Button size="sm" intent="link">Link</Button>

      {/* Small with Icons */}
      <Button size="sm" intent="outline">
        <CircleArrowLeft />
        Send
      </Button>

      {/* Small with Focus state */}
      <Button size="sm" intent="outline" className="ring-2 ring-ring ring-offset-2">
        Learn more
        <ArrowRight />
      </Button>

      {/* Small Loading */}
      <Button size="sm" intent="outline" disabled>
        <Spinner />
        Please wait
      </Button>

      {/* Large Size Buttons */}
      <Button size="lg" intent="default">Large</Button>
      <Button size="lg" intent="outline">Outline</Button>
      <Button size="lg" intent="ghost">Ghost</Button>
      <Button size="lg" intent="destructive">Destructive</Button>
      <Button size="lg" intent="secondary">Secondary</Button>

      {/* Large with Icons */}
      <Button size="lg" intent="link">
        <CircleArrowLeft />
        Link
        <ArrowRight />
      </Button>

      <Button size="lg" intent="outline">
        <CircleArrowLeft />
        Send
      </Button>

      <Button size="lg" intent="outline">
        Learn more
        <ArrowRight />
      </Button>

      {/* Large Loading */}
      <Button size="lg" intent="outline" disabled>
        <Spinner />
        Please wait
      </Button>

      {/* Rounded Buttons */}
      <div className="flex gap-2 items-center">
        <Button intent="default" className="rounded-full">Get Started</Button>
        <Button intent="outline" size="icon" className="rounded-full">
          <ArrowUp />
        </Button>
      </div>
    </div>
  )
}
