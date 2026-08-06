import * as React from 'react'

import {
  InputSelect,
  InputSelectProps,
} from '../../src/facades/input-select'

const sourceOptions = [
  { label: 'DIY', value: 'DIY' },
  { label: 'OI', value: 'OI_VENDOR' },
  { label: 'MAS', value: 'MAS' },
]

const statusOptions = [
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export default function AppliqueInputSelectPreview() {
  const [source, setSource] = React.useState<InputSelectProps['value']>('DIY')
  const [statuses, setStatuses] = React.useState<InputSelectProps['value']>([
    'IN_PROGRESS',
  ])

  return (
    <div className="grid w-full max-w-md gap-5">
      <InputSelect
        label="Source"
        onChange={setSource}
        options={sourceOptions}
        placeholder="Source"
        value={source}
      />
      <InputSelect
        description="Select one or more listing states"
        label="Status"
        multiple
        onChange={setStatuses}
        options={statusOptions}
        placeholder="Status"
        value={statuses}
      />
    </div>
  )
}
