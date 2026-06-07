import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { ValidationError, NotFoundError } from '../../middleware/error.handler.js';
import {
  getOrgEntraConfig,
  testConnection,
  syncOrganizationUsers
} from '../../services/entra.service.js';

const router = Router();

router.use(requireAuth, requireAdmin);

/**
 * Resolve which organization to operate on. For the POC: use an explicit
 * organizationId if provided, otherwise fall back to the single org that exists.
 */
async function resolveOrgId(req: Request): Promise<string> {
  const explicit = (req.body?.organizationId || req.query.organizationId) as string | undefined;
  if (explicit) return explicit;

  const result = await query<{ id: string }>('SELECT id FROM organizations ORDER BY created_at LIMIT 2');
  if (result.rows.length === 0) {
    throw new NotFoundError('Organization');
  }
  if (result.rows.length > 1) {
    throw new ValidationError('Multiple organizations exist — pass organizationId.');
  }
  return result.rows[0].id;
}

// GET /api/v1/integrations/entra/status — is Entra configured, and when did we last sync?
router.get('/entra/status', async (req: Request, res: Response) => {
  // Tolerate the not-set-up-yet state so the UI can render a disabled button.
  let orgId: string;
  try {
    orgId = await resolveOrgId(req);
  } catch {
    return res.json({
      success: true,
      data: { configured: false, organizationId: null, organizationName: null, tenantId: null, syncEnabled: false, lastSyncedAt: null }
    });
  }

  const result = await query<{
    id: string;
    name: string;
    entra_tenant_id: string | null;
    sync_enabled: boolean;
    last_synced_at: string | null;
  }>(
    `SELECT id, name, entra_tenant_id, sync_enabled, last_synced_at
     FROM organizations WHERE id = $1`,
    [orgId]
  );
  const org = result.rows[0];
  if (!org) throw new NotFoundError('Organization');

  // Configured if the org row OR the env fallback supplies credentials.
  let configured = false;
  try {
    await getOrgEntraConfig(orgId);
    configured = true;
  } catch {
    configured = false;
  }

  res.json({
    success: true,
    data: {
      organizationId: org.id,
      organizationName: org.name,
      configured,
      tenantId: org.entra_tenant_id,
      syncEnabled: org.sync_enabled,
      lastSyncedAt: org.last_synced_at
    }
  });
});

// POST /api/v1/integrations/entra/test — verify credentials against Microsoft Graph.
router.post('/entra/test', async (req: Request, res: Response) => {
  const orgId = await resolveOrgId(req);
  const org = await getOrgEntraConfig(orgId);
  const result = await testConnection(org);
  res.json({ success: true, data: result });
});

// POST /api/v1/integrations/entra/sync — pull the directory into the users table.
router.post('/entra/sync', async (req: Request, res: Response) => {
  const orgId = await resolveOrgId(req);
  const result = await syncOrganizationUsers(orgId);
  res.json({ success: true, data: result });
});

export default router;
