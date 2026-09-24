// Tire positions for each axle layout. Shared by the API (validation)
// and the frontend (drawing the axle diagram).
// Position code: A{axle number}-{side}. L/R = single tire, LO/LI/RI/RO = duals.

const DUALS = ['LO', 'LI', 'RI', 'RO'] as const
const SINGLES = ['L', 'R'] as const

export const AXLE_LAYOUTS = {
  tractor_4x2:          { label: 'Tractor, single drive axle', unitClass: 'tractor', axles: [SINGLES, DUALS] },
  tractor_6x4:          { label: 'Tractor, tandem drive',      unitClass: 'tractor', axles: [SINGLES, DUALS, DUALS] },
  trailer_tandem_dual:  { label: 'Trailer, tandem duals',      unitClass: 'trailer', axles: [DUALS, DUALS] },
  trailer_tridem_dual:  { label: 'Trailer, tridem duals',      unitClass: 'trailer', axles: [DUALS, DUALS, DUALS] },
  trailer_tandem_wide:  { label: 'Trailer, tandem wide-base',  unitClass: 'trailer', axles: [SINGLES, SINGLES] },
} as const

export type LayoutKey = keyof typeof AXLE_LAYOUTS

export function isLayoutKey(key: string): key is LayoutKey {
  return key in AXLE_LAYOUTS
}

export function positionsFor(layout: string): string[] {
  if (!isLayoutKey(layout)) return []
  return AXLE_LAYOUTS[layout].axles.flatMap((sides, i) => sides.map((s) => `A${i + 1}-${s}`))
}
