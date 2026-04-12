# Trends and Issues of the Project

## Current Trends Reflected in HariKnows
HariKnows follows several current trends in campus service systems:

- AI-assisted helpdesk support for routine registrar questions.
- Self-service access for students through authenticated dashboards.
- Database-backed request tracking instead of manual paper logs.
- CSV-driven administrative updates for bulk registrar data handling.
- Role-aware responses that distinguish guests, signed-in students, and staff.
- Privacy-oriented handling of sensitive student records.

## Issues Addressed by the System
The project exists because of recurring registrar pain points:

- Students need faster answers for document requirements and request status.
- Registrar staff need a single place to track requests and account data.
- Manual updates are error-prone when student records are spread across files.
- Guest users need general guidance without exposing private information.
- CSV uploads need validation because malformed rows can break data quality.
- Password and account updates need to be tied to existing student records.

## Observed System Challenges
Based on the current codebase and project history, these issues remain important:

- Some workflows still require on-site validation and cannot be fully automated.
- FAQ and context data must stay aligned with policy changes.
- Student master records must remain the source of truth for account updates.
- The system must avoid revealing grades, other students' records, or credential details.
- Bulk imports must support inconsistent real-world CSV formats while still rejecting bad rows.
