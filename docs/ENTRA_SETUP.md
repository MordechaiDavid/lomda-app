# Microsoft Entra ID (Azure AD) — Setup & Testing Guide

This guide walks you, a single developer on Windows 10 with **no enterprise**, through
creating a free Microsoft "company" in the cloud, wiring it to Lomda, and syncing its
employees into the app so you can target them with training campaigns.

You do **NOT** need a Windows Server or on-prem Active Directory. Everything here is done
in a browser, for $0.

---

## Mental model (30 seconds)

- An **Entra tenant** = one company's cloud directory (e.g. "Acme Corp"). You'll create a
  free one to *play the role* of a customer.
- An **App registration** = Lomda's identity *inside* that tenant. It gives you 3 values:
  **Tenant ID**, **Client ID**, **Client secret**.
- Lomda's backend uses those 3 values (OAuth2 *client-credentials* flow — the app logs in as
  itself, not as a user) to call **Microsoft Graph** and pull the employee list.

---

## Step 1 — Create a free Entra tenant ("the customer")

1. Go to <https://portal.azure.com> and sign in (create a free Microsoft account if needed).
2. In the top search bar type **Microsoft Entra ID** and open it.
3. Left menu → **Manage tenants** → **+ Create**.
4. Choose type **Microsoft Entra ID** → **Next**.
5. Organization name: e.g. `LomdaTest`; Initial domain: e.g. `lomdatest` (becomes
   `lomdatest.onmicrosoft.com`); pick a country → **Review + create** → **Create**.
   (You may be asked to pass a captcha.)
6. After it's created, **switch into the new tenant**: top-right → **Settings (gear)** →
   **Switch directory** → pick `LomdaTest`. Confirm the tenant name shows top-right before continuing.

> The **free tier** of Entra includes user management, app registrations, and Graph access —
> everything this POC needs.

---

## Step 2 — Create fake employees

1. In the `LomdaTest` tenant: search **Users** → open it → **+ New user** → **Create new user**.
2. Fill **User principal name** (e.g. `dana`), **Display name** (e.g. `Dana Cohen`), set a
   password, optionally set **Job title** / **Department** under properties → **Create**.
3. Repeat ~5–10 times so you have a realistic directory. (Optional: create a couple of
   **Groups** under **Groups → New group** if you later want group-scoped sync.)

> Tip: the **email** Lomda stores comes from each user's `mail` field, falling back to their
> `userPrincipalName` (e.g. `dana@lomdatest.onmicrosoft.com`). That's the address campaigns
> will be sent to, so for real email testing you may want users whose `mail` is an inbox you control.

---

## Step 3 — Register the Lomda app & get the 3 values

1. Search **App registrations** → **+ New registration**.
2. Name: `Lomda`. Supported account types: **Accounts in this organizational directory only**
   (single tenant — fine for the POC). Leave Redirect URI empty (we're not doing login/SSO here).
   → **Register**.
3. On the app's **Overview** page, copy:
   - **Application (client) ID**  → this is your `ENTRA_CLIENT_ID`
   - **Directory (tenant) ID**    → this is your `ENTRA_TENANT_ID`

### Create the client secret
4. Left menu → **Certificates & secrets** → **Client secrets** → **+ New client secret**.
5. Description `lomda-poc`, expiry e.g. 180 days → **Add**.
6. **Copy the `Value` immediately** (it's shown only once) → this is your `ENTRA_CLIENT_SECRET`.
   (Copy the *Value*, not the *Secret ID*.)

### Grant the permission to read users
7. Left menu → **API permissions** → **+ Add a permission** → **Microsoft Graph** →
   **Application permissions** (NOT delegated) → search and tick **`User.Read.All`**
   → **Add permissions**.
   *(Optional: also add `Group.Read.All` for group sync later.)*
8. Click **Grant admin consent for LomdaTest** → confirm. You should see a green check ✓ in the
   **Status** column. **This step is what authorizes Lomda** — skipping it causes `403` errors.

You now have all three values. Treat the client secret like a database password.

---

## Step 4 — Configure Lomda's backend

Add the three values to `backend/.env` (this file is gitignored — never commit the secret):

```dotenv
ENTRA_TENANT_ID=<Directory (tenant) ID>
ENTRA_CLIENT_ID=<Application (client) ID>
ENTRA_CLIENT_SECRET=<the secret Value you copied>
```

Run migrations (creates the `organizations` table and the new `users` columns):

```powershell
cd backend
npm run db:migrate
```

Seed **one** organization row. For the POC, leave the Entra columns NULL on the row — the
backend will fall back to the `.env` values above. Run this against your dev DB (psql or any
SQL client; `DATABASE_URL` points at it):

```sql
INSERT INTO organizations (name, sync_enabled) VALUES ('LomdaTest', true);
```

> Later, for a real multi-tenant build, you'd store each customer's tenant/client/secret on
> their own `organizations` row (the secret encrypted via `encryptSecret()` in
> `backend/src/services/entra.service.ts`) instead of using the shared `.env` fallback.

---

## Step 5 — Run it

Start the app (`npm run dev` from the repo root, or just the backend). Then either use the UI
or curl.

### From the UI
Log in as an **admin**, go to **Dashboard → ניהול משתמשים (Manage users)**. If credentials are
detected you'll see a **"⟳ סנכרן מ-Microsoft Entra"** button. Click it — the fake employees
appear in the table, and a banner reports how many were created / updated / deactivated.

### From curl (auth cookie required — copy it from your browser devtools)
```bash
# 1) verify credentials — returns your tenant's display name
curl -X POST http://localhost:3001/api/v1/integrations/entra/test  --cookie "token=<JWT>"

# 2) pull users into the DB
curl -X POST http://localhost:3001/api/v1/integrations/entra/sync  --cookie "token=<JWT>"

# 3) check status / last sync time
curl http://localhost:3001/api/v1/integrations/entra/status  --cookie "token=<JWT>"
```

---

## Step 6 — Send a campaign to the synced users

The synced employees are now ordinary rows in `users` with real emails, so the **existing**
campaign flow works unchanged:

1. **Dashboard → קמפיינים (Campaigns) → קמפיין חדש** — create a campaign for a published course.
2. Add recipients using the synced employees' emails (e.g. `dana@lomdatest.onmicrosoft.com`).
3. Send. Known users are matched by email and auto-enrolled; they appear in the compliance report.

---

## Verifying it worked

```sql
SELECT email, name, is_active, auth_provider, entra_object_id
FROM users WHERE auth_provider = 'entra';
```

- **Idempotency:** click Sync twice → second run reports `created: 0`, the rest `updated`.
- **Deprovisioning:** in the Entra portal, *disable* or *delete* a user → Sync again →
  that user's `is_active` flips to `false` in Lomda.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `401` from `/entra/test` | Wrong secret, or you copied the secret **ID** instead of the **Value**, or the secret expired. Make a new client secret. |
| `403` / `Insufficient privileges` | `User.Read.All` not added as an **Application** permission, or **admin consent** not granted (Step 3.8). |
| `"Entra credentials are not configured"` | `.env` values missing/empty, or no `organizations` row exists. |
| `"Multiple organizations exist — pass organizationId"` | You have >1 org row; pass `?organizationId=<uuid>` or keep a single row for the POC. |
| Users sync but have no email | Those Entra accounts have neither `mail` nor a usable `userPrincipalName`; they're skipped by design. |

---

## What's intentionally NOT here (future phases)

- **SSO / "Log in with Microsoft"** (OIDC) — the natural next step after sync.
- **SCIM push** — Entra auto-pushes changes to Lomda instead of Lomda pulling.
- **On-prem LDAP AD** — only if a client mandates it; needs a different (VPN/agent) approach.
- **Self-service org onboarding UI** — admins entering their own tenant creds; the
  `organizations` table is already there to support it.
