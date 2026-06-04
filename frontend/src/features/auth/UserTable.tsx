'use client';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  users: UserRow[];
  onEdit: (user: UserRow) => void;
  onDeactivate: (user: UserRow) => void;
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  trainer: 'Trainer',
  employee: 'Employee',
  viewer: 'Viewer',
};

export default function UserTable({ users, onEdit, onDeactivate, currentUserId }: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
              <td className="px-5 py-3 text-gray-600">{user.email}</td>
              <td className="px-5 py-3">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </td>
              <td className="px-5 py-3">
                {user.is_active ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Active</span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">Inactive</span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="rounded-md border px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      {user.is_active ? 'Deactivate' : 'Deactivated'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
