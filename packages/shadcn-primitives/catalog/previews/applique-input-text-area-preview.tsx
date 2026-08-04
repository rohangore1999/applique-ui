import * as React from 'react'

import { InputTextArea } from '../../src/facades/input-text-area'

export default function AppliqueInputTextAreaPreview() {
  const [value, setValue] = React.useState('A registry-owned facade')

  return (
    <div className="grid w-full max-w-lg gap-2">
      <label className="text-sm font-medium" htmlFor="registry-notes">
        Notes
      </label>
      <InputTextArea
        id="registry-notes"
        onChange={setValue}
        placeholder="Add notes"
        rows={3}
        value={value}
      />
      <span className="text-sm text-muted-foreground">
        {value.length} characters
      </span>
    </div>
  )
}
