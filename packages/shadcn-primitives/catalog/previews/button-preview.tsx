import * as React from 'react'
import { ArrowRight, ArrowUp, LoaderCircle, Mail } from 'lucide-react'
import { Button } from '../../src/button'

export function ButtonPreview() {
  return (
    <div className="preview-stack">
      <section className="preview-group">
        <h3>Variants</h3>
        <div className="preview-row">
          <Button type="button">Default</Button>
          <Button type="button" intent="secondary">
            Secondary
          </Button>
          <Button type="button" intent="outline">
            Outline
          </Button>
          <Button type="button" intent="ghost">
            Ghost
          </Button>
          <Button type="button" intent="destructive">
            Destructive
          </Button>
          <Button type="button" intent="link">
            Link
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>Sizes</h3>
        <div className="preview-row preview-row--aligned">
          <Button type="button" size="sm">
            Small
          </Button>
          <Button type="button" size="md">
            Medium
          </Button>
          <Button type="button" size="lg">
            Large
          </Button>
          <Button type="button" size="icon" aria-label="Move up">
            <ArrowUp />
            <span className="sr-only">Move up</span>
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>With icon</h3>
        <div className="preview-row preview-row--aligned">
          <Button type="button">
            <Mail />
            Login with email
          </Button>
          <Button type="button" intent="outline">
            Continue
            <ArrowRight />
          </Button>
          <Button
            type="button"
            intent="outline"
            size="icon"
            aria-label="Move up"
          >
            <ArrowUp />
            <span className="sr-only">Move up</span>
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>Rounded</h3>
        <div className="preview-row preview-row--aligned">
          <Button type="button" className="rounded-full">
            Get started
          </Button>
          <Button
            type="button"
            intent="outline"
            size="icon"
            className="rounded-full"
            aria-label="Move up"
          >
            <ArrowUp />
            <span className="sr-only">Move up</span>
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>Spinner</h3>
        <div className="preview-row preview-row--aligned">
          <Button type="button" disabled aria-busy="true">
            <LoaderCircle className="animate-spin" />
            Please wait
          </Button>
          <Button
            type="button"
            intent="outline"
            size="icon"
            disabled
            aria-busy="true"
            aria-label="Loading"
          >
            <LoaderCircle className="animate-spin" />
            <span className="sr-only">Loading</span>
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>As child</h3>
        <div className="preview-row">
          <Button asChild intent="outline" className="no-underline">
            <a href="../registry/button.json" target="_blank" rel="noreferrer">
              View registry JSON
              <ArrowRight />
            </a>
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>States</h3>
        <div className="preview-row">
          <Button type="button" disabled>
            Disabled
          </Button>
          <Button
            type="button"
            intent="outline"
            className="border-ring ring-[3px] ring-ring/50"
          >
            Focused
          </Button>
        </div>
      </section>

      <section className="preview-group">
        <h3>RTL</h3>
        <div className="preview-row" dir="rtl">
          <Button type="button" intent="outline">
            متابعة
            <ArrowRight />
          </Button>
        </div>
      </section>
    </div>
  )
}
