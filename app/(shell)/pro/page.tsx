// Server component: reads the SERVER-ONLY RAZORPAY_MODE and hands the resolved mode
// to the client. One flag, one source of truth — no NEXT_PUBLIC_ mirror that could
// drift out of sync with the webhook (which reads the same RAZORPAY_MODE).
//   RAZORPAY_MODE=orders  → /pro calls create-order (one-time; webhook grants Pro)
//   unset                 → /pro falls back to create-subscription (unchanged)
// force-dynamic so the env is read per request at runtime, not baked at build time.
import ProClient from './ProClient';

export const dynamic = 'force-dynamic';

export default function ProPage() {
  const ordersMode = process.env.RAZORPAY_MODE === 'orders';
  return <ProClient ordersMode={ordersMode} />;
}
