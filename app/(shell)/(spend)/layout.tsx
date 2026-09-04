// (spend) route group — parentheses folder, so /spend-optimizer and /points-optimizer
// keep their URLs. This layout persists across the two tabs: it owns the "Spend"
// section name + the SectionTabs strip, so the strip's Y never moves between siblings
// and only the panel below (each page's headline + tool) swaps, with an opacity-only
// fade (PanelFade). paddingBottom carries the bottom-tab clearance the pages used to
// set on their own outer wrapper.
export default function SpendLayout({ children }: { children: React.ReactNode }) {
  return <div className="ciq-approved-stage">{children}</div>
}
