'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../../../lib/apiService';
import UserTable, { type UserRow } from '../../../../features/auth/UserTable';
import UserFormModal from '../../../../features/auth/UserFormModal';
import DeleteConfirmDialog from '../../../../features/auth/DeleteConfirmDialog';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserRow | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  useEffect(() => {
    apiService.getCurrentUser().then((res) => {
      setCurrentUser(res.data.data.user);
    }).catch(() => {
      router.push('/login');
    });
  }, [router]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const res = await apiService.getUsers(page, pageSize, search || undefined);
      setUsers(res.data.data.users);
      setTotal(res.data.data.total);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleSaveUser(_user: UserRow) {
    loadUsers();
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingUser) return;
    setDeactivateLoading(true);
    try {
      await apiService.deleteUser(deactivatingUser.id);
      setDeactivatingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to deactivate user.');
    } finally {
      setDeactivateLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-500 hover:text-slate-700 mb-1"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">{total} user{total !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add User
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        {loadingUsers ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
            Loading users…
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={(u: UserRow) => setEditingUser(u)}
            onDeactivate={(u: UserRow) => setDeactivatingUser(u)}
            currentUserId={currentUser?.id ?? ''}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <UserFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {editingUser && (
        <UserFormModal
          initialData={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {deactivatingUser && (
        <DeleteConfirmDialog
          userName={deactivatingUser.name}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => setDeactivatingUser(null)}
          loading={deactivateLoading}
        />
      )}
    </main>
  );
}
