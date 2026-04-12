# Conceptual Framework

## Input-Process-Output Model
HariKnows can be described using a simple input-process-output structure.

### Inputs
- Student login credentials and session state.
- Student masterlist records.
- Registrar FAQ and context entries.
- Document request records and status history.
- ICTO CSV account files.
- Registrar document and curriculum data.

### Process
- Authenticate the user and determine access level.
- Retrieve the correct registrar context for the user role.
- Validate request and account data against the student record.
- Parse and import CSV uploads using header-based rules.
- Update account, request, and knowledge-base records in the database.

### Outputs
- General registrar guidance for guests.
- Account-aware responses for signed-in students.
- Request tracking information and account summaries.
- Updated student credentials for existing student numbers.
- Structured, validated registrar data available to staff.

## Conceptual Relationship
The system connects verified data sources to a controlled helpdesk interface. Inputs become trusted outputs only after authentication, validation, and policy checks.
