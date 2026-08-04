import { Badge } from '../../src/facades/badge'

export default function AppliqueBadgePreview() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge type="info" variant="solid">
        Information
      </Badge>
      <Badge type="success" variant="solid">
        Success
      </Badge>
      <Badge type="warning" variant="outlined">
        Warning
      </Badge>
      <Badge type="error" variant="outlined">
        Error
      </Badge>
    </div>
  )
}
