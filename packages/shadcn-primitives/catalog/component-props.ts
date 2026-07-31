export type PropStrategy =
  | 'available'
  | 'compose'
  | 'forward'
  | 'map'
  | 'policy'

export interface CatalogueProp {
  defaultValue: string
  description: string
  name: string
  strategy: PropStrategy
  type: string
}

export interface CataloguePropGroup {
  description: string
  props: CatalogueProp[]
  status: 'available' | 'planned'
  title: string
}

export const componentPropGroups: Partial<
  Record<string, CataloguePropGroup[]>
> = {
  button: [
    {
      title: 'shadcn-based registry primitive',
      status: 'available',
      description:
        'These props are implemented by the Button source installed from the registry today.',
      props: [
        {
          name: 'intent',
          type: "'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'",
          defaultValue: "'default'",
          strategy: 'available',
          description:
            'Selects the Applique-themed visual intent. This is the primitive equivalent of a shadcn variant.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg' | 'icon'",
          defaultValue: "'md'",
          strategy: 'available',
          description: 'Selects the primitive height, padding, and typography.',
        },
        {
          name: 'asChild',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'available',
          description:
            'Uses the child element through Radix Slot, for example an anchor or router Link.',
        },
        {
          name: 'type',
          type: "'button' | 'submit' | 'reset'",
          defaultValue: 'browser default',
          strategy: 'available',
          description:
            'Native HTML button type. Set it explicitly inside forms; the primitive does not provide a default.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'available',
          description:
            'Disables native button interaction and applies disabled styling.',
        },
        {
          name: 'children',
          type: 'React.ReactNode',
          defaultValue: '—',
          strategy: 'available',
          description: 'Button label or composed child content.',
        },
        {
          name: 'className',
          type: 'string',
          defaultValue: '—',
          strategy: 'available',
          description: 'Merged with the generated Button variant classes.',
        },
        {
          name: 'onClick',
          type: 'React.MouseEventHandler<HTMLButtonElement>',
          defaultValue: '—',
          strategy: 'available',
          description: 'Native React click handler.',
        },
        {
          name: 'ref',
          type: 'React.Ref<HTMLButtonElement>',
          defaultValue: '—',
          strategy: 'available',
          description: 'Forwarded to the rendered button element.',
        },
        {
          name: '...buttonProps',
          type: 'React.ButtonHTMLAttributes<HTMLButtonElement>',
          defaultValue: '—',
          strategy: 'available',
          description:
            'Includes form, name, value, style, id, title, tabIndex, role, events, aria-* and data-* props.',
        },
      ],
    },
    {
      title: 'Applique facade compatibility',
      status: 'planned',
      description:
        'This is the existing Applique Button contract and its intended facade strategy. The facade is documented here but has not been published yet.',
      props: [
        {
          name: 'type',
          type: "'primary' | 'secondary' | 'tertiary' | 'link' | 'text'",
          defaultValue: "'secondary'",
          strategy: 'map',
          description:
            'Maps to primitive intent. Tertiary and text mappings still require final UX confirmation.',
        },
        {
          name: 'notifications',
          type: 'number',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Composes a Bell and count badge, caps the displayed count at 99+, and uses the primary intent when active.',
        },
        {
          name: 'children',
          type: 'string | React.ReactNode',
          defaultValue: '—',
          strategy: 'forward',
          description: 'Forwards directly to the primitive.',
        },
        {
          name: 'onClick',
          type: 'React.MouseEventHandler<HTMLButtonElement>',
          defaultValue: '—',
          strategy: 'forward',
          description: 'Forwards with the corrected React mouse-event type.',
        },
        {
          name: 'icon',
          type: 'IconName',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Resolves an Applique icon and composes it before the label.',
        },
        {
          name: 'secondaryIcon',
          type: 'IconName',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Resolves an Applique icon and composes it after the label.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'forward',
          description: 'Forwards directly to the primitive.',
        },
        {
          name: 'loading',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'compose',
          description:
            'Composes a spinner and applies disabled and aria-busy behavior.',
        },
        {
          name: 'inheritTextColor',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'map',
          description:
            'Maps to facade styling and is consumed before props reach the DOM.',
        },
        {
          name: 'htmlType',
          type: "'submit' | 'reset' | 'button'",
          defaultValue: "'button'",
          strategy: 'map',
          description:
            'Maps to the primitive native type prop because legacy type controls visual styling.',
        },
        {
          name: 'to',
          type: 'string | object',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Composes the configured router Link through the primitive asChild behavior.',
        },
        {
          name: 'href',
          type: 'string',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Composes an anchor through the primitive asChild behavior.',
        },
        {
          name: 'transform',
          type: "'none' | 'capitalize' | 'uppercase' | 'lowercase'",
          defaultValue: "'none'",
          strategy: 'map',
          description: 'Maps to a controlled text-transform style.',
        },
        {
          name: 'size',
          type: "'xs' | 'small' | 'regular' | 'large'",
          defaultValue: "'regular'",
          strategy: 'map',
          description:
            'Maps xs→icon, small→sm, regular→md and large→lg. The xs size remains icon-only.',
        },
        {
          name: 'color',
          type: 'string',
          defaultValue: "'blue'",
          strategy: 'policy',
          description:
            'Needs a semantic token policy. It must be consumed instead of leaking to the native color attribute.',
        },
        {
          name: 'caption',
          type: 'string',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Composes secondary text below the label for the large size.',
        },
        {
          name: 'className',
          type: 'string',
          defaultValue: '—',
          strategy: 'forward',
          description: 'Forwards and merges with primitive classes.',
        },
        {
          name: 'label',
          type: 'React.ReactNode',
          defaultValue: '—',
          strategy: 'map',
          description:
            'De-facto legacy alias read by the old implementation; retain only if compatibility requires it.',
        },
      ],
    },
  ],
  checkbox: [
    {
      title: 'shadcn-based registry primitive',
      status: 'available',
      description:
        'These props are implemented by the Radix-based Checkbox source installed from the registry today.',
      props: [
        {
          name: 'variant',
          type: "'default' | 'destructive'",
          defaultValue: "'default'",
          strategy: 'available',
          description:
            'Selects the Applique-themed default or destructive visual treatment.',
        },
        {
          name: 'checked',
          type: "boolean | 'indeterminate'",
          defaultValue: '—',
          strategy: 'available',
          description: 'Controls the checked state.',
        },
        {
          name: 'defaultChecked',
          type: "boolean | 'indeterminate'",
          defaultValue: 'false',
          strategy: 'available',
          description: 'Sets the initial state for an uncontrolled Checkbox.',
        },
        {
          name: 'onCheckedChange',
          type: "(state: boolean | 'indeterminate') => void",
          defaultValue: '—',
          strategy: 'available',
          description: 'Runs whenever the Radix checked state changes.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'available',
          description: 'Prevents interaction and applies disabled styling.',
        },
        {
          name: 'required',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'available',
          description: 'Participates in native form validation.',
        },
        {
          name: 'name',
          type: 'string',
          defaultValue: '—',
          strategy: 'available',
          description: 'Sets the submitted form field name.',
        },
        {
          name: 'value',
          type: 'string | number | readonly string[]',
          defaultValue: "'on'",
          strategy: 'available',
          description:
            'Sets the submitted Radix form value. The facade reserves value for the legacy boolean state.',
        },
        {
          name: 'form',
          type: 'string',
          defaultValue: '—',
          strategy: 'available',
          description: 'Associates the Checkbox with a form by id.',
        },
        {
          name: 'className',
          type: 'string',
          defaultValue: '—',
          strategy: 'available',
          description: 'Merges classes onto the visible Checkbox control.',
        },
        {
          name: 'ref',
          type: 'React.Ref<HTMLButtonElement>',
          defaultValue: '—',
          strategy: 'available',
          description: 'Forwards to the Radix button element.',
        },
        {
          name: '...rootProps',
          type: 'Radix Checkbox.Root props',
          defaultValue: '—',
          strategy: 'available',
          description:
            'Includes id, tabIndex, events, aria-* and data-* props. Consumer children and asChild are not advertised by this wrapper.',
        },
      ],
    },
    {
      title: 'Applique facade compatibility',
      status: 'planned',
      description:
        'This is the existing InputCheckbox contract and its intended facade strategy. The facade is documented here but has not been published yet.',
      props: [
        {
          name: 'value',
          type: 'boolean',
          defaultValue: 'undefined → unchecked',
          strategy: 'map',
          description:
            'Maps the legacy controlled boolean value to the primitive checked prop.',
        },
        {
          name: 'onChange',
          type: '(value: boolean) => void',
          defaultValue: '—',
          strategy: 'map',
          description:
            'Adapts onCheckedChange and normalizes the Radix state with state === true.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: 'false',
          strategy: 'forward',
          description: 'Forwards directly to the primitive.',
        },
        {
          name: 'readOnly',
          type: 'boolean',
          defaultValue: 'true when onChange is absent',
          strategy: 'compose',
          description:
            'Prevents pointer and keyboard mutation and applies aria-readonly without disabled styling.',
        },
        {
          name: 'htmlValue',
          type: 'string',
          defaultValue: '—',
          strategy: 'map',
          description:
            'Maps to the Radix form value because legacy value stores checked state.',
        },
        {
          name: 'title',
          type: 'React.ReactNode',
          defaultValue: '—',
          strategy: 'compose',
          description:
            'Composes the visible Checkbox label; it must not become a native tooltip title.',
        },
        {
          name: 'boxtype',
          type: 'string',
          defaultValue: 'undefined → checkbox',
          strategy: 'compose',
          description:
            'Uses a Minus indicator for dashbox and a Check indicator for other values.',
        },
        {
          name: 'className',
          type: 'string',
          defaultValue: '—',
          strategy: 'policy',
          description:
            'Legacy applies it to the outer label, while the primitive applies it to the control. The facade needs separate wrapper and control styling.',
        },
        {
          name: 'children',
          type: 'React.ReactNode',
          defaultValue: '—',
          strategy: 'policy',
          description:
            'Inherited accidentally by the legacy BaseProps contract and should not be promised by the new facade.',
        },
        {
          name: '...matchingProps',
          type: 'typed native, aria-* and data-* props',
          defaultValue: '—',
          strategy: 'forward',
          description:
            'Forwards only compatible typed props; the legacy arbitrary-prop index signature is not retained.',
        },
      ],
    },
  ],
}
