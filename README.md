# HariKnows

1. npm run setup
2. setup ApiKey follow instructions below

    ## Local Development Secrets (.NET User Secrets)

    The backend reads `GeminiApi:ApiKey` from configuration. For local development, set it with .NET User Secrets.

    ### 1. Initialize and set secrets

    From the repository root:

    ```powershell / terminal
    cd backend/HariKnowsBackend
    dotnet user-secrets init
    dotnet user-secrets set "GeminiApi:ApiKey" "<YOUR_GEMINI_API_KEY - nickname ko sa gc>"
    ```

    ### 2. Verify stored secrets

    ```powershell
    dotnet user-secrets list
    ```

    You should see `GeminiApi:ApiKey` in the output.

3. npm run dev

## Registrar Catalog Defaults

The registrar colleges/programs/departments catalog is configured in a single backend object:

- `backend/HariKnowsBackend/registrar-defaults.json`

Backend startup loads this file and seeds missing data into SQLite (`Departments`, `Colleges`, `AcademicPrograms`) in an idempotent way.

### Registrar APIs

- `GET /api/registrar/state`
    : Returns departments, workflow documents, activity log, and catalog.
- `GET /api/registrar/catalog`
    : Returns catalog hierarchy (colleges + grouped programs + departments).
- `POST /api/registrar/departments`
    : Creates a department.
- `POST /api/registrar/documents`
    : Creates a registrar workflow document.
- `POST /api/registrar/documents/{documentId}/move`
    : Moves a document to another department.

If you need a clean reseed during development, remove `backend/HariKnowsBackend/hariknows.db` and run the backend again.