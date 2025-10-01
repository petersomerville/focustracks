# Database Migrations Archive

This directory contains historical database migration scripts that were used during the development and setup of FocusTracks. These are one-time scripts that have already been executed in production.

## Archive Organization

All archived migrations are stored in the `archive/` subdirectory with ISO date prefixes (`YYYY-MM-DD-`) for chronological ordering.

---

## Migration History

### 2024-09-28: Initial Data Setup

#### `2024-09-28-update-tracks.sql`
**Purpose**: Initial track data updates
- Updated existing track records
- One-time data correction script
- **Status**: Executed, archived

---

### 2024-09-29: Data Quality & Orphaned Records

#### `2024-09-29-fix-youtube-urls.sql`
**Purpose**: Fixed malformed YouTube URLs in track records
- Corrected URL formats to match YouTube URL schema validation
- Ensured all tracks have valid, playable YouTube links
- **Status**: Executed, archived

#### `2024-09-29-find-orphaned-submissions.sql`
**Purpose**: Diagnostic query to identify orphaned submission records
- Found submissions without associated user profiles
- Identified data integrity issues from initial development
- **Type**: Query script (read-only)
- **Status**: Executed, archived

#### `2024-09-29-publish-orphaned-submissions.sql`
**Purpose**: Fixed orphaned submission records
- Corrected foreign key relationships
- Ensured all submissions link to valid user profiles
- **Status**: Executed, archived

---

### 2024-09-30: RLS Policies & User Profiles

#### `2024-09-30-setup-user-profiles-table.sql`
**Purpose**: Created `user_profiles` table for role-based access control
- Added `role` column (user/admin)
- Established user profile structure
- **Related**: ADR 001 - Service Role Pattern
- **Status**: Executed, schema now in production

#### `2024-09-30-setup-playlists-rls.sql`
**Purpose**: Implemented Row Level Security for playlists
- Users can only view/modify their own playlists
- Admins can view all playlists
- **Policy**: `playlist_user_policy` - SELECT/UPDATE/DELETE own playlists
- **Policy**: `playlist_insert_policy` - INSERT own playlists
- **Status**: Executed, policies active in production

#### `2024-09-30-fix-user-profiles-rls.sql`
**Purpose**: Fixed RLS policies on user_profiles table
- Corrected permission issues blocking legitimate access
- Adjusted policies to allow users to read their own profiles
- **Status**: Executed, archived

#### `2024-09-30-setup-track-submissions-rls.sql`
**Purpose**: Implemented Row Level Security for track submissions
- Users can view their own submissions
- Admins can view/modify all submissions (via service role)
- **Policy**: `submission_select_policy` - SELECT own submissions
- **Policy**: `submission_insert_policy` - INSERT own submissions
- **Related**: Admin approval workflow requires service role client (ADR 001)
- **Status**: Executed, policies active in production

---

## Important Notes

### Do NOT Re-run Archived Scripts

These scripts have already been executed in production. Re-running them may cause:
- Duplicate data
- Constraint violations
- Data corruption
- RLS policy conflicts

### Future Migrations

For new database changes:
1. **Development**: Test migration locally against Supabase development instance
2. **Documentation**: Create new migration file in `archive/` with current date
3. **Execution**: Run migration in production Supabase dashboard
4. **Verification**: Verify changes with read-only queries
5. **Archive**: Document results in this README

### Related Documentation

- **ADR 001**: Service Role vs Anonymous Key Usage Pattern
- **CLAUDE.md**: Authentication patterns and RLS guidelines
- **Supabase Dashboard**: https://supabase.com/dashboard (for manual migrations)

---

## Quick Reference: Current Database Schema

### Tables
- `tracks` - Focus music tracks (public read access)
- `playlists` - User-created playlists (RLS: own playlists only)
- `playlist_tracks` - Many-to-many relationship (RLS: follows playlist policy)
- `submissions` - Track submissions pending review (RLS: own submissions, admin sees all)
- `user_profiles` - User role and metadata (RLS: own profile, admin sees all)

### RLS Policies Summary
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tracks | Public | None | None | None |
| playlists | Own + Admin | Own | Own | Own |
| submissions | Own + Admin | Own | Admin (service role) | Admin (service role) |
| user_profiles | Own + Admin | Automatic (trigger) | Own | None |

---

## Troubleshooting

### "Permission denied" errors
- Check if RLS policies are correctly configured
- Verify user authentication (session token valid)
- For admin operations, ensure service role client is used (see ADR 001)

### "Row not found" errors
- Check if RLS policy is blocking access
- Verify user_id matches authenticated user
- For cross-user queries, use service role client

### Migration conflicts
- Do NOT modify archived migrations
- Create new migration script with current date
- Document changes in this README
