import '@/components/ciq/spend-results.css'

// (spend) route group — parentheses folder, so /spend-optimizer and /points-optimizer
// keep their URLs. The approved shell owns the persistent app chrome; this layout only
// provides the shared full-width stage plus Spend-specific result styling.
export default function SpendLayout({ children }: { children: React.ReactNode }) {
  return <div className="ciq-approved-stage">{children}</div>
}
