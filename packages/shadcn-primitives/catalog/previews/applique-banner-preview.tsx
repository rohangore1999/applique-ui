import { Banner } from '../../src/facades/banner'

export default function AppliqueBannerPreview() {
  return (
    <div className="grid gap-3">
      <Banner color="info" title="Information">
        The registry source is ready for client testing.
      </Banner>
      <Banner color="success">Changes saved successfully.</Banner>
      <Banner color="warning" link={{ href: '#review', displayText: 'Review' }}>
        Check the remaining compatibility decisions.
      </Banner>
      <Banner color="error" onClose={() => {}}>
        This action could not be completed.
      </Banner>
    </div>
  )
}
