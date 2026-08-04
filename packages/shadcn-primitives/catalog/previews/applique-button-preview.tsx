import { ArrowRightIcon, SaveIcon } from 'lucide-react'

import { Button } from '../../src/facades/button'

export default function AppliqueButtonPreview() {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="primary">Primary</Button>
        <Button type="secondary">Secondary</Button>
        <Button type="tertiary">Tertiary</Button>
        <Button type="link">Link</Button>
        <Button type="text">Text</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={SaveIcon} type="primary">
          Save
        </Button>
        <Button secondaryIcon={ArrowRightIcon}>Continue</Button>
        <Button loading>Saving</Button>
        <Button aria-label="Notifications" notifications={12} />
      </div>
    </div>
  )
}
