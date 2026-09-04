'use client'

// The approved v3 prototype is the visual source of truth. Keep the QA route
// pointed at that exact document instead of maintaining a second, approximate
// React recreation that can drift from the signed-off design.
const APPROVED_MOCK_URL = '/mockups/creditiq-app-v3/index.html'

export function DesignQaClient() {
  return (
    <main
      aria-label="CreditIQ approved design preview"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f5f7f8' }}
    >
      <iframe
        src={APPROVED_MOCK_URL}
        title="CreditIQ approved clean editorial redesign"
        style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
      />
    </main>
  )
}
