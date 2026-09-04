// (spend) route group — parentheses folder, so /spend-optimizer and /points-optimizer
// keep their URLs. The signed-in v3 contract is loaded globally after the legacy
// workspace CSS, so Spend uses the same visual source of truth as every other tab.
export default function SpendLayout({ children }: { children: React.ReactNode }) {
  return <div className="ciq-approved-stage">{children}</div>
}
