import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SapLogo } from "@/components/SapLogo";
import { ArrowRight, Code2, MessageSquareCode, Mic, History, Sparkles, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F7F8]" data-testid="landing-page">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <SapLogo size="md" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" data-testid="nav-login-button" className="font-medium">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button data-testid="nav-register-button" className="bg-[#008FD3] hover:bg-[#0073AA] text-white rounded-md font-medium">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-full bg-white text-xs font-medium text-gray-700 mb-8" data-testid="hero-badge">
            <Sparkles className="w-3.5 h-3.5 text-[#008FD3]" />
            AI-powered assistant for SAP developers
          </div>
          <h1 className="font-heading text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05]">
            Your AI pair-programmer<br />
            for <span className="text-[#008FD3]">SAP ABAP</span> development.
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
            From SELECT queries to RAP behavior definitions — chat, dictate by voice, and ship cleaner ABAP code,
            faster. Built for SAP developers who want a real Copilot in their workflow.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/register">
              <Button size="lg" data-testid="hero-cta-button" className="bg-[#008FD3] hover:bg-[#0073AA] text-white rounded-md text-base px-7 h-12 font-medium">
                Start coding free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" data-testid="hero-signin-button" className="rounded-md text-base px-7 h-12 border-gray-300 font-medium">
                I have an account
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
            <Stat label="ABAP-tuned" value="100%" />
            <Stat label="Languages" value="ABAP+12" />
            <Stat label="Voice ready" value="Yes" />
          </div>
        </div>

        {/* Mock chat preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-8">
          <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden" data-testid="hero-preview">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-2 bg-gray-50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-500 font-medium">sap-copilot — chat</span>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-end">
                <div className="bg-[#008FD3] text-white rounded-md px-3 py-2 max-w-[80%]">
                  Write a SELECT for active customers in MARA
                </div>
              </div>
              <div className="text-gray-700">Here is an optimized SELECT using modern ABAP syntax:</div>
              <pre className="bg-[#0b1020] text-gray-100 text-xs p-3 rounded-md overflow-x-auto font-mono-jb">
{`SELECT matnr, mtart, meins
  FROM mara
  WHERE lvorm = ''
  INTO TABLE @DATA(lt_mara).`}
              </pre>
              <div className="text-gray-600 text-xs">Use `@DATA` for inline typing. Add an `ORDER BY` if needed.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="font-heading text-3xl font-bold text-gray-900 max-w-2xl">
            Everything an ABAP developer needs, in one chat.
          </h2>
          {/* */}
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200 rounded-md overflow-hidden">
            <Feature icon={<Code2 className="w-5 h-5" />} title="ABAP-fluent answers" desc="Modern ABAP 7.5+, CDS views, AMDP, RAP — explained and generated cleanly." />
            <Feature icon={<MessageSquareCode className="w-5 h-5" />} title="Microsoft Copilot UX" desc="Familiar split-pane layout: history on the left, focused chat on the right." />
            <Feature icon={<Mic className="w-5 h-5" />} title="Voice-to-prompt" desc="Hit the mic, dictate your question. Browser speech-to-text, no setup." />
            <Feature icon={<History className="w-5 h-5" />} title="Chat history" desc="Every conversation saved. Pick up where you left off, switch threads instantly." />
            <Feature icon={<Sparkles className="w-5 h-5" />} title="Suggested prompts" desc="Curated ABAP starter prompts: BAPI, FORM-to-METHOD, SELECT optimisation." />
            <Feature icon={<Zap className="w-5 h-5" />} title="Streaming responses" desc="Tokens stream in real-time over SSE — no waiting for the full answer." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F7F7F8] border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-heading text-4xl font-bold text-gray-900">Ready to ship better ABAP?</h2>
          <p className="mt-4 text-gray-600 text-lg">Sign up in 30 seconds. No credit card required.</p>
          <Link to="/register">
            <Button size="lg" data-testid="bottom-cta-button" className="mt-8 bg-[#008FD3] hover:bg-[#0073AA] text-white rounded-md text-base px-8 h-12 font-medium">
              Create my account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <SapLogo size="sm" />
          <span>© 2026 SAP Copilot · An AI assistant for ABAP developers</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-heading text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 rounded-md bg-[#008FD3]/10 text-[#008FD3] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 font-heading font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}
