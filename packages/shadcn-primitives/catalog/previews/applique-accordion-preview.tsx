import { Accordion } from '../../src/facades/accordion'

export default function AppliqueAccordionPreview() {
  return (
    <Accordion className="w-full max-w-lg">
      <Accordion.Item title="What is the registry?">
        It copies reviewed Applique component source into the client project.
      </Accordion.Item>
      <Accordion.Item title="Can more than one section stay open?">
        Yes. The facade preserves the legacy multi-open behavior.
      </Accordion.Item>
    </Accordion>
  )
}
