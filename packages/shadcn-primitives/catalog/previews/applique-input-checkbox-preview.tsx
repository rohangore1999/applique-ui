import * as React from 'react'

import { InputCheckbox } from '../../src/facades/input-checkbox'

export default function AppliqueInputCheckboxPreview() {
  const [accepted, setAccepted] = React.useState(true)
  const [partial, setPartial] = React.useState(true)

  return (
    <div className="grid w-full max-w-sm gap-3">
      <InputCheckbox
        onChange={setAccepted}
        title="Accept terms"
        value={accepted}
      />
      <InputCheckbox
        boxtype="dashbox"
        onChange={setPartial}
        title="Partially selected group"
        value={partial}
      />
    </div>
  )
}
