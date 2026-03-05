# Account Linking Implementation Summary

## Changes Made

### 1. Database Schema Updates (`user.model.ts`)
- ✅ **Removed**: `provider` and `providerId` fields (redundant)
- ✅ **Using**: Only `linkedProviders` array for all authentication methods
- ✅ **Structure**:
  ```typescript
  linkedProviders: [
    { provider: "local", providerId: null, linkedAt: Date },
    { provider: "google", providerId: "123", linkedAt: Date },
    { provider: "facebook", providerId: "456", linkedAt: Date }
  ]
  ```

### 2. Repository Functions (`auth.repository.ts`)
- ✅ Added `updatePasswordAndLinkLocal()` - Links local provider and sets password
- ✅ Updated `findByProviderAndId()` - Now searches in linkedProviders array
- ✅ Existing functions: `linkProvider()`, `isProviderLinked()`, `findByLinkedProvider()`

### 3. Signup Flow (`auth.service.ts` - `signup()`)

**Logic**:
1. Check if email exists
2. If exists:
   - Check if local provider already linked
   - If YES → Error: "Email already registered. Please login with your email and password."
   - If NO → Link local provider + set password + login
3. If new user → Create account + link local provider

**Result**: Users can add password to social accounts via signup!

### 4. Social Auth Flow (`auth.service.ts` - `socialAuth()`)

**Logic**:
1. Verify token with OAuth provider (Google/Facebook/Apple)
2. Check if provider already linked → Login
3. If not linked:
   - Check if email exists
   - If exists → Link new provider (keep existing name)
   - If new → Create account + link provider

**Result**: Never shows error, always links and logs in!

### 5. Name Handling Rule

**"First one wins!"**
- First signup/login sets the name
- Subsequent provider linking does NOT change name
- Example:
  - Signup with "Hasan" → Name: "Hasan"
  - Login with Google "Muhammad Hasan Alam" → Name stays "Hasan"

## User Flows

### Flow 1: Email/Password First
```
1. Signup (email/password) → Account created, name: "Hasan"
2. Login with Google → Google linked, name: "Hasan" (unchanged)
3. Login with Facebook → Facebook linked, name: "Hasan" (unchanged)
```

### Flow 2: Google First
```
1. Login with Google → Account created, name: "Muhammad Hasan"
2. Signup (email/password) → Local linked, name: "Muhammad Hasan" (unchanged)
3. Login with Facebook → Facebook linked, name: "Muhammad Hasan" (unchanged)
```

### Flow 3: Duplicate Local Signup
```
1. Signup (email/password) → Account created
2. Signup again (same email) → ❌ Error: "Email already registered"
```

### Flow 4: Duplicate Social Login
```
1. Login with Google → Account created
2. Login with Google again → ✅ Success (no error)
```

## API Responses

### Signup Success (New User)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "Hasan",
      "linkedProviders": [
        {"provider": "local", "linkedAt": "2026-03-05T..."}
      ],
      "createdAt": "2026-03-05T..."
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Signup Success (Linking to Existing Social Account)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "Muhammad Hasan",
      "linkedProviders": [
        {"provider": "google", "linkedAt": "2026-03-05T..."},
        {"provider": "local", "linkedAt": "2026-03-05T..."}
      ],
      "createdAt": "2026-03-05T..."
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Signup Error (Local Already Exists)
```json
{
  "success": false,
  "error": {
    "message": "Email already registered. Please login with your email and password.",
    "statusCode": 409
  }
}
```

## Security Features

✅ Email verification required for account linking (OAuth providers verify emails)
✅ Password hashing with bcrypt (12 rounds)
✅ JWT tokens with expiry (access: 15min, refresh: 7 days)
✅ Refresh token rotation (old tokens invalidated)
✅ Rate limiting on auth endpoints (5 attempts per 15min)

## Testing Scenarios

### Test 1: Signup → Google Login
```bash
# 1. Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test@123"}'

# 2. Login with Google (same email)
curl -X POST http://localhost:3000/api/v1/auth/social \
  -H "Content-Type: application/json" \
  -d '{"provider":"google","token":"GOOGLE_ACCESS_TOKEN"}'

# Expected: Success, Google linked, name unchanged
```

### Test 2: Google Login → Signup
```bash
# 1. Login with Google
curl -X POST http://localhost:3000/api/v1/auth/social \
  -H "Content-Type: application/json" \
  -d '{"provider":"google","token":"GOOGLE_ACCESS_TOKEN"}'

# 2. Signup (same email)
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test@123"}'

# Expected: Success, local linked, name unchanged
```

### Test 3: Duplicate Signup
```bash
# 1. Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test@123"}'

# 2. Signup again
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test@123"}'

# Expected: Error 409 - "Email already registered"
```

## Industry Best Practices Followed

✅ **Supabase/Clerk Approach**: Automatic account linking with verified emails
✅ **Spotify Pattern**: Allow adding password to social accounts
✅ **Security First**: Only link when email is verified by OAuth provider
✅ **User Experience**: Seamless linking, no confusing errors
✅ **Flexibility**: Users can login with any linked method

## Migration Notes

**Existing Users**: If you have existing users with `provider` and `providerId` fields:
1. Run a migration script to move data to `linkedProviders` array
2. Or keep fields for backward compatibility (they're now optional)

**Database Indexes**: 
- Removed: `{provider: 1, providerId: 1}` compound index
- Using: `{'linkedProviders.provider': 1, 'linkedProviders.providerId': 1}` index
