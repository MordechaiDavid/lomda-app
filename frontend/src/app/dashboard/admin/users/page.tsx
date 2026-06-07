'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../../lib/apiService';
import UserTable, { type UserRow } from '../../../../features/auth/UserTable';
import UserFormModal from '../../../../features/auth/UserFormModal';
import DeleteConfirmDialog from '../../../../features/auth/DeleteConfirmDialog';

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserRow | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiService.getCurrentUser().then((res) => res.data.data.user),
    retry: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', { page, pageSize, search }],
    queryFn: () =>
      apiService.getUsers(page, pageSize, search || undefined).then((res) => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeactivatingUser(null);
    },
  });

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleSaveUser() {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  const users: UserRow[] = data?.users ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const errorMessage = error
    ? (error as any)?.response?.data?.error?.message ?? 'Failed to load users.'
    : null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-500 hover:text-slate-700 mb-1"
            >
              ← חזרה לדשבורד
            </button>
            <h1 className="text-2xl font-semibold text-slate-900">ניהול משתמשים</h1>
            <p className="mt-1 text-sm text-slate-500">סה&quot;כ {total} משתמשים</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + הוסף משתמש
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="חיפוש לפי שם או מייל..."
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            חפש
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
            >
              נקה
            </button>
          )}
        </form>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
            טוען משתמשים...
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={(u: UserRow) => setEditingUser(u)}
            onDeactivate={(u: UserRow) => setDeactivatingUser(u)}
            currentUserId={currentUser?.id ?? ''}
          />
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>עמוד {page} מתוך {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>

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
          onConfirm={() => deleteMutation.mutate(deactivatingUser.id)}
          onCancel={() => setDeactivatingUser(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </main>
  );
}
