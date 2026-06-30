import { SapLogo } from "@/components/SapLogo";
import { Code2, Database, GitBranch, Workflow, Bug, FileCode2 } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: <Database className="w-5 h-5" />,
    title: "Write a SELECT query",
    prompt: "Write an optimized ABAP SELECT to fetch active material masters from MARA with material type FERT, joining MAKT for description in English.",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Explain BAPI usage",
    prompt: "Explain how to use BAPI_SALESORDER_CREATEFROMDAT2 in ABAP with a minimal example, including commit and error handling.",
  },
  {
    icon: <Workflow className="w-5 h-5" />,
    title: "Convert FORM to METHOD",
    prompt: "Show me how to refactor a classic ABAP FORM routine into an object-oriented method in a local class. Provide before/after code.",
  },
  {
    icon: <FileCode2 className="w-5 h-5" />,
    title: "Create a CDS view",
    prompt: "Write a CDS view for sales orders (VBAK header + VBAP items) with @AbapCatalog annotations and an authorization check.",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: "RAP behavior definition",
    prompt: "Generate a minimal RAP (RESTful ABAP Programming Model) behavior definition with create, update, delete for a managed scenario.",
  },
  {
    icon: <Bug className="w-5 h-5" />,
    title: "Debug ABAP dump",
    prompt: "I'm getting an ABAP runtime dump 'COMPUTE_INT_TIMES_ZERO'. What does it mean and how do I fix it?",
  },
];

export default function EmptyState({ onPick }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16" data-testid="empty-state">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-md bg-[#008FD3]/10 text-[#008FD3] flex items-center justify-center mb-6">
          <Code2 className="w-8 h-8" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-gray-900">
          How can I help with your ABAP today?
        </h1>
        <p className="mt-3 text-gray-600 max-w-xl">
          Your <SapLogo size="sm" className="inline-flex translate-y-1" /> — ask anything about ABAP, CDS, RAP, BAPI, or SAP development.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="suggested-prompts">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.prompt)}
            className="text-left rounded-md border border-gray-200 bg-white p-4 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md transition-all group"
            data-testid={`suggested-prompt-${i}`}
          >
            <div className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 group-hover:bg-[#008FD3]/10 group-hover:text-[#008FD3] flex items-center justify-center transition-colors">
              {s.icon}
            </div>
            <div className="mt-3 font-heading font-semibold text-gray-900 text-[15px]">{s.title}</div>
            <div className="mt-1 text-sm text-gray-500 line-clamp-2">{s.prompt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
