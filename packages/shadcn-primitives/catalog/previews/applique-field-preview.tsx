import * as React from 'react'

import { Field } from '../../src/facades/field'
import { Input } from '../../src/input'

export default function AppliqueFieldPreview() {
  const [email, setEmail] = React.useState('buyer@myntra.com')

  return (
    <div className="grid max-w-md gap-5">
      <Field
        description="We will send listing updates here."
        htmlFor="catalogue-email"
        required
        title="Email"
      >
        <Input
          id="catalogue-email"
          onChange={(event) => setEmail(event.currentTarget.value)}
          value={email}
        />
      </Field>

      <Field
        error="Enter a valid partner email."
        htmlFor="invalid-email"
        title="Email with error"
      >
        <Input id="invalid-email" aria-invalid value="invalid" readOnly />
      </Field>
    </div>
  )
}
