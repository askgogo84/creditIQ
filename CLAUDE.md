# CreditIQ Security Rules

- Never log user email, card data, or spend amounts at any level
- All Supabase queries must use RLS — never use service role key in client-side code
- API routes must validate input with Zod before processing
- Never hardcode ANTHROPIC_API_KEY, SUPABASE_ANON_KEY, or any sk_ prefixed string
- Affiliate redirect URLs must be validated before redirect
- Never expose raw user IDs in client-facing URLs
