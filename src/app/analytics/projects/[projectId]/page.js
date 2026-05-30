"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [analytics, setAnalytics] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [analyticsResponse, projectResponse] = await Promise.all([
        apiRequest(`/analytics/projects/${projectId}`),
        apiRequest(`/projects/${projectId}`)
      ]);

      setAnalytics(analyticsResponse.data);
      setProject(projectResponse.data.project);
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
      loadAnalytics();
    }
  }, [projectId]);

  const maxCount = (items) => {
    return Math.max(...items.map((item) => item.count), 1);
  };

  const formatHours = (hours) => {
    if (!hours) {
      return "0h";
    }

    if (hours < 24) {
      return `${hours}h`;
    }

    return `${(hours / 24).toFixed(1)}d`;
  };

  const organizationId = project?.organization?._id || project?.organization;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading analytics...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to project
            </Link>

            <h1 className="text-2xl font-bold mt-2">Project Analytics</h1>

            <p className="text-slate-400 mt-1">
              {project?.name || "Project"} task performance and workload.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            {organizationId && (
              <Link
                href={`/analytics/organizations/${organizationId}`}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
              >
                Organization analytics
              </Link>
            )}

            <span className="rounded-full bg-blue-500/10 text-blue-300 px-4 py-2 text-sm font-medium">
              Project
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Total tasks" value={analytics?.overview?.totalTasks || 0} />
          <MetricCard label="Completed" value={analytics?.overview?.completedTasks || 0} />
          <MetricCard label="Active" value={analytics?.overview?.activeTasks || 0} />
          <MetricCard label="Overdue" value={analytics?.overview?.overdueTasks || 0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <MetricCard label="Progress" value={`${analytics?.overview?.progressPercentage || 0}%`} />
          <MetricCard
            label="Average completion time"
            value={formatHours(analytics?.overview?.averageCompletionTime?.averageHours)}
          />
        </div>

        <section className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-xl font-bold">Progress</h2>
          <p className="text-slate-400 mt-2">
            Percentage of completed tasks in this project.
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-300">Completed</span>
              <span className="text-slate-400">
                {analytics?.overview?.progressPercentage || 0}%
              </span>
            </div>

            <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${analytics?.overview?.progressPercentage || 0}%`
                }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <ChartCard
            title="Tasks by status"
            items={analytics?.tasksByStatus || []}
            labelKey="status"
            maxCount={maxCount(analytics?.tasksByStatus || [])}
          />

          <ChartCard
            title="Tasks by priority"
            items={analytics?.tasksByPriority || []}
            labelKey="priority"
            maxCount={maxCount(analytics?.tasksByPriority || [])}
          />
        </div>

        <section className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-xl font-bold">Completed tasks per week</h2>
          <p className="text-slate-400 mt-2">
            Weekly task completion trend.
          </p>

          {analytics?.completedPerWeek?.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">No completed task data yet.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {analytics?.completedPerWeek?.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${(item.count / maxCount(analytics.completedPerWeek)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-xl font-bold">Workload by member</h2>
          <p className="text-slate-400 mt-2">
            Task load and completion rate for each project member.
          </p>

          {analytics?.workloadByMember?.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">No workload data yet.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics?.workloadByMember?.map((item) => (
                <div
                  key={item.user._id}
                  className="rounded-xl bg-slate-950 border border-slate-800 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{item.user.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{item.user.email}</p>
                    </div>

                    <span className="rounded-full bg-blue-500/10 text-blue-300 px-3 py-1 text-xs">
                      {item.completionRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <SmallMetric label="Total" value={item.totalTasks} />
                    <SmallMetric label="Active" value={item.activeTasks} />
                    <SmallMetric label="Completed" value={item.completedTasks} />
                    <SmallMetric label="Overdue" value={item.overdueTasks} />
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

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
      <p className="text-slate-500">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, items, labelKey, maxCount }) {
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
      <h2 className="text-xl font-bold">{title}</h2>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-400">No data yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item[labelKey]}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="capitalize text-slate-300">{item[labelKey]}</span>
                <span className="text-slate-400">{item.count}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}