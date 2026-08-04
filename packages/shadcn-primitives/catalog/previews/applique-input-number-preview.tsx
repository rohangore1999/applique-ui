import * as React from 'react'

import { InputNumber } from '../../src/facades/input-number'

export default function AppliqueInputNumberPreview() {
  const [quantity, setQuantity] = React.useState(2)

  return (
    <div className="grid w-full max-w-sm gap-3">
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="quantity">
        Quantity
        <InputNumber
          id="quantity"
          min={1}
          onChange={setQuantity}
          placeholder="Enter quantity"
          value={quantity}
        />
      </label>
      <span className="text-sm text-muted-foreground">
        Applique callback value:{' '}
        {Number.isNaN(quantity) ? 'empty (NaN)' : quantity}
      </span>
    </div>
  )
}
