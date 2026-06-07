import { describe, it, expect } from 'vitest';
import {
  diffUsers,
  encryptSecret,
  decryptSecret,
  type EntraUser,
  type ExistingEntraUser
} from '../src/services/entra.service.js';

function entraUser(oid: string, overrides: Partial<EntraUser> = {}): EntraUser {
  return {
    entraObjectId: oid,
    email: `${oid}@acme.example`,
    name: `User ${oid}`,
    accountEnabled: true,
    ...overrides
  };
}

function existing(oid: string, isActive = true): ExistingEntraUser {
  return { entra_object_id: oid, is_active: isActive };
}

describe('diffUsers', () => {
  it('classifies brand-new directory users as create', () => {
    const { toCreate, toUpdate, toDeactivate } = diffUsers([], [entraUser('a'), entraUser('b')]);
    expect(toCreate.map((u) => u.entraObjectId)).toEqual(['a', 'b']);
    expect(toUpdate).toHaveLength(0);
    expect(toDeactivate).toHaveLength(0);
  });

  it('classifies already-synced users as update', () => {
    const { toCreate, toUpdate } = diffUsers([existing('a')], [entraUser('a'), entraUser('b')]);
    expect(toUpdate.map((u) => u.entraObjectId)).toEqual(['a']);
    expect(toCreate.map((u) => u.entraObjectId)).toEqual(['b']);
  });

  it('deactivates active users no longer present in the directory', () => {
    const { toDeactivate } = diffUsers([existing('a'), existing('gone')], [entraUser('a')]);
    expect(toDeactivate.map((u) => u.entra_object_id)).toEqual(['gone']);
  });

  it('does not re-deactivate already-inactive users', () => {
    const { toDeactivate } = diffUsers([existing('gone', false)], []);
    expect(toDeactivate).toHaveLength(0);
  });

  it('is idempotent — a second sync of the same set is all updates, no creates/deactivations', () => {
    const fetched = [entraUser('a'), entraUser('b')];
    const result = diffUsers([existing('a'), existing('b')], fetched);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(2);
    expect(result.toDeactivate).toHaveLength(0);
  });
});

describe('client-secret encryption', () => {
  it('round-trips a secret through encrypt/decrypt', () => {
    const secret = 'super-secret-client-value~123';
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptSecret('x')).not.toBe(encryptSecret('x'));
  });
});
