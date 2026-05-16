"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import MemberType from "@/types/member";
import getErrorMessage from "@/lib/api-error";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

export default function Team() {
  const { membership: { role } } = useAppContext();
  const canManageTeam = useMemo(() => {
    return role === 'OWNER' || role === 'ADMIN';
  }, [role]);

  const [members, setMembers] = useState<MemberType[]>([]);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [memberRole, setMemberRole] = useState("VIEWER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function addMember(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const { data } = await api.post("/memberships", {
        email,
        role: memberRole,
      });

      setMembers(currentMembers => [...currentMembers, data.member]);

      setEmail("");
      setMemberRole("VIEWER");
      setIsCreateFormOpen(false);
      toast.success("Member added successfully");
    }
    catch (error) {
      toast.error(getErrorMessage(error));
    }
    finally {
      setSaving(false);
    }
  }

  async function updateMemberRole(membershipId: string, role: string) {
    try {
      const { data } = await api.patch(`/memberships/${membershipId}`, { role });
      setMembers(currentMembers => currentMembers.map(member => member.id === membershipId ? data.member : member));

      toast.success("Member role updated");
    }
    catch (error) {
      toast.error(getErrorMessage(error, "Failed to update role"));
    }
  }

  async function removeMember(membershipId: string) {
    const confirm = window.confirm("Are you sure you want to remove this member from the organization?");

    if (!confirm) {
      return;
    }

    try {
      await api.delete(`/memberships/${membershipId}`);

      setMembers(currentMembers => currentMembers.filter(member => member.id !== membershipId));

      toast.success("Member removed from organization");
    }
    catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove member"));
    }
  }

  useEffect(() => {
    async function loadMembers() {
      try {
        const { data } = await api.get("/memberships");
        setMembers(data.members);
      }
      catch (error) {
        toast.error(getErrorMessage(error));
      }
      finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Team
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage users and roles for the active organization.
          </p>
        </div>

        {canManageTeam && (
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            size="xs"
            variant="outline"
          >
            Add Member
          </Button>
        )}
      </div>

      {isCreateFormOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Add Team Member
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  User must already have an account in Tenovo.
                </p>
              </div>

              <Button
                onClick={() => setIsCreateFormOpen(false)}
                variant="simple"
                size="xs"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={addMember} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email
                </label>
                <Input
                  defaultValue={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="teammate@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Role
                </label>
                <Select
                  defaultValue={memberRole}
                  onChange={(value) => setMemberRole(value)}
                  options={[{ value: "ADMIN", label: "Admin" }, { value: "MEMBER", label: "Member" }, { value: "VIEWER", label: "Viewer" }]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => setIsCreateFormOpen(false)}
                  variant="danger"
                  size="md"
                >
                  Cancel
                </Button>

                <Button
                  disabled={saving}
                  variant="primary"
                  size="md"
                >
                  {saving ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Members
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    Loading team members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {member.user.name || "Unnamed User"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {canManageTeam && member.role !== "OWNER" ? (
                        <Select
                          defaultValue={member.role}
                          onChange={(role) => updateMemberRole(member.id, role)}
                          options={[{ value: "ADMIN", label: "Admin" }, { value: "MEMBER", label: "Member" }, { value: "VIEWER", label: "Viewer" }]}
                        />
                      ) : (
                        member.role
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {canManageTeam && member.role !== "OWNER" ? (
                        <Button
                          onClick={() => removeMember(member.id)}
                          variant="dangerOutline"
                          size="xs"
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}