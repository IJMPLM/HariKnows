# System Flowchart

## Textual Flow
1. Start.
2. User opens HariKnows.
3. System checks whether the user is signed in.
4. If the user is a guest, the system returns general FAQ and policy guidance only.
5. If the user is signed in, the system loads the student profile and request history.
6. The user may ask a registrar question, view account data, or manage a request.
7. The system validates the request against stored policy and database records.
8. If the user is a registrar staff member, the system allows student account management and CSV upload actions.
9. If the upload is an FAQ/context file, the system parses it by header structure and saves the entries.
10. If the upload is an ICTO account file, the system validates the headers and updates existing student credentials.
11. The system returns the result to the user.
12. End.

## Decision Branches
- Guest -> general guidance only.
- Signed in student -> account-aware help and request tracking.
- Registrar staff -> account updates and CSV administration.
- Invalid or incomplete data -> return an error and keep the existing record unchanged.
