import { Button } from '../../src/facades/button'
import { ButtonGroup } from '../../src/facades/button-group'

export default function AppliqueButtonGroupPreview() {
  return (
    <div className="grid gap-5">
      <ButtonGroup aria-label="Form actions">
        <Button type="primary">Save</Button>
        <Button type="secondary">Preview</Button>
        <Button type="text">Cancel</Button>
      </ButtonGroup>
      <ButtonGroup
        aria-label="Primary action with overflow"
        structure="primary-group"
      >
        <Button type="primary">Publish</Button>
        <Button type="secondary">Save draft</Button>
        <Button type="text">Discard</Button>
      </ButtonGroup>
    </div>
  )
}
