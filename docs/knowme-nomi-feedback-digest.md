# Know Me / NOMI Feedback Digest

This document consolidates recent feedback from Microsoft 365 sources related to Know Me / NOMI, including Teams chats, meeting transcripts, Outlook-connected discussions, and shared files.

## Scope

- Time window: last ~180 days
- Sources: Teams chats, Teams meeting transcripts, Outlook-related messages and meeting artifacts, shared files
- Focus: Know Me, NOMI, customer view, CRM, onboarding usefulness, service usefulness, and required changes

## What Needs To Change

### 1. Define minimum viable Know Me

Observed issue:

- Teams continue to debate whether Know Me is complete enough for onboarding, routing, or service cutover.
- Some customers are being treated as complete even when core customer context is still missing.

Requested change:

- Define a minimum viable Know Me standard.
- Make clear which fields are required before cutover and which can evolve later.

Why it matters:

- Service quality is at risk when teams receive customers without enough context.

### 2. Improve data completeness and quality

Observed issue:

- Stakeholders called out that only a fraction of collected customer information is visible in NOMI.
- Content quality and freshness vary by customer.

Requested change:

- Improve data fidelity.
- Ensure the visible customer summary reflects the actual information collected.
- Introduce a better sign-off model for completeness.

Why it matters:

- Low-fidelity customer summaries reduce trust and limit usefulness for support and delivery teams.

### 3. Reduce manual effort

Observed issue:

- Filling Know Me manually, especially in SharePoint-style flows, is seen as too time-consuming.

Requested change:

- Auto-fill Know Me from CRM and prior onboarding artifacts.
- Use AI assistance where possible, with human review instead of full manual authoring.

Why it matters:

- Manual maintenance is a direct adoption blocker.

### 4. Move away from fragmented tooling

Observed issue:

- Know Me information is split across SharePoint, CRM, Power BI, and downstream tools.
- People struggle with where the canonical version lives.

Requested change:

- Use CRM as the system of record.
- Use Power BI or portal views as the consumption layer.
- Reduce dependence on SharePoint for primary customer context.

Why it matters:

- Fragmentation makes the experience harder to maintain and harder to trust.

### 5. Make the view useful for service, not just documentation

Observed issue:

- Several comments imply that Know Me is often treated as documentation, not as something that improves service execution.

Requested change:

- Make the customer view useful for support readiness, cutover quality, escalation handling, and backup coverage.
- Show what matters operationally, not just descriptive context.

Why it matters:

- Stakeholders care about whether the tool helps teams deliver better service, not whether it stores more text.

### 6. Improve customer-centric presentation

Observed issue:

- Report- and source-centric layouts make it harder to find what matters.

Requested change:

- Organize views around customer scenarios such as onboarding, issue resolution, customer experience, and service health.
- Prefer customer-centric summaries over raw report navigation.

Why it matters:

- People need a page that helps them prepare for customer reviews and service conversations.

### 7. Resolve CRM and integration limitations

Observed issue:

- CRM field and data-shape limitations are affecting Know Me fidelity.
- API integration planning is blocked when formats and ownership are unclear.

Requested change:

- Fix CRM content limits and structure issues.
- Define the Know Me data format clearly enough for downstream API use.

Why it matters:

- Integration into tools like DFM / CaseBuddy depends on stable structure.

### 8. Fix access and discoverability gaps

Observed issue:

- Some users cannot open the Know Me document or cannot easily find the right view.

Requested change:

- Improve access control and central navigation.
- Integrate Know Me links into a unified portal rather than relying on scattered URLs.

Why it matters:

- Access friction directly reduces usage.

## Stakeholder Comments By Person

### Sherry Shao

- Asked for clearer requirements and scope around what Know Me should contain and what the experience should retrieve and show.
- Proposed reducing manual effort through AI-assisted auto-fill and review.
- Continued driving one-pagers and review materials for Know Me and portal alignment.

Type:

- Requests
- Design direction
- Next steps

### Shalini Hada

- Positioned NOMI as a living document rather than something that will be perfect on day one.
- Explicitly raised the need to define a minimum viable NOMI.
- Acknowledged that templates need to evolve based on onboarding learnings.
- Was asked to share clearer examples or asks so integration planning can move forward.

Type:

- Clarifications
- Open questions
- Next steps

### Dan Manrique

- Reinforced that service teams should have enough Know Me understanding before customer cutover.
- Linked Know Me readiness directly to service quality.
- Supported a more customer-centric view that improves delivery usefulness.

Type:

- Quality bar
- Concern
- Direction

### Lance Westby

- Acknowledged that Know Me is hard to standardize consistently.
- Supported a more centralized and easier-to-navigate experience.

Type:

- Concern
- Design direction

### Ankit Varshney

- Highlighted the need to use CRM capabilities more effectively.
- Asked for clarity on Know Me format and ownership so API integrations can be planned.
- Supported centralization and portal-style discovery over scattered links.

Type:

- Request
- Integration concern
- Design direction

### Cory Posada

- Said Know Me is valuable for backup and continuity when helping unfamiliar customers.
- Also raised concerns that it is not always ready when onboarding or routing decisions need to happen.
- Pointed out the manual effort of filling it out.
- Questioned whether all roles need the same level of access or detail.

Type:

- Positive signal
- Concern
- Open question

### Geordie McGarty

- Asked whether adoption problems are partly due to lack of awareness or education.
- Participated in decisions to keep some existing structural choices in the current layout.

Type:

- Open question
- Decision support

### Subha Sahoo

- Is associated with Power BI customer view / Know Me reporting.
- Supports making customer context visible through reporting and app structure improvements.

Type:

- Reporting owner
- Delivery support

### Marlene Shaup and related stakeholders

- Participated in discussions about improving customer sentiment and richer context beyond basic metrics.

Type:

- Direction
- Experience concern

## Main Themes Across Comments

### Theme 1. The current experience is not reliable enough

- People do not consistently trust that Know Me is complete or ready when needed.

### Theme 2. Know Me must improve service usefulness

- The strongest value case is not documentation quality.
- The strongest value case is helping teams deliver better support and better handoffs.

### Theme 3. CRM should anchor the model

- CRM is the preferred system of record.
- SharePoint should not remain the primary operational home.

### Theme 4. Automation is expected

- Stakeholders want less manual authoring and more structured, reusable customer context.

### Theme 5. Customer-centric views matter more than source-centric views

- Users want to see what matters for the customer and the service motion, not where the data came from.

## Recommended Follow-Up Questions

1. What is the minimum viable Know Me required before onboarding or routing is considered complete?
2. Which fields should live only in CRM, and which should be surfaced in the customer view?
3. Which roles need which depth of customer context?
4. What should be auto-filled versus manually reviewed?
5. How will service usefulness be measured after the new customer view is introduced?