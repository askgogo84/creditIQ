
# CreditIQ connectors

## Architecture and availability

- /mcp is a remote Streamable HTTP server for compatible MCP clients.
- /mcp/claude shares the same public tools and records the Claude distribution channel.
- /mcp/chatgpt shares the same tools and serves an MCP Apps comparison/rewards widget. It uses the standard host bridge and does not fetch external resources.
- The routes are available to eligible Preview environments by default. On Vercel Production, set CREDITIQ_MCP_ENABLED=true only after release approval. No changes to existing Parallel, shopping or award traffic are required.
- Public tools need no account. They use a projected read of the existing Supabase card catalogue with the publishable key and fall back to the repository's dated seed catalogue. There are no additional paid data or model calls.
- The connector never exposes internal tools, bank connections, admin actions, card application actions, bookings, payments, or points transfers.
- All website handoffs are optional. Card links use a fixed CreditIQ origin and platform campaign tags.

## Data quality and permissions

The read-only tool allowlist is search_credit_cards, compare_credit_cards, recommend_credit_cards, check_lounge_access, calculate_rewards, check_card_benefits, optimize_redemption, and find_travel_card. The current rewards calculator models cashback only. Point earn and conversion require explicit issuer evidence. Ranked options are estimates, never a prediction of approval or a quotation. Undated/redemption estimates and conflicts cannot become issuer-established numbers. An exact issuer snapshot covers standard Axis Magnus and HDFC Infinia Metal for comparisons, without substituting Magnus for Burgundy. Missing variants without verified issuer terms are reported as unresolved.

The tool return includes catalogue source, checked-on date, last verification on records and dated valuation/transfer evidence where available. Catalogue dates do not prove that every card field is currently issuer-verified. Card-level lounge evidence does not verify admission at a specific airport or account.

The app only scans structured catalogue values. It does not ingest arbitrary issuer HTML, community posts, dynamic links, prompts, or paid research results as instructions. Request size, input schemas, Origin validation and a shared database-backed rate gate protect the endpoint. The rate gate fails closed on Vercel if unavailable. Only a rotating digest of the Vercel ingress IP is passed to the existing rate-limit RPC; configure a cleanup schedule or check existing retention in the production database before enabling public traffic. Rate limits apply to shared platform egress as well as individuals; review 429 rates before increasing limits. Connector diagnostic logs contain channel, tool, outcome and elapsed time.

## Optional OAuth account linking

The public release can use no authentication. The optional optimize_card_portfolio tool is disabled until a vetted OAuth authorization server and linked-account mapping exist. It requires explicit per-call consent, a fresh active grant, the exact MCP resource audience, a trusted issuer, the credit iq wallet product scope (creditiq:wallet:products), and a subject mapped by the authorization server to the existing CreditIQ Auth user ID. It returns recognized card products and catalogue estimates without account numbers, statement data or balances. Each call introspects the grant so revocation fails closed.

Set CREDITIQ_MCP_PERSONAL_TOOLS=true only in a separately tested environment, alongside CREDITIQ_MCP_OAUTH_BASE_URL, CREDITIQ_MCP_OAUTH_ISSUER, CREDITIQ_MCP_OAUTH_INTROSPECTION_URL, CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_ID and CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_SECRET. The issuer and introspection endpoint must share an HTTPS origin. Configure each channel as its own resource audience. Publish RFC 8414 or OIDC discovery, use authorization code + PKCE S256, support the callback and registration/client identity policies for each marketplace, and make grant revocation immediate through introspection. Never mint this grant from caller-supplied identities. Document exact consent, link revocation and deletion paths for the broker you operate.

Do not enable the existing Supabase project's OAuth server as a shortcut. Supabase documentation states that its default OAuth token has ordinary user-session access and no custom scopes. A separate scoped issuer and verified account mapping are needed for this contract. See [Supabase OAuth flows](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows) and [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).

Statement parsing remains the first-party website feature. Do not enable a connector statement ingestion tool until data classifications, retention and platform restrictions are reviewed. Persistent card monitoring is pending a user-managed opt-in, verified event source and notification delivery controls. Existing travel watches track trips, not cards.

## Marketplace materials

- Display name: CreditIQ
- Short description: Compare Indian credit cards, estimate rewards, and check dated lounge and redemption benefits.
- Suggested discovery text: Use CreditIQ to research Indian credit card fees, cashback, airport lounges, foreign currency fees and card point redemption options. No account needed for public data.
- Category: compare financial products or personal finance, using the category nearest the current portal taxonomy.
- Icon: public/creditiq_logo_512.png, owned CreditIQ asset. Check the portal's requested format and current screenshots separately.
- Docs and privacy notice: https://www.creditiq.app/connectors
- Privacy: https://www.creditiq.app/privacy
- Terms: https://www.creditiq.app/terms
- Support: support@creditiq.app
- Examples: “What Indian cards should I compare for ₹50,000/month?”, “Compare HDFC Infinia and Axis Magnus for Burgundy”, “Find cards with recorded international lounge benefits”, “Estimate eligible cashback for ₹10,000 groceries, ₹5,000 dining and ₹5,000 travel”.

### Claude

Add the remote endpoint with No sign in. Test discovery and calls on a Claude account permitted to add remote connectors. Use the Claude directory submission portal with the HTTPS endpoint, icon, screenshots and policies. After approval the owner publishes the listing. Directory reports determine which listing metrics are available. See [Claude developer portal guide](https://claude.com/resources/articles/build-plugins-for-claude) and [directory policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).

### ChatGPT

Add the MCP server with No authentication in a permitted development workspace. Exercise the plugin's public tools and comparison/rewards UI. Verify domain ownership using the exact value from the portal as CREDITIQ_OPENAI_DOMAIN_CHALLENGE. Generate the portal ZIP with PowerShell using scripts/creditiq-mcp-package.ps1 and an output ZIP path. Follow the portal's developer verification, screenshots and publishing review flow. See [Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt), [Submission](https://developers.openai.com/plugins/deploy/submission) and [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). Availability depends on the host, region, plan, enabled capabilities and workspace policy. Verify with the intended India test accounts before promising access.

### Legal and disclosure check

The public tool returns research, not credit decisions or account access. The owner should review India applicability with counsel, especially card marketing/affiliate disclosures and the data notice, consent, withdrawal, deletion and retention requirements before operating the optional personal features. Relevant sources are the [RBI card issuance and conduct directions](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13155) and the [DPDP Rules notification](https://egazette.gov.in/WriteReadData/2025/267650.pdf). CreditIQ may earn commission on some website application links. No affiliate links are returned through MCP.

SlickTrip's directory listing illustrates a named remote connector with clear tools and a separate website handoff. Its public MIT repository is a configuration/distribution example for clients. CreditIQ uses the official MCP implementation with original code. SlickTrip's founder reported 24,000 signups in five weeks; that is self-reported and is not a forecast. [Listing](https://claude.com/marketplace/connectors/slicktrip) · [Repository](https://github.com/sliktrip/slicktrip-mcp) · [Founder post](https://www.reddit.com/r/mcp/comments/1xo0ftz/claude_brought_us_24000_users_in_5_weeks/)

## Verification and acquisition reporting

Run these against the chosen environment. For protected staging, use an approved access mechanism before running the client or client smoke tests.

    npm test
    npm run lint
    npx tsc --noEmit --incremental false
    npm run build
    npx tsx scripts/creditiq-mcp-smoke.ts http://localhost:3000/mcp/chatgpt
    npx tsx scripts/creditiq-mcp-smoke.ts http://localhost:3000/mcp/claude

Export sanitized connector event lines from Vercel Logs for one reporting period. Supply optional JSON aggregates for that same period from approved marketplace, website, sign-up, linking, billing and retention reports. The report generator rejects unknown keys and does not accept individual events or account IDs in the aggregate file.

    npx tsx scripts/creditiq-mcp-acquisition.ts connector-logs.txt acquisition.html approved-aggregates.json

Use channel keys claude, chatgpt and mcp. Supported values: discovery, referrals, registrations, linkedAccounts, consentingActiveUsers, paidConversions, retained7d, retained30d, retained90d, revenueInr and infrastructureCostInr. Omit an unavailable metric. A visitor opening a tagged link is not assumed to be an identifiable customer. Host directory totals and tool calls alone cannot establish retention or conversion. Account lifecycle attribution still requires an approved first-party opt-in and cohort data source; the report does not infer attribution.

Public traffic adds Vercel function usage and calls to the existing Supabase database. No new service plan is required by this design. Use actual aggregate CPU, memory, requests and attributable database costs in the report. As a sizing example, 10,000 calls plus 10,000 protocol requests at 20 ms active CPU and 250 ms instance time each, 2 GB in Mumbai, would be about US$0.06 of Vercel CPU and memory at listed unit prices, plus up to US$0.012 for invocations at the on-demand rate. Volume, regional pricing, connection overhead, logs, egress and database usage vary. [Vercel Functions pricing](https://vercel.com/docs/functions/usage-and-pricing)
