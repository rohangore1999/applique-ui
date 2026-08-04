import { Button } from '../../src/facades/button'
import { Section } from '../../src/facades/section'

export default function AppliqueSectionPreview() {
  return (
    <Section aria-label="Order summary" title="Order summary">
      <Button type="primary">Save</Button>
      <Button type="secondary">Cancel</Button>
      <div className="grid gap-1">
        <p className="font-medium">Two items selected</p>
        <p className="text-muted-foreground">
          Direct Applique Button children are placed in the header action area.
        </p>
      </div>
    </Section>
  )
}
