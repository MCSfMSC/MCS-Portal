---
name: mcs-one-pager-editor
description: Rewrite MCS one-pagers into concise executive briefs. Use when improving service-review docs, update summaries, or meeting-prep pages.
user-invocable: true
metadata:
  origin: deanpeters/Product-Manager-Skills inspired
  artifact-type: component
  focus: one-pager
---

## Purpose

Use this skill when a document should read like a one-page brief for leadership,
service reviews, escalation prep, or customer meeting preparation. The output
should be scannable, concrete, and action-oriented.

## Key Concepts

- Audience first: write for a reader who needs the point quickly, not a reader
  who wants every implementation detail.
- Change before detail: lead with what changed and why it matters before
  describing how the page or system works.
- Service decision framing: emphasize customer risk, operational pressure,
  ownership, and next action.
- One-pager discipline: keep the main document tight; move diagrams, exhaustive
  source lists, and low-signal implementation detail out of the main flow.
- Traceable claims: use named signals already present in the workspace; do not
  invent metrics, owners, or outcomes.

Anti-patterns:

- Turning a one-pager into a design spec.
- Listing UI changes without explaining why a service team should care.
- Repeating the same idea across overview, summary, and conclusion.
- Mixing customer profile content with operational risk content.

## Application

1. Identify the document's real job.
   Usually it is one of these: executive update, service review brief,
   leadership readout, or customer meeting prep.

2. Extract the four facts that matter most.
   Capture:
   - What changed
   - Why it matters now
   - What signal or risk is newly visible
   - What action or decision becomes easier

3. Use a compact structure.
   Prefer this order:
   - Executive Summary
   - What Changed
   - Why It Matters
   - Before vs. After
   - Implementation Notes
   - Bottom Line

4. Compress aggressively.
   - Keep sections short.
   - Prefer bullets over long prose when comparing or summarizing.
   - Remove duplicate explanations.
   - Remove diagrams unless they are essential.

5. Keep language operational.
   Use phrases such as service posture, backlog pressure, onboarding readiness,
   ownership clarity, escalation risk, and next review motion when they are
   supported by the source material.

6. End with an executive takeaway.
   The final paragraph should tell the reader how to describe the update in one
   sentence and what improved because of it.

## Examples

Strong example:

- "The Know Me tab now works as a service decision page rather than a customer
  profile. It combines support pressure, Power BI insight, and onboarding
  readiness so teams can identify current risk and next Microsoft action from
  one place."

Weak example:

- "The page contains several new sections and some previous cards were removed
  or merged." 

Why weak: it describes layout activity without explaining business or service
value.

## Common Pitfalls

- Leaving implementation details in the lead paragraph.
- Using generic words like better, clearer, or improved without naming what is
  now faster, visible, or easier.
- Keeping appendix material in the main body.
- Writing for builders when the audience is reviewers.

## References

- deanpeters/Product-Manager-Skills: `skills/prd-development/SKILL.md`
- deanpeters/Product-Manager-Skills: `skills/problem-statement/SKILL.md`
- Existing workspace guidance: `.github/instructions/security360-knowme.instructions.md`