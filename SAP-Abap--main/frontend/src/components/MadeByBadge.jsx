import { Code2 } from "lucide-react";

export default function MadeByBadge() {
  return (
    <a
      href="https://github.com/"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg hover:bg-[#008FD3] transition-colors"
      data-testid="made-by-badge"
    >
      <Code2 className="w-3.5 h-3.5" />
      Made by <span className="font-semibold">Saksham Singh</span>
    </a>
  );
}
