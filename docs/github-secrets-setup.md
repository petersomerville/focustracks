# GitHub Secrets Setup Guide

This document explains how to configure GitHub repository secrets required for the CI/CD pipeline.

## Required Secrets

The CI/CD workflow requires the following secrets to be configured in your GitHub repository:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Format**: `https://[project-id].supabase.co`
- **Source**: Found in your Supabase project settings under "API" > "Project URL"

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Your Supabase anonymous/public API key
- **Format**: Long JWT token string starting with `eyJ...`
- **Source**: Found in your Supabase project settings under "API" > "Project API keys" > "anon public"
- **Security**: Safe to expose to client-side code (has RLS restrictions)

### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Your Supabase service role key (admin privileges)
- **Format**: Long JWT token string starting with `eyJ...`
- **Source**: Found in your Supabase project settings under "API" > "Project API keys" > "service_role"
- **Security**: ⚠️ **CRITICAL** - Never expose this key in client-side code. Only use server-side.

## How to Add Secrets to GitHub

1. Navigate to your GitHub repository
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret:
   - **Name**: Enter the exact secret name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Paste the corresponding value from your Supabase project
   - Click **Add secret**
6. Repeat for all three secrets

## Verifying Setup

After adding all secrets:

1. Push a commit to trigger the CI/CD workflow
2. Go to the **Actions** tab in your repository
3. Check that the workflow runs successfully without environment variable errors

## Troubleshooting

### Build fails with "Your project's URL and API key are required"
- Ensure all three secrets are added with exact names (case-sensitive)
- Verify secret values are correct (copy-paste from Supabase without extra whitespace)
- Check that the secrets are available to the workflow (not restricted to specific branches)

### Tests pass but build fails
- This is expected if secrets are missing - the build step needs Supabase credentials
- Add the secrets following the steps above

## Security Best Practices

- **Never commit** `.env` files containing these values
- **Never log** the service role key in CI/CD output
- **Rotate keys** if they are accidentally exposed
- **Use RLS policies** to restrict what the anonymous key can access
- **Only use service role** for admin operations that bypass RLS

## Related Documentation

- [ADR 001: Service Role Pattern](./ADRs/001-service-role-pattern.md)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Documentation](https://supabase.com/docs/guides/api)
