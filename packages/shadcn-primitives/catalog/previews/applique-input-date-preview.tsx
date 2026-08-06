import * as React from 'react'

import {
  InputDate,
  InputDateProps,
} from '../../src/facades/input-date'

export default function AppliqueInputDatePreview() {
  const [lastUpdated, setLastUpdated] =
    React.useState<InputDateProps['value']>('2026-08-05')
  const [uploadedBetween, setUploadedBetween] =
    React.useState<InputDateProps['value']>({
      from: '2026-07-06',
      to: '2026-08-05',
    })

  return (
    <div className="grid w-full max-w-md gap-5">
      <InputDate
        description="Select last updated date"
        format="yyyy-MM-dd"
        label="Last Updated On"
        onChange={setLastUpdated}
        value={lastUpdated}
      />
      <InputDate
        description="Select uploaded between dates"
        format="yyyy-MM-dd"
        label="Uploaded Between Dates"
        onChange={setUploadedBetween}
        range
        value={uploadedBetween}
      />
    </div>
  )
}
