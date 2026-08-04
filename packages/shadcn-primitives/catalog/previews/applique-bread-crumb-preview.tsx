import { BreadCrumb } from '../../src/facades/bread-crumb'

export default function AppliqueBreadCrumbPreview() {
  return (
    <BreadCrumb>
      <BreadCrumb.Item>
        <a href="#/">Home</a>
      </BreadCrumb.Item>
      <BreadCrumb.Item>
        <a href="#/components">Components</a>
      </BreadCrumb.Item>
      <BreadCrumb.Item>Breadcrumb</BreadCrumb.Item>
    </BreadCrumb>
  )
}
