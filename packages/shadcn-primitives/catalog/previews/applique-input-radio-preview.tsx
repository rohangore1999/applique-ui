import * as React from 'react'

import { InputRadio } from '../../src/facades/input-radio'

const options = [
  { label: 'Standard', value: 'standard' },
  { label: 'Express', value: 'express' },
  { label: 'Scheduled', value: 'scheduled' },
]

export default function AppliqueInputRadioPreview() {
  const [delivery, setDelivery] = React.useState('standard')

  return (
    <div className="grid w-full max-w-sm gap-3">
      <InputRadio
        aria-label="Delivery speed"
        onChange={setDelivery}
        options={options}
        value={delivery}
      />
      <span className="text-sm text-muted-foreground">
        Selected: {delivery}
      </span>
    </div>
  )
}
