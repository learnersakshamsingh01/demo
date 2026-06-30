import { Link, useNavigate } from "react-router-dom";
import { SapLogo } from "@/components/SapLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Plus, MessageSquare, Trash2, LogOut, PanelLeftClose, PanelLeftOpen, User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Sidebar({ sessions, loading, activeSessionId, onNewChat, onDelete, open, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!open) {
    return (
      <div className="w-14 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-3" data-testid="sidebar-collapsed">
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" data-testid="sidebar-open-button" aria-label="Open sidebar">
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <button onClick={onNewChat} className="p-2 hover:bg-gray-100 rounded-md text-[#008FD3]" data-testid="sidebar-new-chat-collapsed" aria-label="New chat">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 border-r border-gray-200 bg-white flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <Link to="/" data-testid="sidebar-logo-link">
          <SapLogo size="sm" />
        </Link>
        <button onClick={onToggle} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500" data-testid="sidebar-close-button" aria-label="Close sidebar">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New chat */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-[#008FD3] hover:bg-[#0073AA] text-white rounded-md h-10 font-medium"
          data-testid="new-chat-button"
        >
          <Plus className="w-4 h-4" /> New chat
        </Button>
      </div>

      {/* History */}
      <div className="px-3 pb-2">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold px-2 mb-1">History</div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2" data-testid="chat-history-list">
        {loading && <div className="px-2 py-3 text-sm text-gray-400">Loading...</div>}
        {!loading && sessions.length === 0 && (
          <div className="px-3 py-6 text-sm text-gray-400 text-center">No chats yet.<br />Start a new one!</div>
        )}
        {!loading && sessions.map((s) => {
          const active = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors mb-0.5 ${
                active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => navigate(`/app/${s.id}`)}
              data-testid={`chat-history-item-${s.id}`}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${active ? "text-[#008FD3]" : "text-gray-400"}`} />
              <span className="flex-1 text-sm truncate">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                data-testid={`delete-chat-${s.id}`}
                aria-label="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* User */}
      <div className="border-t border-gray-200 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors" data-testid="user-menu-trigger">
              <div className="w-8 h-8 rounded-full bg-[#008FD3] text-white flex items-center justify-center font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => { logout(); navigate("/"); }}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
