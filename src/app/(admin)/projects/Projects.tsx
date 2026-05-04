"use client";

import React, { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import ProjectType from "@/types/project";
import getErrorMessage from "@/lib/api-error";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

export default function Projects() {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isCreatFormOpen, setIsCreateFormOpen] = useState(false);



  async function createProject(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const { data } = await api.post("/projects", {
        name,
        description,
      });

      setProjects((existing) => [data.project, ...existing]);
      setName("");
      setDescription("");

      setIsCreateFormOpen(false);

      toast.success("Project created successfully!");
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data } = await api.get("/projects");

        setProjects(data.projects);
      }
      catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        toast.error(message);
      }
      finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tenant-isolated projects for the active organization.
          </p>
        </div>

        <Button
          onClick={() => { setError(""); setIsCreateFormOpen(true) }}
          className="btn btn-outline btn-sm"
          size="xs"
          variant="outline"
        >
          New Project
        </Button>
      </div>

      {isCreatFormOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add a new project inside the current tenant.
                </p>
              </div>

              <Button
                onClick={() => setIsCreateFormOpen(false)}
                size="xs"
                variant="simple"
              >
                ✕
              </Button>
            </div>
            <form onSubmit={createProject} className="grid gap-4 md:grid-cols-3">
              <Input
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
              />

              <Input
                defaultValue={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />

              <Button
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Project"}
              </Button>
            </form>
            {error && (
              <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Project List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Description
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No projects yet.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {project.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {project.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString()}
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