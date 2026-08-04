import { Tooltip } from '../../src/facades/tooltip'

export default function AppliqueTooltipPreview() {
  return (
    <div className="flex items-center gap-4 py-8">
      <Tooltip renderContent={() => 'Light Applique tooltip'}>
        <button className="rounded-lg border px-3 py-2" type="button">
          Light tooltip
        </button>
      </Tooltip>
      <Tooltip dark position="down" renderContent={() => 'Dark tooltip'}>
        <button className="rounded-lg border px-3 py-2" type="button">
          Dark tooltip
        </button>
      </Tooltip>
    </div>
  )
}
