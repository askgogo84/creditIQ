---
name: tdd
description: Test-driven development. Use for features and bug fixes through behavior-first red-green vertical slices.
---

# Test-Driven Development

Use red → green vertical slices. Tests verify behavior through public interfaces, not implementation details.

## Rules
- Write the failing behavioral test first.
- One seam, one test, one minimal implementation per cycle.
- Expected values must come from an independent source of truth.
- Avoid implementation-coupled mocks and private-method tests.
- Avoid horizontal slicing where all tests are written before implementation.
- Prefer user-visible behavior and stable interfaces.
- Refactor only after the behavior is green.

For CreditIQ UI work, the primary seam is the rendered user experience at mobile viewport sizes plus deterministic component behavior. Every UI correction should have a regression check for layout/state propagation when practical.

Source: mattpocock/skills, MIT license. Vendored for CreditIQ engineering workflow.
