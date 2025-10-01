# ADR 001: Service Role vs Anonymous Key Usage Pattern

**Status**: Accepted
**Date**: 2025-01-08
**Deciders**: Development Team
**Related Commits**: `92a9f53`, `e6a0564`

---

## Context

Supabase provides two authentication modes for database access:

1. **Anonymous Key Client** - Respects Row Level Security (RLS) policies
2. **Service Role Key Client** - Bypasses RLS policies with superuser privileges

During development of the admin dashboard, we encountered multiple 403 Forbidden errors when admin users attempted to approve or reject track submissions. The root cause was using the anonymous key client for operations that required cross-user database modifications.

### Problem Examples

**Scenario 1: Admin Approval Failing**
```typescript
// ❌ WRONG - Using anonymous key for cross-user operation
const { error } = await supabase
  .from('submissions')
  .update({ status: 'approved' })
  .eq('id', submissionId)

// Returns 403 - RLS policy blocks modifying other users' submissions
```

**Scenario 2: Security Risk**
```typescript
// ❌ DANGEROUS - Using service role without admin verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Any user could call this endpoint and bypass RLS!
```

---

## Decision

We will follow a **two-step verification pattern** for admin operations:

1. **Step 1: Verify admin status** using anonymous key client
2. **Step 2: Execute privileged operation** using service role client

This pattern ensures:
- Regular users cannot bypass RLS policies
- Admin operations work correctly across user boundaries
- Security is maintained through explicit verification

---

## Implementation Pattern

### Complete Example from Production Code

```typescript
// File: src/app/api/submissions/[id]/route.ts

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api/submissions/[id]')

  try {
    // STEP 1: Verify authentication using anonymous key
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // STEP 2: Verify admin role using anonymous key (respects RLS)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      logger.warn('Non-admin attempted to update submission', {
        userId: session.user.id,
        submissionId: params.id
      })
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // STEP 3: Create service role client for privileged operation
    const { createClient } = require('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false  // Don't cache admin sessions
        }
      }
    )

    // STEP 4: Execute cross-user operation with service role
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({
        status: body.status,
        admin_notes: body.admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update submission', { error, id })
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      )
    }

    logger.info('Submission updated successfully', {
      id,
      newStatus: body.status,
      adminId: session.user.id
    })

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Submission update error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## When to Use Each Client

### Use Anonymous Key Client For:

- ✅ User viewing their own playlists
- ✅ User submitting tracks
- ✅ User modifying their own profile
- ✅ Any operation where RLS policies should apply
- ✅ **Verifying admin status** (Step 2 above)

### Use Service Role Client For:

- ✅ Admin approving/rejecting submissions (after verification)
- ✅ Admin viewing all users' data
- ✅ System-level operations (scheduled jobs, cleanup)
- ✅ Database migrations
- ✅ **Any cross-user operation after admin verification**

### Never Use Service Role For:

- ❌ Regular user operations
- ❌ Before verifying admin status
- ❌ Frontend/client-side code (security risk)
- ❌ Endpoints accessible to non-admin users

---

## Consequences

### Positive

1. **Security**: Admin privileges only granted after explicit verification
2. **RLS Integrity**: Regular operations still respect database policies
3. **Auditability**: All admin operations logged with user context
4. **Clarity**: Clear pattern to follow for future admin features

### Negative

1. **Code Duplication**: Two client instances in admin API routes
2. **Complexity**: Developers must remember verification pattern
3. **Performance**: Two database queries (verify admin, then perform operation)

### Mitigation

- **Documentation**: Pattern documented in CLAUDE.md
- **Code Review**: PR template includes admin operation checklist
- **Helper Function**: Consider creating `withAdminAuth()` wrapper

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/submissions/[id]/route.ts` | Admin approval implementation |
| `src/lib/supabase.ts` | Supabase client creation utilities |
| `CLAUDE.md` | Authentication patterns documentation |

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role vs Anonymous Key](https://supabase.com/docs/guides/api/api-keys)
- Commit `92a9f53`: Fix admin approval 403 error
- Commit `e6a0564`: Add defensive checks for undefined data

---

## Future Considerations

### Potential Helper Function

```typescript
// src/lib/auth-helpers.ts
export async function withAdminAuth(
  request: Request,
  handler: (supabaseAdmin: SupabaseClient, session: Session) => Promise<Response>
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  return handler(supabaseAdmin, session)
}

// Usage:
export async function PATCH(request: Request, { params }: Context) {
  return withAdminAuth(request, async (supabaseAdmin, session) => {
    // Admin-verified logic here
    const { data } = await supabaseAdmin
      .from('submissions')
      .update(...)

    return NextResponse.json(data)
  })
}
```

### Testing Recommendations

- Test admin operations with non-admin users (should fail with 403)
- Test admin operations with expired sessions (should fail with 401)
- Test that service role operations work for cross-user modifications
- Verify audit logs include admin user context
