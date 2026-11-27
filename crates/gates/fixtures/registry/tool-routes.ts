// Must-fail fixture for the layoutOptOutAdr check: `beta` names an ADR that
// does not exist, and `gamma` is custom with no ADR at all.
export const TOOL_ROUTE_DEFINITIONS: Array<ToolRouteDefinition> = [
  {
    category: 'Unit',
    key: 'alpha',
    layout: 'custom',
    layoutOptOutAdr: 'ADR-0001',
    name: 'Alpha',
    seo: {
      description: 'key: not-a-key',
    },
  },
  {
    key: 'beta',
    layout: 'custom',
    layoutOptOutAdr: 'ADR-9999',
  },
  {
    key: 'gamma',
    layout: 'custom',
  },
  {
    key: 'delta',
    layout: 'transformer',
  },
]
