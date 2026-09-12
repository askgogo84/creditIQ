---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
---

# Codebase Design

Design deep modules: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Use these principles wherever code is being designed or restructured.

## Core vocabulary
- Module: anything with an interface and an implementation.
- Interface: everything a caller must know to use the module correctly.
- Implementation: what's inside a module.
- Depth: leverage at the interface; a deep module provides a lot of behaviour behind a small interface.
- Seam: a place where behaviour can be altered without editing in that place.
- Adapter: a concrete thing that satisfies an interface at a seam.
- Leverage: capability callers receive per unit of interface they learn.
- Locality: change, bugs, knowledge and verification stay concentrated.

## Principles
- Prefer deep modules over shallow pass-through layers.
- The interface is the test surface.
- Accept dependencies rather than creating them internally.
- Return results rather than hiding important behaviour in side effects.
- Reduce interface surface area where possible.
- Apply the deletion test: if deleting a module spreads complexity across callers, the module is earning its keep.
- One adapter means a hypothetical seam; two adapters means a real one.

## Design it twice
When an interface or UI architecture is important, generate multiple substantially different designs before choosing one. Compare them on depth, locality, seam placement, default-case simplicity and testability. Do not layer all ideas together; choose a coherent winner or deliberate hybrid.

Source: mattpocock/skills, MIT license. Vendored for CreditIQ engineering workflow.
