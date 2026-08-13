-- 007_statement_self_entered.sql
-- A statement-imported card is "Verified" (green — the moat) ONLY while its points
-- balance is the one we read from the statement. The moment a user hand-edits that
-- balance, the number is no longer statement-truth and the badge must demote to
-- "Self-entered". Before this column, provenance was inferred from the TABLE alone
-- (statement_imports => verified), so a hand-edited verified card would keep green
-- next to a typed number.
--
-- We add a flag rather than moving the row to manual_cards because statement_imports
-- carries statement_date and points_expiry, which feed the expiry + devaluation
-- warnings; moving the row would silently drop both.
--
-- Read model (wired in a later commit): verified = (source is statement) AND NOT self_entered.
-- Default false => every existing statement card stays Verified until first hand-edit.

ALTER TABLE public.statement_imports
  ADD COLUMN IF NOT EXISTS self_entered boolean NOT NULL DEFAULT false;
