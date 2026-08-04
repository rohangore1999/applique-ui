import { Avatar } from '../../src/facades/avatar'

export default function AppliqueAvatarPreview() {
  return (
    <div className="flex items-end gap-4">
      <Avatar name="Jane Doe" size="small" />
      <Avatar name="Jane Doe" size="medium" />
      <Avatar name="Jane Doe" size="large" />
    </div>
  )
}
