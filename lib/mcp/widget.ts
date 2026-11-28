
export const widgetUri = 'ui://creditiq/card-results.html'

export const widgetHtml = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{color-scheme:light dark;font:15px/1.5 system-ui,sans-serif}
  body{margin:0;padding:16px;color:CanvasText;background:Canvas}
  h1{font-size:19px;margin:0 0 8px}
  p{margin:8px 0} dl{margin:0} dt{font-weight:600} dd{margin:0}
  details{border:1px solid GrayText;border-radius:10px;padding:12px}
  details+details{margin-top:8px} summary{cursor:pointer;font-weight:650}
  .muted{font-size:13px} #results{margin-bottom:12px}
</style>
<main>
  <h1>CreditIQ card results</h1>
  <p id="message" role="status">Waiting for card results…</p>
  <section id="results" aria-label="Card evidence"></section>
  <p id="conditions" class="muted"></p>
  <a id="continue" hidden target="_blank" rel="noopener noreferrer">Continue on CreditIQ</a>
</main>
<script>
  const byId = id => document.getElementById(id);
  const rupees = Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 });
  const allowedLink = value => {
    try {
      const url = new URL(value);
      return url.origin === 'https://www.creditiq.app' ? url.href : null;
    } catch { return null; }
  };
  const rpc = (method, params, id) => parent.postMessage({ jsonrpc:'2.0', method, params, ...(id === undefined ? {} : { id }) }, '*');
  let hostOrigin;
  function render(value) {
    const root = byId('results');
    root.replaceChildren();
    const cards = Array.isArray(value.cards) ? value.cards.slice(0,8) : [];
    byId('message').textContent = cards.length ? cards.length + (cards.length === 1 ? ' card' : ' cards') : 'No matching card evidence.';
    byId('conditions').textContent = [value.conditions, ...(value.limitations || [])].filter(Boolean).join(' ');
    const next = byId('continue');
    const href = allowedLink(value.creditIqUrl);
    next.hidden = !href;
    if (href) next.href = href;
    cards.forEach(card => {
      const row = document.createElement('details');
      row.open = cards.length <= 2;
      const title = document.createElement('summary');
      title.textContent = card.name;
      const facts = document.createElement('dl');
      const entries = [
        ['Annual fee', Number.isFinite(card.annualFeeInr) ? rupees.format(card.annualFeeInr) : 'Unknown'],
        ['Evidence', card.lastVerified ? card.lastVerified + (card.freshness === 'stale' ? ' · needs rechecking' : '') : 'Verification date unknown'],
        ['Reward currency', card.rewardCurrency || 'Unknown'],
        ['Estimated monthly rewards', Number.isFinite(card.estimate?.monthlyRewardsInr) ? rupees.format(card.estimate.monthlyRewardsInr) : null],
      ];
      entries.filter(([, value]) => value !== null).forEach(([label, value]) => {
        const term = document.createElement('dt'), desc = document.createElement('dd');
        term.textContent = label; desc.textContent = value; facts.append(term, desc);
      });
      row.append(title, facts);
      root.append(row);
    });
    rpc('ui/notifications/size-changed', { height: document.documentElement.scrollHeight });
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.jsonrpc !== '2.0') return;
    const message = event.data;
    if (message.id === 1 && message.result && !hostOrigin) {
      hostOrigin = event.origin;
      rpc('ui/notifications/initialized', {});
    }
    if (event.origin !== hostOrigin) return;
    if (message.method === 'ui/notifications/tool-result' && message.params?.structuredContent) render(message.params.structuredContent);
  });
  rpc('ui/initialize', { protocolVersion:'2026-01-26', appInfo:{ name:'CreditIQ',version:'1.0.0' }, appCapabilities:{} }, 1);
</script>
</html>`
