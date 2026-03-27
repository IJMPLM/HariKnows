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