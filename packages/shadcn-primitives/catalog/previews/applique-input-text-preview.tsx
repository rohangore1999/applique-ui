import * as React from 'react'

import { InputText } from '../../src/facades/input-text'

export default function AppliqueInputTextPreview() {
  const [name, setName] = React.useState('Jane Doe')

  return (
    <div className="grid w-full max-w-sm gap-2">
      <label className="text-sm font-medium" htmlFor="applique-name">
        Name
      </label>
      <InputText
        id="applique-name"
        onChange={setName}
        placeholder="Enter a name"
        value={name}
      />
      <span className="text-sm text-muted-foreground">Value: {name}</span>
    </div>
  )
}
