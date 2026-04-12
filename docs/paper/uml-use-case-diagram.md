# UML / Use Case Diagram

This document is textual and describes the use cases that would normally appear in a UML use case diagram.

## Actors
- Guest User
- Signed-in Student
- Registrar Staff
- System Administrator

## Use Cases
### Guest User
- Ask general registrar questions.
- Read published FAQs and policies.
- View non-account-specific guidance.

### Signed-in Student
- Sign in.
- View own profile.
- Check own request history.
- Change password.
- Ask account-aware registrar questions.

### Registrar Staff
- Search student accounts.
- Overwrite student email and password for an existing student number.
- Upload ICTO CSV account files.
- Manage FAQ and context entries.
- Review request status data.

### System Administrator
- Maintain registrar defaults.
- Review application data and system records.
- Support database maintenance and cleanup tasks.

## Textual Relationships
- Sign in -> enables profile access and request tracking.
- Change password -> requires a signed-in student session.
- Upload ICTO CSV -> requires registrar staff privileges.
- Search student accounts -> may be used before updating credentials.
- FAQ/context management -> supports helpdesk responses.
