# PRD — SAP Copilot (ABAP AI Copilot)

## Original Problem Statement
> make an abap ai copilot that has dashboard like new chat option history of chat that can home login interface like microsoft co pilot design to abap coder in sap with sap logo use gemini api key to give prompt add word to speech text and clone of copilot helping in sap

## User Choices (defaults applied)
- LLM: Emergent Universal Key + **Gemini 3 Flash** (`gemini-3-flash-preview`)
- Auth: JWT-based custom (email/password)
- Speech-to-text: Browser Web Speech API (no extra key)

## User Personas
- **SAP ABAP developer (mid–senior)** — uses the Copilot for ABAP snippets (SELECT, BAPI, CDS, RAP), explanations and debugging.
- **SAP trainee / consultant** — uses suggested-prompt cards as a learning path.

## Architecture
- **Backend** FastAPI + MongoDB (motor). JWT via PyJWT + bcrypt. Streaming via SSE with `emergentintegrations.llm.chat.LlmChat`.
- **Frontend** React 19 + React Router + Tailwind + Shadcn UI + lucide-react + Sonner toasts. Custom minimal markdown renderer with ABAP syntax highlighting.

## Core Requirements (static)
1. Microsoft Copilot-style dashboard: left sidebar (chat history + new chat + user) + main chat area.
2. Streaming AI chat tuned for ABAP (system prompt ABAP-specialised).
3. Voice input via Web Speech API (mic toggle in prompt bar).
4. JWT auth: register, login, protected dashboard.
5. SAP-style logo (typography only, no image).

## Implemented (2026-02)
- ✅ Backend: `/api/auth/{register,login,me}`, `/api/sessions` CRUD, `/api/sessions/{id}/messages`, SSE `/api/sessions/{id}/chat`
- ✅ Backend: `/api/generate-image` (Gemini Nano Banana) + `/api/sap-help` (help.sap.com elasticsearch)
- ✅ Frontend pages: Landing, Login, Register, Dashboard (`/app`, `/app/:sessionId`)
- ✅ Components: Sidebar, ChatArea, MessageBubble (markdown + ABAP highlight + copy/download code), PromptInput, EmptyState (6 ABAP prompts), SapHelpDialog, ImageGenDialog
- ✅ Image generation (attached to chat or stand-alone download)
- ✅ SAP Help portal search with real help.sap.com URLs
- ✅ "Analyse · client ready" one-click code review on assistant messages
- ✅ Export chat to .md + Download single code blocks
- ✅ Streaming SSE; voice input (Web Speech API); auto session-title; per-user isolation
- ✅ Fixed: first-message streaming on a brand-new session (used history.replaceState to avoid ChatArea remount)
- ✅ Tested end-to-end — 100% pass

## Backlog (P1/P2)
- P1: Stop-streaming button, regenerate response
- P1: Edit message / branching conversations
- P2: Multi-language voice (currently en-US)
- P2: Export chat as `.abap` / `.md`
- P2: ABAP linter integration (ATC-style hints)
- P2: Workspace / team sharing
- P2: Mobile sidebar drawer (mobile is functional, not optimised)

## Next Tasks
- Collect user feedback on the empty-state prompts
- Consider Stripe billing for Pro tier (suggested in finish summary)
