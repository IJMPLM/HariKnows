# ERD

This ERD is written textually and reflects the actual database-backed structure used by the backend.

## Core Academic and Account Entities

### StudentMaster
Primary key: Id
Important fields: StudentNo, FirstName, MiddleName, LastName, FullName, CollegeCode, ProgramCode, CurrentYear, Block, EnrollmentStatus, BirthCertStatus, Form137Status, GoodMoralStatus, NstpStatus, TocStatus, Email, PasswordHash, DateCreated, DateUpdated

### College
Primary key: Id
Important fields: Name

### AcademicProgram
Primary key: Id
Important fields: Name, Code, Group, CollegeId

### Department
Primary key: Id
Important fields: Name

### Document
Primary key: Id
Important fields: ReferenceCode, StudentName, Title, DepartmentId, CreatedAt, UpdatedAt

### StudentDocumentRequest
Primary key: Id
Important fields: RequestCode, StudentNo, StudentName, DocumentType, DepartmentId, Status, RequestedAt, PreparedAt, ClaimedAt, DisposedAt, DisposedReason, HandledBy, Notes, UpdatedAt

### ActivityLog
Primary key: Id
Important fields: Action, Actor, CreatedAt

## Knowledge Base and Helpdesk Entities

### FaqContextEntry
Primary key: Id
Important fields: ScopeType, CollegeCode, ProgramCode, Category, Question, Answer, AvailabilityCriteria, EligibilityRules, PricingDetails, Requirements, Caveats, EscalationGuidance, CitationUrl, TagsCsv, IsPublished, CreatedAt, UpdatedAt

### GeminiChat
Primary key: Id
Important fields: Role, Content, CreatedAt, ConversationId

### ChatMessage
Primary key: Id
Important fields: Sender, Content, CreatedAt

## Academic Support Entities

### CurriculumCourse
Primary key: Id
Important fields: CollegeCode, ProgramCode, Level, Term, Code, Units, Title, DateCreated, DateUpdated

### GradeRecord
Primary key: Id
Important fields: CollegeCode, ProgramCode, CourseCode, StudentNo, Grade, DateCreated, DateUpdated

### SyllabusEntry
Primary key: Id
Important fields: CollegeCode, ProgramCode, Code, Title, Description, DateCreated, DateUpdated

## ETL and Import Entities

### EtlUploadBatch
Primary key: Id
Important fields: BatchId, CreatedAt, Status

### EtlUploadFile
Primary key: Id
Important fields: BatchId, FileName, Category, CollegeCode, ProgramCode, ParsedRows, Status, ScopeKey, IsActive, IsIncomplete, Error, ParsedAt

### EtlStagingRow
Primary key: Id
Important fields: BatchId, Category, FileName, SourceRowNumber, StudentNo, PayloadJson, Status, ConflictNote, Error

## Relationships
- College 1 -> many AcademicProgram.
- Department 1 -> many Document.
- Department 1 -> many StudentDocumentRequest.
- StudentMaster 1 -> many StudentDocumentRequest through StudentNo matching in request data.
- StudentMaster 1 -> many GradeRecord through StudentNo matching in grade data.
- College and AcademicProgram are logical parents of StudentMaster, CurriculumCourse, GradeRecord, and SyllabusEntry through code fields.
- FaqContextEntry is logically filtered by ScopeType, CollegeCode, and ProgramCode rather than foreign keys.
- GeminiChat and ChatMessage store conversation data independently of registrar accounts.
- EtlUploadBatch 1 -> many EtlUploadFile.
- EtlUploadBatch 1 -> many EtlStagingRow.
- EtlUploadFile and EtlStagingRow are linked by BatchId and FileName.
- EtlStagingRow 1 -> one imported payload instance, which may commit into StudentMaster, CurriculumCourse, GradeRecord, SyllabusEntry, or FaqContextEntry depending on category.

## Data Integrity Notes
- StudentNo is unique in StudentMaster.
- PasswordHash is stored only in StudentMaster and never returned to the client.
- FAQ/context entries use scope and program filters to control visibility.
- ETL staging preserves source row numbers and conflict notes for auditability.
- Chat data is separate from student request data and registrar records.
