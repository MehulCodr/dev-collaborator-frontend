"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId;

  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [memberForm, setMemberForm] = useState({
    email: "",
    role: "member"
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    dueDate: ""
  });

  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState("");

  const loadOrganizationPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [organizationResponse, membersResponse, projectsResponse] = await Promise.all([
        apiRequest(`/organizations/${organizationId}`),
        apiRequest(`/organizations/${organizationId}/members`),
        apiRequest(`/organizations/${organizationId}/projects`)
      ]);

      setOrganization(organizationResponse.data.organization);
      setMembers(membersResponse.data.members || []);
      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      setError(error.message);

      if (error.message.toLowerCase().includes("unauthorized")) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadOrganizationPage();
    }
  }, [organizationId]);

  const handleMemberChange = (event) => {
    setMemberForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleProjectChange = (event) => {
    setProjectForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setAddingMember(true);
    setError("");

    try {
      await apiRequest(`/organizations/${organizationId}/members`, {
        method: "POST",
        body: JSON.stringify(memberForm)
      });

      setMemberForm({
        email: "",
        role: "member"
      });

      await loadOrganizationPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setCreatingProject(true);
    setError("");

    try {
      const payload = {
        name: projectForm.name,
        description: projectForm.description,
        status: projectForm.status
      };

      if (projectForm.startDate) {
        payload.startDate = projectForm.startDate;
      }

      if (projectForm.dueDate) {
        payload.dueDate = projectForm.dueDate;
      }

      await apiRequest(`/organizations/${organizationId}/projects`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setProjectForm({
        name: "",
        description: "",
        status: "active",
        startDate: "",
        dueDate: ""
      });

      await loadOrganizationPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setCreatingProject(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading organization...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
              ← Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-2">
              {organization?.name || "Organization"}
            </h1>
            <p className="text-slate-400 mt-1">
              {organization?.description || "Manage members and projects in this workspace."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Link
              href={`/analytics/organizations/${organizationId}`}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
            >
              Analytics
            </Link>

            <span className="rounded-full bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-300">
              {organization?.slug}
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <p className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold">Create project</h2>
            <p className="text-slate-400 mt-2">
              Projects contain tasks, comments, attachments, activity logs, notifications, and analytics.
            </p>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project name
                </label>
                <input
                  name="name"
                  value={projectForm.name}
                  onChange={handleProjectChange}
                  placeholder="DevCollab Backend"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={projectForm.description}
                  onChange={handleProjectChange}
                  placeholder="Backend API for developer collaboration platform"
                  rows={3}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={projectForm.status}
                    onChange={handleProjectChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start date
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    value={projectForm.startDate}
                    onChange={handleProjectChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Due date
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    value={projectForm.dueDate}
                    onChange={handleProjectChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingProject}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
              >
                {creatingProject ? "Creating project..." : "Create project"}
              </button>
            </form>
          </section>

          <aside className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold">Add member</h2>
            <p className="text-slate-400 mt-2">
              User must already be registered before adding them.
            </p>

            <form onSubmit={handleAddMember} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={memberForm.email}
                  onChange={handleMemberChange}
                  placeholder="member@example.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={memberForm.role}
                  onChange={handleMemberChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addingMember}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
              >
                {addingMember ? "Adding..." : "Add member"}
              </button>
            </form>
          </aside>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold">Projects</h2>
            <p className="text-slate-400 mt-2">
              Open a project to manage tasks.
            </p>

            {projects.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <p className="text-slate-400">No projects yet. Create your first project above.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {projects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-950 p-5 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-slate-400 mt-1">
                          {project.description || "No description"}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-500/10 text-blue-300 px-3 py-1 text-xs font-medium">
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold">Members</h2>
            <p className="text-slate-400 mt-2">
              Organization members and their roles.
            </p>

            {members.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <p className="text-slate-400">No members found.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">{member.user?.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">{member.user?.email}</p>
                      </div>

                      <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}