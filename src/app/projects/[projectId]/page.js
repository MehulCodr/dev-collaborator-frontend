"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId;

    const [project, setProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [memberForm, setMemberForm] = useState({
        email: "",
        role: "developer"
    });

    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        assignedTo: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        labels: ""
    });

    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        search: ""
    });

    const [loading, setLoading] = useState(true);
    const [addingMember, setAddingMember] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [error, setError] = useState("");

    const queryString = useMemo(() => {
        const params = new URLSearchParams();

        if (filters.status) {
            params.set("status", filters.status);
        }

        if (filters.priority) {
            params.set("priority", filters.priority);
        }

        if (filters.search.trim()) {
            params.set("search", filters.search.trim());
        }

        const value = params.toString();

        return value ? `?${value}` : "";
    }, [filters]);

    const loadProjectPage = async () => {
        try {
            setLoading(true);
            setError("");

            const [projectResponse, membersResponse, tasksResponse] = await Promise.all([
                apiRequest(`/projects/${projectId}`),
                apiRequest(`/projects/${projectId}/members`),
                apiRequest(`/projects/${projectId}/tasks${queryString}`)
            ]);

            setProject(projectResponse.data.project);
            setProjectMembers(membersResponse.data.members || []);
            setTasks(tasksResponse.data.tasks || []);
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
        if (projectId) {
            loadProjectPage();
        }
    }, [projectId, queryString]);

    const handleMemberChange = (event) => {
        setMemberForm((previous) => ({
            ...previous,
            [event.target.name]: event.target.value
        }));
    };

    const handleTaskChange = (event) => {
        setTaskForm((previous) => ({
            ...previous,
            [event.target.name]: event.target.value
        }));
    };

    const handleFilterChange = (event) => {
        setFilters((previous) => ({
            ...previous,
            [event.target.name]: event.target.value
        }));
    };

    const handleAddProjectMember = async (event) => {
        event.preventDefault();
        setAddingMember(true);
        setError("");

        try {
            await apiRequest(`/projects/${projectId}/members`, {
                method: "POST",
                body: JSON.stringify(memberForm)
            });

            setMemberForm({
                email: "",
                role: "developer"
            });

            await loadProjectPage();
        } catch (error) {
            setError(error.message);
        } finally {
            setAddingMember(false);
        }
    };

    const handleCreateTask = async (event) => {
        event.preventDefault();
        setCreatingTask(true);
        setError("");

        try {
            const labels = taskForm.labels
                .split(",")
                .map((label) => label.trim())
                .filter(Boolean);

            const payload = {
                title: taskForm.title,
                description: taskForm.description,
                status: taskForm.status,
                priority: taskForm.priority,
                labels
            };

            if (taskForm.assignedTo) {
                payload.assignedTo = taskForm.assignedTo;
            }

            if (taskForm.dueDate) {
                payload.dueDate = taskForm.dueDate;
            }

            await apiRequest(`/projects/${projectId}/tasks`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            setTaskForm({
                title: "",
                description: "",
                assignedTo: "",
                status: "todo",
                priority: "medium",
                dueDate: "",
                labels: ""
            });

            await loadProjectPage();
        } catch (error) {
            setError(error.message);
        } finally {
            setCreatingTask(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <p className="text-slate-400">Loading project...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800 bg-slate-950/80">
                <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
                    <div>
                        <Link
                            href={
                                project?.organization?._id
                                    ? `/organizations/${project.organization._id}`
                                    : "/dashboard"
                            }
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            ← Back to organization
                        </Link>

                        <h1 className="text-2xl font-bold mt-2">{project?.name || "Project"}</h1>

                        <p className="text-slate-400 mt-1">
                            {project?.description || "Manage tasks and members for this project."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end">
                        <Link
                            href={`/analytics/projects/${projectId}`}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
                        >
                            Analytics
                        </Link>

                        <span className="rounded-full bg-blue-500/10 text-blue-300 px-4 py-2 text-sm font-medium">
                            {project?.status}
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
                        <h2 className="text-xl font-bold">Create task</h2>
                        <p className="text-slate-400 mt-2">
                            Tasks can be assigned to project members and tracked by status, priority, labels, and due date.
                        </p>

                        <form onSubmit={handleCreateTask} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Task title
                                </label>
                                <input
                                    name="title"
                                    value={taskForm.title}
                                    onChange={handleTaskChange}
                                    placeholder="Create auth middleware"
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
                                    value={taskForm.description}
                                    onChange={handleTaskChange}
                                    placeholder="Protect private routes using JWT verification"
                                    rows={3}
                                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Assignee
                                    </label>
                                    <select
                                        name="assignedTo"
                                        value={taskForm.assignedTo}
                                        onChange={handleTaskChange}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                    >
                                        <option value="">Unassigned</option>
                                        {projectMembers.map((member) => (
                                            <option key={member._id} value={member.user?._id}>
                                                {member.user?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={taskForm.status}
                                        onChange={handleTaskChange}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                    >
                                        <option value="backlog">Backlog</option>
                                        <option value="todo">Todo</option>
                                        <option value="in-progress">In progress</option>
                                        <option value="review">Review</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={taskForm.priority}
                                        onChange={handleTaskChange}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Due date
                                    </label>
                                    <input
                                        name="dueDate"
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={handleTaskChange}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Labels
                                </label>
                                <input
                                    name="labels"
                                    value={taskForm.labels}
                                    onChange={handleTaskChange}
                                    placeholder="backend, auth, security"
                                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Separate labels using commas.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={creatingTask}
                                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                            >
                                {creatingTask ? "Creating task..." : "Create task"}
                            </button>
                        </form>
                    </section>

                    <aside className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
                        <h2 className="text-xl font-bold">Add project member</h2>
                        <p className="text-slate-400 mt-2">
                            User must already be a member of the organization.
                        </p>

                        <form onSubmit={handleAddProjectMember} className="mt-6 space-y-4">
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
                                    <option value="manager">Manager</option>
                                    <option value="developer">Developer</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={addingMember}
                                className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                            >
                                {addingMember ? "Adding..." : "Add project member"}
                            </button>
                        </form>
                    </aside>
                </div>

                <section className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">Tasks</h2>
                            <p className="text-slate-400 mt-2">
                                Filter tasks by status, priority, or search text.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
                            <input
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search tasks"
                                className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />

                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                            >
                                <option value="">All statuses</option>
                                <option value="backlog">Backlog</option>
                                <option value="todo">Todo</option>
                                <option value="in-progress">In progress</option>
                                <option value="review">Review</option>
                                <option value="completed">Completed</option>
                            </select>

                            <select
                                name="priority"
                                value={filters.priority}
                                onChange={handleFilterChange}
                                className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                            >
                                <option value="">All priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                            <p className="text-slate-400">No tasks found.</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {tasks.map((task) => (
                                <Link
                                    key={task._id}
                                    href={`/tasks/${task._id}`}
                                    className="block rounded-xl border border-slate-800 bg-slate-950 p-5 hover:border-blue-500 transition"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg">{task.title}</h3>
                                            <p className="text-slate-400 mt-1">
                                                {task.description || "No description"}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {task.labels?.map((label) => (
                                                    <span
                                                        key={label}
                                                        className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap md:justify-end gap-2">
                                            <span className="rounded-full bg-blue-500/10 text-blue-300 px-3 py-1 text-xs font-medium">
                                                {task.status}
                                            </span>

                                            <span className="rounded-full bg-orange-500/10 text-orange-300 px-3 py-1 text-xs font-medium">
                                                {task.priority}
                                            </span>

                                            <span className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs font-medium">
                                                {task.assignedTo?.name || "Unassigned"}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
                    <h2 className="text-xl font-bold">Project members</h2>
                    <p className="text-slate-400 mt-2">
                        Members assigned to this project.
                    </p>

                    {projectMembers.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                            <p className="text-slate-400">No project members found.</p>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projectMembers.map((member) => (
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
            </section>
        </main>
    );
}