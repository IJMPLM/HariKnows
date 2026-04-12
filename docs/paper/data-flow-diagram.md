# Data Flow Diagram

## Level 0 Textual DFD
### External Entities
- Guest User
- Signed-in Student
- Registrar Staff
- Auth Service
- Database

### Main Process
- HariKnows Helpdesk and Registrar Platform

### Data Flows
- Guest User -> platform: general questions and FAQ queries.
- Signed-in Student -> platform: login, profile lookup, request monitoring, and password change.
- Registrar Staff -> platform: CSV uploads, account updates, and FAQ/context management.
- Platform -> Auth Service: credential verification and token handling.
- Platform -> Database: student records, FAQ/context entries, request logs, and account updates.
- Database -> Platform: verified profile data, request status, and knowledge-base content.

## Level 1 Textual Breakdown
### 1. Authentication and Session Flow
- Credentials are validated.
- A session token is issued if authentication succeeds.
- The profile is retrieved from the student master record.

### 2. Helpdesk and Request Flow
- The system reads request history and policy data.
- The assistant returns the correct registrar guidance.
- Status output is based on stored request states.

### 3. Registrar Account Flow
- Staff submit a student number, email, and password.
- The system checks whether the student number exists.
- Existing records are updated; missing student numbers return an error.

### 4. CSV Ingestion Flow
- The system reads the CSV header row.
- Header structure determines the import path.
- Valid rows are imported; invalid rows are rejected with an explanation.
