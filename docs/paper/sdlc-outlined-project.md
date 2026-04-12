# SDLC Outlined Project

This section describes how the current HariKnows system reflects an Agile SDLC cycle.

## Plan
- Defined the registrar helpdesk problem, access tiers, and privacy boundaries.
- Established the need for FAQ/context management, request tracking, and student account support.
- Identified data sources such as student masterlists, CSV files, and registrar policy context.

## Design
- Structured the backend around authentication, registrar services, ETL ingestion, and chatbot support.
- Separated helpdesk and registrar frontends into focused interfaces.
- Defined role-aware flows for guests, signed-in students, and registrar staff.
- Established the knowledge-base format used by FAQ and context CSV files.

## Develop
- Built the auth, registrar, and helpdesk services in the backend.
- Added student request tracking, FAQ/context CRUD, and document management.
- Implemented frontend dashboards, account pages, and registrar admin screens.
- Added CSV upload pipelines and student account management workflows.

## Test
- Validated login and session behavior.
- Verified request tracking, FAQ/context import, and CSV parsing.
- Checked role-based access so guests cannot see private data.
- Confirmed registrar account changes update existing student records.

## Deploy
- The system is organized as a local full-stack application with a .NET backend and two Next.js frontends.
- Database initialization and seed data are handled at startup.
- The app is ready to be deployed in a controlled university environment.

## Review
- Refine the FAQ/context base as registrar policies evolve.
- Improve account and CSV validation rules as real data needs change.
- Continue iterating on UI clarity and office workflow alignment.

## Components Reflected in Each Phase
- Plan: scope, access tiers, and privacy model.
- Design: services, entities, and frontend layout.
- Develop: auth, helpdesk, registrar admin, ETL, and chatbot integration.
- Test: session handling, CSV parsing, request tracking, and role restrictions.
- Deploy: database startup and environment setup.
- Review: policy updates, usability improvements, and future integration points.
