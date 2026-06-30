from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, AsyncGenerator
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
import asyncio
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Config
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
JWT_EXPIRY_DAYS = 7
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

SYSTEM_PROMPT = """You are SAP Copilot, an expert AI assistant specialized in helping SAP ABAP developers.

Your expertise covers:
- ABAP language (classical and modern ABAP 7.5+ / Cloud syntax)
- Open SQL, ABAP Objects, CDS Views, AMDP
- SAP UI5 / Fiori, BAPI, BADI, RFC, ALV, Smart Forms
- SAP S/4HANA, RAP (RESTful ABAP Programming Model), CAP
- Performance tuning, code refactoring, debugging

Behavior:
- Write idiomatic, clean ABAP code with proper data declarations.
- ALWAYS wrap ABAP code in fenced code blocks with the `abap` language tag, e.g. ```abap ... ```.
- Explain concepts clearly and concisely.
- When asked about non-ABAP topics, gently redirect to ABAP/SAP context if relevant, or assist briefly.
- Use Markdown formatting for structure (headings, lists, bold for emphasis)."""

# FastAPI app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ============ Models ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: str
    email: str
    name: str

class AuthResponse(BaseModel):
    token: str
    user: UserPublic

class ChatSession(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionUpdate(BaseModel):
    title: str

class Message(BaseModel):
    id: str
    session_id: str
    role: str  # "user" | "assistant"
    content: str
    created_at: str

class MessageCreate(BaseModel):
    content: str


# ============ Helpers ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing auth token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload.get("sub")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ============ Auth Routes ============
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(body: UserRegister):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id)
    return AuthResponse(token=token, user=UserPublic(id=user_id, email=doc["email"], name=doc["name"]))

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(body: UserLogin):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return AuthResponse(token=token, user=UserPublic(id=user["id"], email=user["email"], name=user["name"]))

@api_router.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return UserPublic(id=user["id"], email=user["email"], name=user["name"])


# ============ Chat Sessions ============
@api_router.get("/sessions", response_model=List[ChatSession])
async def list_sessions(user: dict = Depends(get_current_user)):
    sessions = await db.sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return sessions

@api_router.post("/sessions", response_model=ChatSession)
async def create_session(body: ChatSessionCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": body.title or "New Chat",
        "created_at": now,
        "updated_at": now,
    }
    await db.sessions.insert_one(doc)
    return ChatSession(**doc)

@api_router.patch("/sessions/{session_id}", response_model=ChatSession)
async def update_session(session_id: str, body: ChatSessionUpdate, user: dict = Depends(get_current_user)):
    res = await db.sessions.find_one_and_update(
        {"id": session_id, "user_id": user["id"]},
        {"$set": {"title": body.title, "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Session not found")
    return res

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    res = await db.sessions.delete_one({"id": session_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.messages.delete_many({"session_id": session_id})
    return {"ok": True}

@api_router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def list_messages(session_id: str, user: dict = Depends(get_current_user)):
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = await db.messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return msgs


# ============ Chat / Streaming ============
@api_router.post("/sessions/{session_id}/chat")
async def chat_stream(session_id: str, body: MessageCreate, user: dict = Depends(get_current_user)):
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_msg_id,
        "session_id": session_id,
        "role": "user",
        "content": body.content,
        "created_at": now,
    }
    await db.messages.insert_one(user_doc)

    # Build chat history for context
    history = await db.messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)

    # Auto-update title from first user message
    if sess.get("title") == "New Chat":
        new_title = body.content.strip()[:50]
        if len(body.content) > 50:
            new_title += "..."
        await db.sessions.update_one({"id": session_id}, {"$set": {"title": new_title}})

    assistant_msg_id = str(uuid.uuid4())

    async def event_generator() -> AsyncGenerator[bytes, None]:
        # Send user message ack
        yield f"data: {json.dumps({'type': 'user_msg', 'id': user_msg_id})}\n\n".encode()
        yield f"data: {json.dumps({'type': 'assistant_start', 'id': assistant_msg_id})}\n\n".encode()

        full_text = ""
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=SYSTEM_PROMPT,
            ).with_model("gemini", "gemini-3-flash-preview")

            # Compose context: include prior conversation summary in the user message
            context_str = ""
            for m in history[:-1]:  # exclude current user msg (already added)
                role_label = "User" if m["role"] == "user" else "Assistant"
                context_str += f"\n{role_label}: {m['content']}\n"

            if context_str:
                composed = f"Prior conversation:\n{context_str}\n\nCurrent question:\n{body.content}"
            else:
                composed = body.content

            async for ev in chat.stream_message(UserMessage(text=composed)):
                if isinstance(ev, TextDelta):
                    full_text += ev.content
                    yield f"data: {json.dumps({'type': 'delta', 'content': ev.content})}\n\n".encode()
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.exception("LLM stream error")
            err_text = f"\n\n*Error: {str(e)}*"
            full_text += err_text
            yield f"data: {json.dumps({'type': 'delta', 'content': err_text})}\n\n".encode()

        # Persist assistant message
        assistant_doc = {
            "id": assistant_msg_id,
            "session_id": session_id,
            "role": "assistant",
            "content": full_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.messages.insert_one(assistant_doc)
        await db.sessions.update_one(
            {"id": session_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )

        yield f"data: {json.dumps({'type': 'done', 'id': assistant_msg_id})}\n\n".encode()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@api_router.get("/")
async def root():
    return {"message": "SAP Copilot API"}


# ============ Image Generation (Gemini Nano Banana) ============
class ImageGenRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None  # if set, attach image as an assistant message


@api_router.post("/generate-image")
async def generate_image(body: ImageGenRequest, user: dict = Depends(get_current_user)):
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt required")

    try:
        img_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"img-{uuid.uuid4()}",
            system_message="You are an image generation assistant for SAP/ABAP developers. Generate clean, technical, diagram-style illustrations.",
        ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

        text, images = await img_chat.send_message_multimodal_response(UserMessage(text=body.prompt))
        if not images:
            raise HTTPException(status_code=502, detail="No image returned by model")

        img = images[0]
        data_url = f"data:{img['mime_type']};base64,{img['data']}"

        # Optionally attach as a message in a chat session
        if body.session_id:
            sess = await db.sessions.find_one({"id": body.session_id, "user_id": user["id"]})
            if sess:
                now = datetime.now(timezone.utc).isoformat()
                # user message describing request
                await db.messages.insert_one({
                    "id": str(uuid.uuid4()),
                    "session_id": body.session_id,
                    "role": "user",
                    "content": f"[image] {body.prompt}",
                    "created_at": now,
                })
                # assistant message with embedded markdown image
                assistant_md = (text + "\n\n" if text else "") + f"![generated image]({data_url})"
                await db.messages.insert_one({
                    "id": str(uuid.uuid4()),
                    "session_id": body.session_id,
                    "role": "assistant",
                    "content": assistant_md,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                # update title if default
                if sess.get("title") == "New Chat":
                    await db.sessions.update_one(
                        {"id": body.session_id},
                        {"$set": {"title": f"Image: {body.prompt[:42]}{'...' if len(body.prompt) > 42 else ''}",
                                   "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                else:
                    await db.sessions.update_one(
                        {"id": body.session_id},
                        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
                    )

        return {
            "image": data_url,
            "mime_type": img['mime_type'],
            "text": text or "",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Image generation error")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


# ============ SAP Help Search ============
@api_router.get("/sap-help")
async def sap_help(q: str, user: dict = Depends(get_current_user)):
    q = (q or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query required")

    api = (
        "https://help.sap.com/http.svc/elasticsearch"
        f"?area=content&version=&language=en-US&state=PRODUCTION"
        f"&q={quote_plus(q)}&advancedSearch=0&excludeNotSearchable=1&to=6&from=0"
    )
    fallback_url = f"https://help.sap.com/docs/search?q={quote_plus(q)}"

    results = []
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }) as http_client:
            r = await http_client.get(api)
            r.raise_for_status()
            data = r.json()
            items = (data.get("data", {}) or {}).get("results", []) or []
            for it in items[:6]:
                rel = it.get("url", "")
                full_url = rel if rel.startswith("http") else f"https://help.sap.com{rel}"
                # Strip HTML tags from snippet
                raw_snippet = it.get("snippet", "") or ""
                snippet_clean = BeautifulSoup(raw_snippet, "lxml").get_text(" ", strip=True)[:260]
                results.append({
                    "title": it.get("title", "").strip(),
                    "url": full_url,
                    "snippet": snippet_clean,
                    "deliverable": it.get("deliverableTitle", ""),
                    "date": it.get("date", ""),
                })
    except Exception as e:
        logger.warning(f"SAP help search error: {e}")

    return {
        "query": q,
        "results": results,
        "search_url": fallback_url,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
