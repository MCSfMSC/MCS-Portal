# Know Me Tab Update One-Pager

## Executive Summary

The Know Me tab has been redesigned from a customer profile page into a service decision page.

The update brings together customer context, support pressure, Power BI insight, and onboarding readiness so a user can understand current risk, why it matters, and what Microsoft should do next without switching across CRM, Power BI, ADO, and support reports.

## What Changed

### 1. Power BI Insights now sit inside Know Me

The page now surfaces customer-specific Power BI insight directly in the main flow, including:

- Active-case pattern
- Backlog age mix
- Product concentration
- Status bottlenecks
- Trend highlights

This shifts the page from static summary to current operational signal.

### 2. Onboarding status and ADO signals are now visible

The page now shows a derived onboarding status based on participant stage, participant status, and onboard date, alongside Shalini-related ADO onboarding signals.

This makes pre-onboarding and early-run-state risk visible before it turns into a support problem.

### 3. The layout was simplified for review flow

Low-value or repeated profile-style content was removed or merged so the page reads more like a review brief.

Key changes:

- Removed View Intent, Scope Boundaries, Special Operating Model, Partner / Dependency, and the Core Principle footer block
- Renamed Power BI Semantic Model Insights to Power BI Insights
- Merged Customer Improvement Plan and Current Product Owner Motion into Recovery Plan and Ownership

## Why It Matters

Before this update, users still had to assemble the customer story themselves across multiple tools.

After this update, the page does more synthesis directly in the UI. That improves:

- Executive readability
- Review and meeting-prep speed
- Visibility into onboarding readiness
- Clarity of ownership and next move
- Separation between support execution issues and product-gap issues

## Before vs. After

| Area | Before | After |
| --- | --- | --- |
| Page role | Customer context page | Service decision page |
| Power BI data | Separate analysis outside the page | Embedded as Power BI Insights |
| Onboarding context | Spread across CRM and ADO | Visible in Know Me as status plus ADO signals |
| Next-step guidance | Split across multiple cards | Consolidated into clearer risk and recovery sections |
| Readability | More profile-oriented | More action-oriented and review-ready |

## Key Implementation Notes

- EY semantic-model insights were added into the support insight layer and rendered directly in Know Me
- A front-end binding issue in the Know Me update flow was fixed so support insights render correctly for the selected customer
- ADO MCP was added and validated, but the page currently uses embedded onboarding signals rather than a live browser-side call
- Onboarding status is still rule-based and derived from CRM-style customer fields already present in local data

## Bottom Line

Know Me is no longer just a place to look up customer information.

It now works much more like a single-page service brief: one view that combines customer context, support pressure, backlog shape, onboarding readiness, and next-action framing.

That is the right operating model for leadership reviews, support escalations, and customer-facing preparation.