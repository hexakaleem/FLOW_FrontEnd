"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  UserPlus,
  EnvelopeSimple,
  ShieldCheck,
  Trash,
  PencilSimple,
  X,
  Check,
  Spinner,
  WarningCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";

// ── Types ───────────────────────────────────────────────────────────────────
interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
}

interface Member {
  id: string;
  _id: string;
  userId: string;
  status: string;
  joinedAt: string;
  profile?: { firstName: string; lastName: string; email: string };
  role?: Role;
}

// ── Validation Schemas ──────────────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  roleId: z.string().min(1, "Select a role"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(32, "Role name must be under 32 characters")
    .regex(/^[a-z_]+$/, "Use lowercase letters and underscores only"),
  permissions: z.array(z.string()).min(1, "Pick at least one permission"),
});

type RoleFormData = z.infer<typeof roleSchema>;

const AVAILABLE_PERMISSIONS = [
  { key: "load:create", label: "Create Loads", category: "Loads" },
  { key: "load:read", label: "View Loads", category: "Loads" },
  { key: "load:book", label: "Book Loads", category: "Loads" },
  { key: "load:cancel", label: "Cancel Loads", category: "Loads" },
  { key: "load:update", label: "Update Loads", category: "Loads" },
  { key: "fleet:read", label: "View Fleet", category: "Fleet" },
  { key: "fleet:write", label: "Manage Fleet", category: "Fleet" },
  { key: "fleet:assign_drivers", label: "Assign Drivers", category: "Fleet" },
  { key: "marketplace:read", label: "View Marketplace", category: "Marketplace" },
  { key: "marketplace:write", label: "Post to Marketplace", category: "Marketplace" },
  { key: "team:read", label: "View Team", category: "Team" },
  { key: "team:write", label: "Manage Team", category: "Team" },
  { key: "payments:read", label: "View Payments", category: "Payments" },
  { key: "analytics:read", label: "View Analytics", category: "Analytics" },
  { key: "documents:read", label: "View Documents", category: "Documents" },
  { key: "documents:upload", label: "Upload Documents", category: "Documents" },
];

// Derived lookup map for quick label access (e.g., in role cards)
const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  AVAILABLE_PERMISSIONS.map((p) => [p.key, p.label]),
);

// ── Sub-components ──────────────────────────────────────────────────────────

/** Shimmer skeleton for loading state */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-surface-soft" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-md bg-surface-soft" />
            <div className="h-3 w-48 rounded-md bg-surface-soft" />
          </div>
        </div>
      </td>
      <td className="p-5">
        <div className="h-6 w-20 rounded-lg bg-surface-soft" />
      </td>
      <td className="p-5">
        <div className="h-6 w-16 rounded-full bg-surface-soft" />
      </td>
      <td className="p-5">
        <div className="h-4 w-24 rounded-md bg-surface-soft" />
      </td>
      <td className="p-5">
        <div className="h-8 w-16 rounded-xl bg-surface-soft ml-auto" />
      </td>
    </tr>
  );
}

/** Delete confirmation modal */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card w-full max-w-md rounded-xl border border-hairline shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-danger-light">
            <WarningCircle size={24} weight="fill" className="text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="text-sm font-bold text-muted mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary h-11 px-6 text-[11px] font-semibold "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-primary h-11 px-6 text-[11px] font-semibold  bg-danger border-none hover:bg-danger/90 shadow-lg"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function TeamPage() {
  const user = useAppSelector((state) => state.auth.user);

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", roleId: "" },
  });

  // Role editing
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const roleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", permissions: [] },
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "member" | "role";
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Member role reassign
  const [reassignTarget, setReassignTarget] = useState<Member | null>(null);
  const [reassignRoleId, setReassignRoleId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // ── Data Fetching ──────────────────────────────────────────────────────
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      const [membersRes, rolesRes] = await Promise.all([
        api.get("/teams", { params }),
        api.get("/teams/roles"),
      ]);
      setMembers(membersRes.data.data?.members || membersRes.data.data || []);
      setRoles(rolesRes.data.data?.roles || rolesRes.data.data || []);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      const msg =
        axiosErr.response?.data?.error?.message || "Failed to load team data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // ── Invite ─────────────────────────────────────────────────────────────
  const handleInvite = async (data: InviteFormData) => {
    setInviting(true);
    try {
      await api.post("/teams/invite", data);
      toast.success("Invitation sent successfully");
      setShowInvite(false);
      inviteForm.reset();
      fetchTeamData();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(
        axiosErr.response?.data?.error?.message || "Failed to send invite",
      );
    } finally {
      setInviting(false);
    }
  };

  // ── Remove Member ──────────────────────────────────────────────────────
  const confirmRemoveMember = (member: Member) => {
    const name = member.profile
      ? `${member.profile.firstName} ${member.profile.lastName}`
      : member.userId;
    setDeleteTarget({ type: "member", id: member._id, label: name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "member") {
        await api.delete(`/teams/members/${deleteTarget.id}`);
        toast.success(`${deleteTarget.label} removed from team`);
      } else {
        await api.delete(`/teams/roles/${deleteTarget.id}`);
        toast.success(`Role "${deleteTarget.label}" deleted`);
      }
      setDeleteTarget(null);
      fetchTeamData();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosErr.response?.data?.error?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ── Reassign Role ──────────────────────────────────────────────────────
  const openReassign = (member: Member) => {
    setReassignTarget(member);
    setReassignRoleId(member.role?._id || "");
  };

  const handleReassign = async () => {
    if (!reassignTarget || !reassignRoleId) return;
    setReassigning(true);
    try {
      await api.patch(`/teams/members/${reassignTarget._id}`, {
        roleId: reassignRoleId,
      });
      toast.success(
        `Role updated for ${reassignTarget.profile?.firstName || "member"}`,
      );
      setReassignTarget(null);
      fetchTeamData();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(
        axiosErr.response?.data?.error?.message || "Failed to update role",
      );
    } finally {
      setReassigning(false);
    }
  };

  // ── Role CRUD ──────────────────────────────────────────────────────────
  const openCreateRole = () => {
    setEditingRoleId(null);
    roleForm.reset({ name: "", permissions: [] });
    setShowRoleEditor(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRoleId(role._id);
    roleForm.reset({ name: role.name, permissions: role.permissions || [] });
    setShowRoleEditor(true);
  };

  const handleSaveRole = async (data: RoleFormData) => {
    setSavingRole(true);
    try {
      if (editingRoleId) {
        await api.put(`/teams/roles/${editingRoleId}`, data);
        toast.success("Role updated");
      } else {
        await api.post("/teams/roles", data);
        toast.success("Role created");
      }
      setShowRoleEditor(false);
      roleForm.reset();
      fetchTeamData();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(
        axiosErr.response?.data?.error?.message || "Failed to save role",
      );
    } finally {
      setSavingRole(false);
    }
  };

  const confirmDeleteRole = (role: Role) => {
    setDeleteTarget({ type: "role", id: role._id, label: role.name });
  };

  const togglePermission = (perm: string) => {
    const current = roleForm.getValues("permissions");
    const updated = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm];
    roleForm.setValue("permissions", updated, { shouldValidate: true });
  };

  // ── Render Helpers ─────────────────────────────────────────────────────
  const statusClass = (status: string) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1  font-semibold ",
      status === "active"
        ? "bg-success-light text-success"
        : status === "pending"
          ? "bg-warning-light text-warning"
          : "bg-muted/15 text-muted",
    );

  return (
    <div className="p-6 space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink flex items-center gap-3">
            <Users size={28} weight="fill" className="text-ink" />
            Team Management
          </h1>
          <p className="text-xs font-bold text-muted  mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
            {roles.length} role{roles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openCreateRole}
            className="btn btn-secondary h-11 px-5 text-[11px] font-semibold "
          >
            <ShieldCheck size={18} weight="bold" />
            New Role
          </button>
          <button
            onClick={() => {
              inviteForm.reset();
              setShowInvite(true);
            }}
            className="btn btn-primary h-11 px-5 text-[11px] font-semibold  shadow-sm"
          >
            <UserPlus size={18} weight="bold" />
            Invite Member
          </button>
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-light p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WarningCircle size={24} weight="fill" className="text-danger" />
            <span className="text-sm font-bold text-danger">{error}</span>
          </div>
          <button
            onClick={fetchTeamData}
            className="btn btn-secondary h-9 px-4  font-semibold "
          >
            <ArrowsClockwise size={16} weight="bold" />
            Retry
          </button>
        </div>
      )}

      {/* ── Search & Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-hairline bg-surface-soft pl-12 pr-5 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="relative sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-md border border-hairline bg-surface-soft pl-5 pr-10 py-3 text-sm font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
        </div>
        {(searchQuery || roleFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
            }}
            className="btn btn-secondary h-11 px-4  font-semibold "
          >
            <X size={14} weight="bold" />
            Clear
          </button>
        )}
      </div>

      {/* ── Members Table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-hairline bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft/40">
                <th className="p-5  font-semibold  text-muted">
                  Member
                </th>
                <th className="p-5  font-semibold  text-muted">
                  Role
                </th>
                <th className="p-5  font-semibold  text-muted">
                  Status
                </th>
                <th className="p-5  font-semibold  text-muted">
                  Joined
                </th>
                <th className="p-5  font-semibold  text-muted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <>
                  <SkeletonRow key="sk-1" />
                  <SkeletonRow key="sk-2" />
                  <SkeletonRow key="sk-3" />
                  <SkeletonRow key="sk-4" />
                </>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-surface-soft mb-4">
                        <Users size={32} weight="bold" className="text-muted" />
                      </div>
                      <h3 className="text-lg font-semibold text-ink">
                        No members yet
                      </h3>
                      <p className="text-sm font-bold text-muted mt-1 max-w-xs">
                        Invite your first team member to start collaborating.
                      </p>
                      <button
                        onClick={() => {
                          inviteForm.reset();
                          setShowInvite(true);
                        }}
                        className="btn btn-primary h-11 px-6 mt-6 text-[11px] font-semibold  shadow-lg"
                      >
                        <UserPlus size={18} weight="bold" />
                        Invite Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id || member._id}
                    className="group hover:bg-surface-soft/20 transition-colors"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-soft text-ink font-semibold text-sm shadow-sm">
                          {member.profile?.firstName?.charAt(0) || "?"}
                          {member.profile?.lastName?.charAt(0) || ""}
                        </div>
                        <div>
                          <div className="font-semibold text-ink text-sm">
                            {member.profile
                              ? `${member.profile.firstName} ${member.profile.lastName}`
                              : "Unknown"}
                          </div>
                          <div className="text-xs font-bold text-muted">
                            {member.profile?.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-light px-3 py-1.5 text-xs font-semibold  text-indigo">
                        <ShieldCheck size={14} weight="bold" />
                        {member.role?.name || "No Role"}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={statusClass(member.status)}>
                        {member.status === "active" && (
                          <Check size={12} weight="bold" />
                        )}
                        {member.status === "pending" && (
                          <Spinner
                            size={12}
                            weight="bold"
                            className="animate-spin"
                          />
                        )}
                        {member.status}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-bold text-muted">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td className="p-5 text-right">
                      {member.userId !== user?.id && (
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openReassign(member)}
                            className="h-9 w-9 flex items-center justify-center rounded-md bg-card border border-hairline text-ink hover:bg-surface-soft transition-colors"
                            title="Change role"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>
                          <button
                            onClick={() => confirmRemoveMember(member)}
                            className="h-9 w-9 flex items-center justify-center rounded-md bg-danger-light border border-danger/20 text-danger hover:bg-danger hover:text-white transition-colors"
                            title="Remove member"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Role Management Section ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <ShieldCheck size={22} weight="fill" className="text-ink" />
            Roles & Permissions
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.length === 0 && !loading && (
            <div className="col-span-full rounded-xl border border-hairline bg-card p-10 text-center">
              <ShieldCheck
                size={32}
                weight="bold"
                className="text-muted mx-auto mb-3"
              />
              <p className="text-sm font-bold text-muted">
                No custom roles defined yet.
              </p>
            </div>
          )}
          {roles.map((role) => (
            <div
              key={role._id}
              className="rounded-xl border border-hairline bg-card p-5 shadow-sm hover:border-ink transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-light text-indigo">
                    <ShieldCheck size={20} weight="bold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink text-sm uppercase tracking-wide">
                      {role.name}
                    </h4>
                    <p className=" font-bold text-muted ">
                      {role.permissions?.length || 0} permission
                      {(role.permissions?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {role.isSystem && (
                  <span className="text-[9px] font-semibold  text-muted bg-surface-soft px-2 py-0.5 rounded-md">
                    System
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(role.permissions || []).slice(0, 4).map((p) => (
                  <span
                    key={p}
                    className="text-[9px] font-bold text-muted bg-surface-soft px-2 py-0.5 rounded-md"
                  >
                    {PERMISSION_LABELS[p] || p}
                  </span>
                ))}
                {(role.permissions || []).length > 4 && (
                  <span className="text-[9px] font-bold text-muted bg-surface-soft px-2 py-0.5 rounded-md">
                    +{(role.permissions || []).length - 4} more
                  </span>
                )}
              </div>
              {!role.isSystem && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditRole(role)}
                    className="flex-1 btn btn-secondary h-9  font-semibold "
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDeleteRole(role)}
                    className="flex-1 btn btn-secondary h-9  font-semibold  text-danger border-danger/20 hover:bg-danger-light"
                  >
                    <Trash size={14} weight="bold" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Invite Modal ────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-xl border border-hairline shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  Invite Member
                </h2>
                <p className="text-xs font-bold text-muted  mt-1">
                  Send an invitation email
                </p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-surface-soft hover:bg-border transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form
              onSubmit={inviteForm.handleSubmit(handleInvite)}
              className="space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeSimple
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    weight="bold"
                  />
                  <input
                    type="email"
                    {...inviteForm.register("email")}
                    className="w-full rounded-md border border-hairline bg-surface-soft pl-12 pr-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
                    placeholder="colleague@company.com"
                  />
                </div>
                {inviteForm.formState.errors.email && (
                  <p className="text-xs font-bold text-danger ml-1">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Assign Role
                </label>
                <div className="relative">
                  <ShieldCheck
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    weight="bold"
                  />
                  <select
                    {...inviteForm.register("roleId")}
                    className="w-full rounded-md border border-hairline bg-surface-soft pl-12 pr-10 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name} ({role.permissions?.length || 0}{" "}
                        permissions)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </div>
                </div>
                {inviteForm.formState.errors.roleId && (
                  <p className="text-xs font-bold text-danger ml-1">
                    {inviteForm.formState.errors.roleId.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 btn btn-secondary h-11 text-[11px] font-semibold "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 btn btn-primary h-11 text-[11px] font-semibold  shadow-sm"
                >
                  {inviting ? (
                    <Spinner size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <EnvelopeSimple size={18} weight="bold" />
                  )}
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Role Editor Modal ───────────────────────────────────────────── */}
      {showRoleEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-xl border border-hairline shadow-2xl p-8 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {editingRoleId ? "Edit Role" : "Create Role"}
                </h2>
                <p className="text-xs font-bold text-muted  mt-1">
                  Define name and permissions
                </p>
              </div>
              <button
                onClick={() => setShowRoleEditor(false)}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-surface-soft hover:bg-border transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form
              onSubmit={roleForm.handleSubmit(handleSaveRole)}
              className="space-y-5"
            >
              {/* Role Name */}
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Role Name
                </label>
                <input
                  type="text"
                  {...roleForm.register("name")}
                  className="w-full rounded-md border border-hairline bg-surface-soft px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
                  placeholder="e.g. dispatcher"
                />
                {roleForm.formState.errors.name && (
                  <p className="text-xs font-bold text-danger ml-1">
                    {roleForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <label className="ml-1  font-semibold  text-muted">
                  Permissions
                </label>
                {roleForm.formState.errors.permissions && (
                  <p className="text-xs font-bold text-danger ml-1">
                    {roleForm.formState.errors.permissions.message}
                  </p>
                )}
                <div className="space-y-3 max-h-52 overflow-y-auto p-1">
                  {(() => {
                    // Group permissions by category
                    const categories = new Map<
                      string,
                      typeof AVAILABLE_PERMISSIONS
                    >();
                    AVAILABLE_PERMISSIONS.forEach((perm) => {
                      if (!categories.has(perm.category)) {
                        categories.set(perm.category, []);
                      }
                      categories.get(perm.category)!.push(perm);
                    });
                    return Array.from(categories.entries()).map(
                      ([category, perms]) => (
                        <div key={category}>
                          <p className=" font-semibold  text-muted mb-1.5 ml-1">
                            {category}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map((perm) => {
                              const selected = roleForm
                                .watch("permissions")
                                .includes(perm.key);
                              return (
                                <button
                                  key={perm.key}
                                  type="button"
                                  onClick={() => togglePermission(perm.key)}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold transition-all",
                                    selected
                                      ? "bg-surface-soft text-ink ring-1 ring-primary"
                                      : "bg-surface-soft text-muted hover:bg-border",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "h-4 w-4 rounded-md border-2 flex items-center justify-center transition-all",
                                      selected
                                        ? "bg-primary border-primary"
                                        : "border-hairline bg-card",
                                    )}
                                  >
                                    {selected && (
                                      <Check
                                        size={10}
                                        weight="bold"
                                        className="text-white"
                                      />
                                    )}
                                  </div>
                                  {perm.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleEditor(false)}
                  className="flex-1 btn btn-secondary h-11 text-[11px] font-semibold "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="flex-1 btn btn-primary h-11 text-[11px] font-semibold  shadow-sm"
                >
                  {savingRole ? (
                    <Spinner size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <Check size={18} weight="bold" />
                  )}
                  {savingRole
                    ? "Saving..."
                    : editingRoleId
                      ? "Update Role"
                      : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reassign Role Modal ─────────────────────────────────────────── */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-xl border border-hairline shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-ink">
                Change Role
              </h2>
              <button
                onClick={() => setReassignTarget(null)}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-surface-soft hover:bg-border transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <p className="text-sm font-bold text-muted mb-4">
              {reassignTarget.profile?.firstName}{" "}
              {reassignTarget.profile?.lastName}
            </p>

            <div className="space-y-2 mb-6">
              <label className="ml-1  font-semibold  text-muted">
                New Role
              </label>
              <select
                value={reassignRoleId}
                onChange={(e) => setReassignRoleId(e.target.value)}
                className="w-full rounded-md border border-hairline bg-surface-soft px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReassignTarget(null)}
                className="flex-1 btn btn-secondary h-11 text-[11px] font-semibold "
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassigning || !reassignRoleId}
                className="flex-1 btn btn-primary h-11 text-[11px] font-semibold  shadow-lg"
              >
                {reassigning ? (
                  <Spinner size={18} weight="bold" className="animate-spin" />
                ) : null}
                {reassigning ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget?.type === "member" ? "Remove Team Member" : "Delete Role"
        }
        message={
          deleteTarget?.type === "member"
            ? `Are you sure you want to remove ${deleteTarget?.label} from the team? This action cannot be undone.`
            : `Are you sure you want to delete the "${deleteTarget?.label}" role? Members assigned to this role will lose those permissions.`
        }
        confirmLabel={
          deleteTarget?.type === "member" ? "Remove Member" : "Delete Role"
        }
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
