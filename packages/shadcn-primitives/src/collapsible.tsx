"use client"

import { withReact18Ref } from "./applique-react18-compat"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function CollapsibleImpl({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTriggerImpl({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContentImpl({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

const Collapsible = withReact18Ref(CollapsibleImpl)
const CollapsibleTrigger = withReact18Ref(CollapsibleTriggerImpl)
const CollapsibleContent = withReact18Ref(CollapsibleContentImpl)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
