import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import ChatArea from "@/components/dashboard/ChatArea";
import { toast } from "sonner";

export default function Dashboard() {
  const { token } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const loadSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/sessions`, { headers });
      setSessions(res.data);
    } catch (e) {
      toast.error("Failed to load chat history");
    } finally {
      setLoadingSessions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createSession = async (opts = {}) => {
    try {
      const res = await axios.post(`${API}/sessions`, { title: "New Chat" }, { headers });
      setSessions((prev) => [res.data, ...prev]);
      if (!opts.skipNavigate) navigate(`/app/${res.data.id}`);
      return res.data;
    } catch (e) {
      toast.error("Could not create chat");
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API}/sessions/${id}`, { headers });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) navigate("/app");
      toast.success("Chat deleted");
    } catch (e) {
      toast.error("Failed to delete chat");
    }
  };

  const onSessionUpdated = (updated) => {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      // Move to top
      next.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      return next;
    });
  };

  return (
    <div className="h-screen flex bg-[#F7F7F8] overflow-hidden" data-testid="dashboard-page">
      <Sidebar
        sessions={sessions}
        loading={loadingSessions}
        activeSessionId={sessionId}
        onNewChat={createSession}
        onDelete={deleteSession}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <ChatArea
        key={sessionId || "empty"}
        sessionId={sessionId}
        onCreateSession={createSession}
        onSessionUpdated={onSessionUpdated}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
