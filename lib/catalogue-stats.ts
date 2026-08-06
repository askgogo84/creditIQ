import { SEED_CARDS } from '@/lib/data/seed-cards'

// ONE source of truth for catalogue-size copy across the app. Every user-facing
// "N cards" / "N banks" claim reads from here, COMPUTED from the canonical SEED_CARDS
// array — so adding or removing a card updates every surface and the numbers can never
// drift again. (They had drifted to 100+ / 170+ / 93 / 17-banks / 24-banks, all traced
// to a never-wired 49->93 expansion at lib/data/seed-cards.ts.)
//
// Consumers import CARD_COUNT / BANK_COUNT — never SEED_CARDS directly — so this file
// is the single place the derivation lives.
//
// BUNDLE NOTE: because these are computed at runtime, importing them pulls SEED_CARDS
// into the importer's module graph. Server consumers (metadata, OG, Footer, best-cards,
// banks) get it free at build time. CLIENT consumers (Header, the marketing sections,
// /premium) ship SEED_CARDS in their client bundle. If that cost isn't worth it, replace
// the two lines below with test-guarded literals — the exported API is identical, so no
// consumer changes.
export const CARD_COUNT = SEED_CARDS.length
export const BANK_COUNT = new Set(SEED_CARDS.map(c => c.bank)).size
