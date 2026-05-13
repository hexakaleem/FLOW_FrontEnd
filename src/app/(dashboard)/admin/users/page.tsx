'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, User, Shield, Info, MagnifyingGlass, UserMinus, UserPlus, Clock, FileText, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import api from '@/lib/axios';

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  identityStatus: string;
  identityVerified: boolean;
  createdAt: string;
  verificationDocuments: { url: string; type: string }[];
}

export default function AdminUsersPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user?.role, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data?.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApproveIdentity(userId: string) {
    setIsProcessing(userId);
    try {
      await api.post(`/admin/verifications/${userId}/approve`);
      toast.success('User activated and identity approved');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'active', identityStatus: 'approved', identityVerified: true } : u));
    } catch {
      toast.error('Failed to activate user');
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleSuspend(userId: string) {
    setIsProcessing(userId);
    try {
      await api.post(`/admin/users/${userId}/suspend`);
      toast.success('User suspended');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'suspended' } : u));
    } catch {
      toast.error('Failed to suspend');
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleReactivate(userId: string) {
    setIsProcessing(userId);
    try {
      await api.post(`/admin/users/${userId}/reactivate`);
      toast.success('User reactivated');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'active' } : u));
    } catch {
      toast.error('Failed to reactivate');
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User account deleted');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setIsProcessing(null);
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-sm text-muted">Manage all platform users and their access</p>
        </div>
        <div className="relative w-64">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-lg border border-hairline bg-card pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-bottom border-hairline">
            <tr>
              <th className="px-6 py-4 font-bold text-muted  ">User</th>
              <th className="px-6 py-4 font-bold text-muted  ">Role</th>
              <th className="px-6 py-4 font-bold text-muted  ">Status</th>
              <th className="px-6 py-4 font-bold text-muted  ">Verification</th>
              <th className="px-6 py-4 font-bold text-muted   text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredUsers.map((u) => (
              <React.Fragment key={u._id}>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-ink text-xs font-bold">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-ink">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-indigo-light px-2 py-0.5  font-semibold uppercase text-indigo tracking-wider">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "rounded-full px-2 py-0.5  font-semibold ",
                      u.status === 'active' ? "bg-success-light text-success" : 
                      u.status === 'suspended' ? "bg-danger-light text-danger" : "bg-warning-light text-warning"
                    )}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.identityVerified ? (
                        <CheckCircle size={16} className="text-success" weight="fill" />
                      ) : (
                        <Clock size={16} className="text-warning" weight="fill" />
                      )}
                      <span className="text-xs font-medium">{u.identityStatus}</span>
                      {u.verificationDocuments.length > 0 && (
                        <button 
                          onClick={() => setSelectedUserId(selectedUserId === u._id ? null : u._id)}
                          className="ml-2 text-ink hover:underline  font-bold"
                        >
                          {selectedUserId === u._id ? 'Hide Docs' : `View Docs (${u.verificationDocuments.length})`}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!u.identityVerified && (
                        <button
                          onClick={() => handleApproveIdentity(u._id)}
                          disabled={!!isProcessing}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-success px-3  font-semibold  text-white hover:bg-success/90 disabled:opacity-50"
                          title="Approve Identity & Activate Account"
                        >
                          <CheckCircle size={14} weight="bold" />
                          Activate
                        </button>
                      )}
                      {u.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(u._id)}
                          disabled={!!isProcessing}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-danger px-3  font-semibold  text-white hover:bg-danger/90 disabled:opacity-50"
                        >
                          <UserMinus size={14} weight="bold" />
                          Suspend
                        </button>
                      ) : u.status === 'suspended' ? (
                        <button
                          onClick={() => handleReactivate(u._id)}
                          disabled={!!isProcessing}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo px-3  font-semibold  text-white hover:bg-indigo/90 disabled:opacity-50"
                        >
                          <UserPlus size={14} weight="bold" />
                          Reactivate
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={!!isProcessing}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-danger/30 px-3 font-semibold text-danger hover:bg-danger/5 disabled:opacity-50"
                        title="Delete User Account Permanently"
                      >
                        <Trash size={14} weight="bold" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {selectedUserId === u._id && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-muted/10 border-y border-hairline">
                      <div className="grid grid-cols-2 gap-4">
                        {u.verificationDocuments.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-hairline bg-card p-3 hover:border-ink transition-all"
                          >
                            <FileText size={20} className="text-ink" />
                            <div>
                              <p className="text-sm font-medium text-ink">Document {idx + 1}</p>
                              <p className="text-xs text-muted">{doc.type}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Info size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-muted font-medium">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
