import { Tabs } from '../../src/facades/tabs'

export default function AppliqueTabsPreview() {
  return (
    <Tabs className="w-full max-w-lg" defaultIndex={0} variant="line">
      <Tabs.Tab title="Overview">
        Registry components keep the Applique API while using shadcn internally.
      </Tabs.Tab>
      <Tabs.Tab title="Updates">
        Clients install updates on a branch and review the source diff.
      </Tabs.Tab>
      <Tabs.Tab disabled title="Disabled">
        This panel cannot be selected.
      </Tabs.Tab>
    </Tabs>
  )
}
