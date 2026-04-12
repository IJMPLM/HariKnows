# User Manual

## 1. Overview
HariKnows is the registrar helpdesk and tracking platform for students and registrar staff. It provides public registrar guidance, signed-in student account access, request tracking, and staff-side account and CSV management.

This manual is written for direct use inside the repository and is safe to print or export as PDF from a markdown preview.

## 2. User Roles

### Guest User
Guests can ask general registrar questions and read published guidance. Guest access does not include account-specific records, request history, or credential actions.

### Signed-in Student
Signed-in students can view their profile, check their request history, and change their own password. They can also ask account-aware questions tied to verified student data.

### Registrar Staff
Registrar staff can search student accounts, overwrite credentials for an existing student number, import ICTO CSV account files, and maintain FAQ/context entries for the helpdesk.

## 3. Getting Started

### For Guests
1. Open HariKnows in the browser.
2. Use the chatbot for general registrar questions.
3. Read public FAQs and policy guidance.
4. Sign in if you need request tracking or account-specific information.

### For Signed-in Students
1. Sign in using your official student email and password.
2. Open the dashboard to view your profile.
3. Review your request history and request status updates.
4. Open the account page to change your password.
5. Ask the assistant about documents, graduation, and office routing.

### For Registrar Staff
1. Open the registrar admin interface.
2. Search for the student number you want to update.
3. Overwrite the email and password only for an existing student number.
4. Upload an ICTO CSV file for batch credential updates.
5. Upload FAQ/context CSV files when registrar guidance changes.
6. Review the live account list and request tables for validation.

## 4. Student Account Features

### View Account Details
The student account page displays the current profile details that are stored in the database, including student number, name, email, college, and program.

### Change Password
1. Open the account page.
2. Enter your current password.
3. Enter a new password.
4. Confirm the new password.
5. Submit the change.

If the current password is incorrect, the update will be rejected. If the new password does not meet the minimum length rule, the system will also reject the change.

## 5. Registrar Account Management

### Search Student Accounts
Use the registrar student account page to search by student number, name, email, or program. The list is loaded from the live database instead of sample data.

### Overwrite Credentials
1. Search for the student number.
2. Open the create or overwrite account dialog.
3. Enter the updated email and password.
4. Save the changes.

This action updates only an existing student record. It does not create a new student masterlist entry. If the student number does not exist, the system returns an error.

### Import ICTO CSV Files
1. Open the upload dialog.
2. Choose an ICTO CSV file.
3. Upload the file.
4. Review the import summary.

The import accepts account credential rows for existing students. Rows with missing student numbers, missing headers, or malformed data are rejected.

## 6. Document Request Tracking
The request lifecycle is:

1. Pending
2. Prepared
3. Claimed
4. Disposed

Students can monitor their own request history from the dashboard. Official document requests still require on-site registrar processing.

## 7. CSV Upload Guidance

### FAQ and Context Files
- Use CSV files only.
- Include header columns such as scopeType, category, title, and answer or context.
- The parser uses the header row as the main reference for import structure.

### ICTO Account Files
- Use CSV files only.
- Include student number, email, and password columns.
- The upload updates only existing student numbers.
- Missing student numbers are reported as errors instead of creating new student rows.

## 8. Troubleshooting
- If you cannot sign in, verify the email and password on the account.
- If a password change fails, confirm the current password and the new password length.
- If a document request is missing, confirm that the student number exists in the database.
- If a CSV row fails, review the header names and required fields.
- If you are a guest, account-specific information will not be available until you sign in.

## 9. Print and PDF Export
This document is intended to be printable from the markdown preview or browser print dialog. If you export it as PDF, the headings and lists should preserve the manual structure clearly.
