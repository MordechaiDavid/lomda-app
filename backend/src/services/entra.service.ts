import crypto from 'crypto';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { config } from '../config/index.js';
import { query } from '../db/index.js';
import { NotFoundError, ValidationError } from '../middleware/error.handler.js';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

// DEV-only sample directory, returned when config.entra.mock is on. Stable object IDs
// keep re-syncs idempotent; the disabled user demonstrates deprovisioning.
const MOCK_USERS: EntraUser[] = [
  { entraObjectId: 'mock-0001', email: 'dana.cohen@lomdatest.onmicrosoft.com', name: 'Dana Cohen', accountEnabled: true },
  { entraObjectId: 'mock-0002', email: 'avi.levi@lomdatest.onmicrosoft.com', name: 'Avi Levi', accountEnabled: true },
  { entraObjectId: 'mock-0003', email: 'noa.mizrahi@lomdatest.onmicrosoft.com', name: 'Noa Mizrahi', accountEnabled: true },
  { entraObjectId: 'mock-0004', email: 'yossi.peretz@lomdatest.onmicrosoft.com', name: 'Yossi Peretz', accountEnabled: true },
  { entraObjectId: 'mock-0005', email: 'maya.bar@lomdatest.onmicrosoft.com', name: 'Maya Bar', accountEnabled: true },
  { entraObjectId: 'mock-0006', email: 'eitan.shapira@lomdatest.onmicrosoft.com', name: 'Eitan Shapira (former)', accountEnabled: false }
];

// ── Types ───────────────────────────────────────────────────────────────────

/** Resolved per-organization Entra credentials (DB row, with env fallback for the POC). */
export interface OrgEntraConfig {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/** A user as returned by Microsoft Graph, normalized to what we store. */
export interface EntraUser {
  entraObjectId: string;
  email: string;
  name: string;
  accountEnabled: boolean;
}

/** Minimal shape of an already-synced user row, for diffing. */
export interface ExistingEntraUser {
  entra_object_id: string;
  is_active: boolean;
}

export interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
}

// ── Secret encryption (client secret at rest) ───────────────────────────────
// AES-256-GCM with a key derived from config.security.encryptionKey.

const SECRET_KEY = crypto.createHash('sha256').update(config.security.encryptionKey).digest();

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

// ── Config resolution ────────────────────────────────────────────────────────

/**
 * Load an organization's Entra credentials. Falls back to the single-org POC
 * values in config.entra (.env) when the DB row has no per-org credentials yet.
 */
export async function getOrgEntraConfig(orgId: string): Promise<OrgEntraConfig> {
  const result = await query<{
    id: string;
    name: string;
    entra_tenant_id: string | null;
    entra_client_id: string | null;
    entra_client_secret_enc: string | null;
  }>(
    `SELECT id, name, entra_tenant_id, entra_client_id, entra_client_secret_enc
     FROM organizations WHERE id = $1`,
    [orgId]
  );
  const org = result.rows[0];
  if (!org) throw new NotFoundError('Organization');

  // Mock mode: no real credentials needed, just the org row.
  if (config.entra.mock) {
    return { id: org.id, name: org.name, tenantId: 'mock', clientId: 'mock', clientSecret: 'mock' };
  }

  const tenantId = org.entra_tenant_id || config.entra.tenantId;
  const clientId = org.entra_client_id || config.entra.clientId;
  const clientSecret = org.entra_client_secret_enc
    ? decryptSecret(org.entra_client_secret_enc)
    : config.entra.clientSecret;

  if (!tenantId || !clientId || !clientSecret) {
    throw new ValidationError(
      'Entra credentials are not configured for this organization (set ENTRA_TENANT_ID / ENTRA_CLIENT_ID / ENTRA_CLIENT_SECRET, or store them on the organization).'
    );
  }

  return { id: org.id, name: org.name, tenantId, clientId, clientSecret };
}

// ── Graph client ─────────────────────────────────────────────────────────────

/** Build a Graph client authenticated as the app (OAuth2 client-credentials flow). */
export function getGraphClient(org: OrgEntraConfig): Client {
  const credential = new ClientSecretCredential(org.tenantId, org.clientId, org.clientSecret);
  return Client.init({
    authProvider: async (done) => {
      try {
        const token = await credential.getToken(GRAPH_SCOPE);
        done(null, token?.token ?? null);
      } catch (err) {
        done(err as Error, null);
      }
    }
  });
}

/** Verify credentials by reading the tenant's own /organization resource. Returns its display name. */
export async function testConnection(org: OrgEntraConfig): Promise<{ tenantName: string }> {
  if (config.entra.mock) return { tenantName: `${org.name} (Mock)` };

  const client = getGraphClient(org);
  const res = await client.api('/organization').select('displayName').get();
  const tenantName = res?.value?.[0]?.displayName ?? org.name;
  return { tenantName };
}

interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

/** Fetch all users from the tenant via Graph, following @odata.nextLink paging. */
export async function fetchUsers(org: OrgEntraConfig): Promise<EntraUser[]> {
  if (config.entra.mock) return MOCK_USERS;

  const client = getGraphClient(org);
  const users: EntraUser[] = [];

  let response = await client
    .api('/users')
    .select(['id', 'displayName', 'mail', 'userPrincipalName', 'jobTitle', 'department', 'accountEnabled'])
    .top(100)
    .get();

  while (response) {
    for (const u of (response.value ?? []) as GraphUser[]) {
      const email = (u.mail ?? u.userPrincipalName ?? '').toLowerCase();
      if (!email) continue; // can't enroll / email a user without an address
      users.push({
        entraObjectId: u.id,
        email,
        name: u.displayName ?? email,
        accountEnabled: u.accountEnabled ?? true
      });
    }

    const next = response['@odata.nextLink'];
    response = next ? await client.api(next).get() : null;
  }

  return users;
}

// ── Pure diff (unit-testable without a DB or network) ────────────────────────

/**
 * Compare the users currently in our DB for an org against the freshly-fetched
 * Entra list, and decide what to create, update, and deactivate.
 */
export function diffUsers(existing: ExistingEntraUser[], fetched: EntraUser[]) {
  const existingByOid = new Map(existing.map((e) => [e.entra_object_id, e]));
  const fetchedOids = new Set(fetched.map((f) => f.entraObjectId));

  const toCreate: EntraUser[] = [];
  const toUpdate: EntraUser[] = [];
  for (const f of fetched) {
    if (existingByOid.has(f.entraObjectId)) toUpdate.push(f);
    else toCreate.push(f);
  }

  // Still in our DB and active, but no longer present in the directory → deprovision.
  const toDeactivate = existing.filter((e) => e.is_active && !fetchedOids.has(e.entra_object_id));

  return { toCreate, toUpdate, toDeactivate };
}

// ── Orchestration ────────────────────────────────────────────────────────────

/**
 * Pull the org's directory from Entra and reconcile it into the `users` table.
 * Inserts new users, updates existing ones, and soft-deactivates removed ones.
 */
export async function syncOrganizationUsers(orgId: string): Promise<SyncResult> {
  const org = await getOrgEntraConfig(orgId);
  const fetched = await fetchUsers(org);

  const existingResult = await query<ExistingEntraUser>(
    `SELECT entra_object_id, is_active FROM users
     WHERE organization_id = $1 AND auth_provider = 'entra' AND entra_object_id IS NOT NULL`,
    [orgId]
  );

  const { toCreate, toUpdate, toDeactivate } = diffUsers(existingResult.rows, fetched);

  for (const u of [...toCreate, ...toUpdate]) {
    // Upsert keyed on (organization_id, entra_object_id). Password stays NULL for AD users.
    await query(
      `INSERT INTO users (email, name, role, is_active, organization_id, entra_object_id, auth_provider, password)
       VALUES ($1, $2, 'employee', $3, $4, $5, 'entra', NULL)
       ON CONFLICT (organization_id, entra_object_id) WHERE entra_object_id IS NOT NULL
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
                     is_active = EXCLUDED.is_active, updated_at = NOW()`,
      [u.email, u.name, u.accountEnabled, orgId, u.entraObjectId]
    );
  }

  for (const u of toDeactivate) {
    await query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE organization_id = $1 AND entra_object_id = $2`,
      [orgId, u.entra_object_id]
    );
  }

  await query(`UPDATE organizations SET last_synced_at = NOW() WHERE id = $1`, [orgId]);

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    deactivated: toDeactivate.length
  };
}
