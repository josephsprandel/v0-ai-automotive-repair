# V0 Preview Branch

⚠️ **WARNING: This branch is ONLY for v0.dev design previews. NEVER deploy to production!**

## What is this branch?

This `v0-preview` branch is specifically configured to work with v0.dev for design iterations. It has authentication disabled and uses mock data so v0 can preview and modify the UI without needing database access.

## Key Differences from Main

### 1. Authentication is Disabled
- Set `NEXT_PUBLIC_DISABLE_AUTH=true` in `.env`
- All routes are publicly accessible
- No login required
- Mock user is automatically created

### 2. Mock Data Mode
- Set `NEXT_PUBLIC_MOCK_DATA=true` in `.env`
- API endpoints return sample data instead of database queries
- No database connection needed
- Sample customers, vehicles, work orders, and parts

## How to Use with v0.dev

### Step 1: Point v0 to this Branch

In v0.dev, import from GitHub:
```
https://github.com/josephsprandel/v0-ai-automotive-repair/tree/v0-preview
```

### Step 2: v0 Can Now Preview

v0 will:
- See the app working with mock data
- Access all pages without authentication
- Generate design changes
- Test UI modifications

### Step 3: Copy Changes Back to Main

**IMPORTANT:** Do NOT merge this branch into main! Instead:

1. Download the changed files from v0
2. Switch to main branch: `git checkout main`
3. Create a new branch: `git checkout -b design-update`
4. Copy the UI changes from v0
5. Remove any preview-mode code if accidentally included
6. Test that everything works with real auth/data
7. Merge to main: `git checkout main && git merge design-update`

## Environment Variables

Add these to `.env` file (NOT in production):

```bash
# V0 Preview Mode - Development Only
NEXT_PUBLIC_DISABLE_AUTH=true
NEXT_PUBLIC_MOCK_DATA=true
```

## Mock Data Available

The preview includes sample data for:
- **Customers**: 3 sample customers
- **Vehicles**: 3 sample vehicles
- **Work Orders**: 3 sample ROs (pending, in progress, completed)
- **Parts**: 3 sample inventory items
- **Shop Profile**: Sample shop settings
- **Dashboard Metrics**: Sample statistics

See `lib/mock-data.ts` for all available mock data.

## Files Modified for Preview Mode

1. `.env.example` - Added preview mode variables
2. `contexts/auth-context.tsx` - Auth bypass when disabled
3. `lib/mock-data.ts` - Mock data definitions
4. `app/api/customers/route.ts` - Mock data support
5. `app/api/work-orders/route.ts` - Mock data support

## Keeping This Branch Updated

When main branch gets ahead, sync changes:

```bash
git checkout v0-preview
git merge main
# Verify auth is still disabled
# Verify mock data still works
git push origin v0-preview
```

## Safety Rules

### ❌ NEVER DO:
- Deploy this branch to production
- Merge v0-preview into main
- Use preview mode in production environment
- Commit real credentials or data

### ✅ ALWAYS DO:
- Keep preview mode env variables false in production
- Copy UI changes manually from v0 to main
- Test on main branch before deploying
- Keep auth enabled in main branch

## Troubleshooting

**Q: v0 says "Authentication required"**  
A: Make sure `.env` has `NEXT_PUBLIC_DISABLE_AUTH=true`

**Q: v0 shows database errors**  
A: Make sure `.env` has `NEXT_PUBLIC_MOCK_DATA=true`

**Q: Changes from v0 broke authentication**  
A: v0 might have modified auth code. Revert those changes in main branch.

**Q: How do I test v0 changes locally?**  
A: 
1. Checkout v0-preview branch
2. Add preview env variables to `.env`
3. Run `npm run dev`
4. Test at http://localhost:3000

## Support

This is a development tool for design iteration. For production issues, work on the `main` branch.
