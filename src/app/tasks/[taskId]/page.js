"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId;

  const [task, setTask] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);

  const [statusForm, setStatusForm] = useState({
    status: ""
  });

  const [subtaskForm, setSubtaskForm] = useState({
    title: ""
  });

  const [commentForm, setCommentForm] = useState({
    body: "",
    mentions: []
  });

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const projectId = useMemo(() => {
    return task?.project?._id || task?.project;
  }, [task]);

  const loadTaskPage = async () => {
    try {
      setLoading(true);
      setError("");

      const taskResponse = await apiRequest(`/tasks/${taskId}`);
      const currentTask = taskResponse.data.task;

      setTask(currentTask);
      setStatusForm({
        status: currentTask.status
      });

      const currentProjectId = currentTask.project?._id || currentTask.project;

      const [
        membersResponse,
        commentsResponse,
        attachmentsResponse,
        activityResponse
      ] = await Promise.all([
        apiRequest(`/projects/${currentProjectId}/members`),
        apiRequest(`/tasks/${taskId}/comments`),
        apiRequest(`/tasks/${taskId}/attachments`),
        apiRequest(`/tasks/${taskId}/activity`)
      ]);

      setProjectMembers(membersResponse.data.members || []);
      setComments(commentsResponse.data.comments || []);
      setAttachments(attachmentsResponse.data.attachments || []);
      setActivities(activityResponse.data.activities || []);
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
    if (taskId) {
      loadTaskPage();
    }
  }, [taskId]);

  const handleStatusChange = (event) => {
    setStatusForm({
      status: event.target.value
    });
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    setSavingStatus(true);
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify(statusForm)
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSubtaskChange = (event) => {
    setSubtaskForm({
      title: event.target.value
    });
  };

  const handleAddSubtask = async (event) => {
    event.preventDefault();
    setAddingSubtask(true);
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify(subtaskForm)
      });

      setSubtaskForm({
        title: ""
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/subtasks/${subtask._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: subtask.title,
          isCompleted: !subtask.isCompleted
        })
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE"
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCommentBodyChange = (event) => {
    setCommentForm((previous) => ({
      ...previous,
      body: event.target.value
    }));
  };

  const handleMentionToggle = (userId) => {
    setCommentForm((previous) => {
      const exists = previous.mentions.includes(userId);

      return {
        ...previous,
        mentions: exists
          ? previous.mentions.filter((id) => id !== userId)
          : [...previous.mentions, userId]
      };
    });
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    setAddingComment(true);
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify(commentForm)
      });

      setCommentForm({
        body: "",
        mentions: []
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setError("");

    try {
      await apiRequest(`/comments/${commentId}`, {
        method: "DELETE"
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
  };

  const handleUploadAttachment = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiRequest(`/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData
      });

      setFile(null);
      event.target.reset();

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    setError("");

    try {
      await apiRequest(`/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE"
      });

      await loadTaskPage();
    } catch (error) {
      setError(error.message);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not set";
    }

    return new Date(value).toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading task...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <Link
              href={projectId ? `/projects/${projectId}` : "/dashboard"}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to project
            </Link>

            <h1 className="text-2xl font-bold mt-2">{task?.title}</h1>

            <p className="text-slate-400 mt-1">
              {task?.description || "No description"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <span className="rounded-full bg-blue-500/10 text-blue-300 px-4 py-2 text-sm font-medium">
              {task?.status}
            </span>

            <span className="rounded-full bg-orange-500/10 text-orange-300 px-4 py-2 text-sm font-medium">
              {task?.priority}
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
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Task details</h2>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Created by</p>
                  <p className="font-medium mt-1">{task?.createdBy?.name || "Unknown"}</p>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Assigned to</p>
                  <p className="font-medium mt-1">{task?.assignedTo?.name || "Unassigned"}</p>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Due date</p>
                  <p className="font-medium mt-1">{formatDate(task?.dueDate)}</p>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                  <p className="text-sm text-slate-400">Created at</p>
                  <p className="font-medium mt-1">{formatDateTime(task?.createdAt)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {task?.labels?.length ? (
                  task.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-xs"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No labels</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Subtasks</h2>

              <form onSubmit={handleAddSubtask} className="mt-5 flex flex-col md:flex-row gap-3">
                <input
                  value={subtaskForm.title}
                  onChange={handleSubtaskChange}
                  placeholder="Add a subtask"
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />

                <button
                  type="submit"
                  disabled={addingSubtask}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {addingSubtask ? "Adding..." : "Add"}
                </button>
              </form>

              {task?.subtasks?.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400">No subtasks yet.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask._id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-4"
                    >
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={subtask.isCompleted}
                          onChange={() => handleToggleSubtask(subtask)}
                          className="h-4 w-4"
                        />

                        <span
                          className={
                            subtask.isCompleted
                              ? "line-through text-slate-500"
                              : "text-slate-200"
                          }
                        >
                          {subtask.title}
                        </span>
                      </label>

                      <button
                        onClick={() => handleDeleteSubtask(subtask._id)}
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Comments</h2>

              <form onSubmit={handleAddComment} className="mt-5 space-y-4">
                <textarea
                  value={commentForm.body}
                  onChange={handleCommentBodyChange}
                  placeholder="Write a comment..."
                  rows={4}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />

                <div>
                  <p className="text-sm font-medium text-slate-300 mb-3">
                    Mention project members
                  </p>

                  {projectMembers.length === 0 ? (
                    <p className="text-sm text-slate-500">No project members available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {projectMembers.map((member) => {
                        const userId = member.user?._id;
                        const selected = commentForm.mentions.includes(userId);

                        return (
                          <button
                            type="button"
                            key={member._id}
                            onClick={() => handleMentionToggle(userId)}
                            className={
                              selected
                                ? "rounded-full bg-blue-600 text-white px-3 py-1 text-sm"
                                : "rounded-full bg-slate-800 text-slate-300 px-3 py-1 text-sm hover:bg-slate-700"
                            }
                          >
                            @{member.user?.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addingComment}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {addingComment ? "Posting..." : "Post comment"}
                </button>
              </form>

              {comments.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400">No comments yet.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold">{comment.author?.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDateTime(comment.createdAt)}
                            {comment.isEdited ? " · edited" : ""}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-sm text-red-300 hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>

                      <p className="text-slate-300 mt-4 whitespace-pre-wrap">{comment.body}</p>

                      {comment.mentions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {comment.mentions.map((user) => (
                            <span
                              key={user._id}
                              className="rounded-full bg-blue-500/10 text-blue-300 px-3 py-1 text-xs"
                            >
                              @{user.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Update status</h2>

              <form onSubmit={handleUpdateStatus} className="mt-5 space-y-4">
                <select
                  value={statusForm.status}
                  onChange={handleStatusChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  type="submit"
                  disabled={savingStatus}
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {savingStatus ? "Updating..." : "Update status"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Attachments</h2>

              <form onSubmit={handleUploadAttachment} className="mt-5 space-y-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white"
                />

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload file"}
                </button>
              </form>

              {attachments.length === 0 ? (
                <p className="text-sm text-slate-500 mt-5">No attachments yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      className="rounded-xl bg-slate-950 border border-slate-800 p-4"
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        className="font-medium text-blue-300 hover:text-blue-200 break-all"
                      >
                        {attachment.originalName}
                      </a>

                      <p className="text-xs text-slate-500 mt-2">
                        {(attachment.size / 1024).toFixed(2)} KB · {attachment.mimeType}
                      </p>

                      <button
                        onClick={() => handleDeleteAttachment(attachment._id)}
                        className="text-sm text-red-300 hover:text-red-200 mt-3"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-xl font-bold">Activity</h2>

              {activities.length === 0 ? (
                <p className="text-sm text-slate-500 mt-5">No activity yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="rounded-xl bg-slate-950 border border-slate-800 p-4"
                    >
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {activity.user?.name || "Unknown user"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}