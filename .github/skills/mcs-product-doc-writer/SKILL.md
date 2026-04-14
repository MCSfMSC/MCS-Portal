---
name: mcs-product-doc-writer
description: Draft structured MCS product docs with problem-first framing. Use when writing or revising PRD-style docs, briefs, and review artifacts.
user-invocable: true
metadata:
  origin: deanpeters/Product-Manager-Skills inspired
  artifact-type: workflow
  focus: product-docs
---

## Purpose

Use this skill when a markdown document needs to connect problem, context,
solution direction, expected impact, and next action without turning into a
loose note dump.

## Key Concepts

- Problem first: define the service or customer problem before describing the
  solution.
- Audience-aware depth: one-pagers stay compact; PRD-style docs can go deeper.
- Structured outputs: every document should make scope, value, and ownership
  legible.
- Action bias: if the document does not help a review, decision, or handoff,
  cut or demote the content.

## Application

1. Determine the artifact type.
   - One-pager: executive or review summary
   - Working brief: deeper internal framing
   - PRD-style doc: engineering or design handoff

2. Start with the problem and context.
   Name:
   - Who is affected
   - What is happening now
   - Why it matters to MCS or the customer
   - What friction, risk, or ownership gap exists

3. Choose a document shape.
   - One-pager: 5-7 short sections
   - Working brief: summary, problem, changes, impact, risks, next steps
   - PRD-style: summary, problem, users, scope, solution, metrics, risks,
     open questions

4. Tighten language.
   Replace vague claims with explicit effects such as faster prep, earlier risk
   visibility, clearer ownership, or reduced tool switching.

5. End with next action.
   Every document should end by clarifying what Microsoft needs to review,
   decide, or do next.

## Examples

Good prompt:

- "Rewrite this customer-view doc as an executive one-pager for leadership
  review. Keep only delivery-relevant context and make the value of the portal
  update explicit."

Bad prompt:

- "Make this document better."

Why bad: the artifact type, audience, and success criteria are all missing.

## Common Pitfalls

- Starting from sections instead of purpose.
- Preserving every original bullet even when the document is too long.
- Blending meeting brief content with implementation design detail.
- Ending with summary only and no next move.

## References

- deanpeters/Product-Manager-Skills: `skills/prd-development/SKILL.md`
- deanpeters/Product-Manager-Skills: `skills/problem-statement/SKILL.md`
- deanpeters/Product-Manager-Skills: `skills/positioning-statement/SKILL.md`
- deanpeters/Product-Manager-Skills: `skills/context-engineering-advisor/SKILL.md`