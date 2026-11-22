import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiUrl } from "../lib/api";

type PullState = "open" | "closed" | "all";
type Pull = { number: number; title: string; url: string };
type GoogleMessage = { id: string; from: string; subject: string; date: string };
type CalendarEvent = { id: string; summary: string; start?: string; end?: string; url?: string };
type GitHubAction = { method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; endpoint: string; query: Record<string, string | number | boolean>; body: Record<string, unknown> };
type Approval = { id: string; repository: string; action: GitHubAction; expiresAt: string };
type Message = { prompt: string; state?: PullState; fetchedAt?: string; answer?: string; model?: string; result?: { repository: string; pull_requests: Pull[] }; approval?: Approval; error?: string };

async function request<T>(path: string, session: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Authorization: `Bearer ${session}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    if (response.status === 401) throw new Error("Sign in with your AgentShield email and password to use live tools.");
    throw new Error(typeof error?.detail === "string" ? error.detail : "The connector request failed.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function WorkspaceStudio({ session, workspace }: { session: string; workspace: string }) {
  const { pathname } = useLocation();
  const path = `/v1/shieldwing/workspaces/${encodeURIComponent(workspace)}/github`;
  const [repository, setRepository] = useState<string | null>(null);
  const [authorizedScopes, setAuthorizedScopes] = useState<string[]>([]);
  const [googleServices, setGoogleServices] = useState<string[]>([]);
  const [googleStatus, setGoogleStatus] = useState("");
  const [googleMessages, setGoogleMessages] = useState<GoogleMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [repoInput, setRepoInput] = useState("");
  const [credential, setCredential] = useState("");
  const [authorizeRepositoryAccess, setAuthorizeRepositoryAccess] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [accessFailed, setAccessFailed] = useState(false);
  const [busy, setBusy] = useState(true);
  const showTools = ["/connected-tools", "/connect", "/tools", "/integrations", "/channels"].includes(pathname);

  useEffect(() => {
    const controller = new AbortController();
    request<{ repository: string | null; authorized_scopes: string[] }>(path, session, { signal: controller.signal })
      .then((result) => { setRepository(result.repository); setAuthorizedScopes(result.authorized_scopes); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    request<{ services: string[]; status: string }>(`${path.replace(/\/github$/, "/google")}`, session, { signal: controller.signal })
      .then((result) => {
        setGoogleServices(result.services);
        if (result.status === "reauthorization_required") setGoogleStatus("Google access expired or was revoked. Reconnect to continue.");
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    const callbackStatus = new URLSearchParams(window.location.search).get("google");
    if (callbackStatus) setGoogleStatus(callbackStatus === "connected" ? "Google account connected." : `Google authorization: ${callbackStatus}.`);
    return () => controller.abort();
  }, [path, session]);

  async function connectGoogle(services: string[]) {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ authorization_url: string }>(`${path.replace(/\/github$/, "/google/authorize")}`, session, {
        method: "POST", body: JSON.stringify({ services }),
      });
      window.location.assign(result.authorization_url);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function disconnectGoogle() {
    setBusy(true);
    try {
      await request<{ disconnected: boolean }>(path.replace(/\/github$/, "/google"), session, { method: "DELETE" });
      setGoogleServices([]);
      setGoogleMessages([]);
      setCalendarEvents([]);
      setGoogleStatus("Google account disconnected.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadGmail() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ messages: GoogleMessage[] }>(`${path.replace(/\/github$/, "/google/gmail/messages")}`, session);
      setGoogleMessages(result.messages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadCalendar() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ events: CalendarEvent[] }>(`${path.replace(/\/github$/, "/google/calendar/events")}`, session);
      setCalendarEvents(result.events);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    if (!authorizeRepositoryAccess) {
      setError("Confirm the repository access described below before connecting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request<{ repository: string; authorized_scopes: string[] }>(path, session, {
        method: "PUT",
        body: JSON.stringify({ repository: repoInput.trim(), token: credential.trim(), authorization_confirmed: authorizeRepositoryAccess }),
      });
      setRepository(result.repository);
      setAuthorizedScopes(result.authorized_scopes);
      setRepoInput("");
      setAuthorizeRepositoryAccess(false);
      setMessages([]);
      setAccessFailed(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCredential("");
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await request<void>(path, session, { method: "DELETE" });
      setRepository(null);
      setAuthorizedScopes([]);
      setMessages([]);
      setAccessFailed(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send(query: string, refreshIndex?: number) {
    if (!query.trim() || busy) return;
    const text = query.trim();
    setPrompt("");
    const stateMatch = /\b(open|closed|all)\b/i.exec(text);
    const state = (stateMatch?.[1]?.toLowerCase() ?? "open") as PullState;
    setBusy(true);
    function show(message: Message) {
      setMessages((current) => refreshIndex === undefined
        ? [...current, message]
        : current.map((previous, index) => index === refreshIndex ? message : previous));
    }
    const priorMessages = refreshIndex === undefined ? messages : messages.slice(0, refreshIndex);
    try {
      const result = await request<{
        approval_required?: boolean;
        approval_id?: string;
        action?: GitHubAction;
        expires_at?: string;
        message: string;
        repository: string;
        pull_requests: Pull[];
        pull_request_state?: PullState;
        model: string;
        tool_calls: Array<{ name: string; status: string }>;
      }>(`${path}/chat`, session, {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: priorMessages
            .filter((item) => item.answer && !item.error)
            .flatMap((item) => [
              { role: "user", content: item.prompt },
              { role: "assistant", content: item.answer },
            ])
            .slice(-12),
        }),
      });
      if (result.approval_required && result.approval_id && result.action && result.expires_at) {
        show({
          prompt: text,
          model: result.model,
          approval: {
            id: result.approval_id,
            repository: result.repository,
            action: result.action,
            expiresAt: result.expires_at,
          },
        });
        return;
      }
      show({
        prompt: text,
        answer: result.message,
        result: result.tool_calls.length > 0
          ? { repository: result.repository, pull_requests: result.pull_requests }
          : undefined,
        state: result.pull_request_state,
        model: result.model,
        fetchedAt: new Date().toISOString(),
      });
      setAccessFailed(false);
    } catch (err) {
      setAccessFailed(true);
      show({ prompt: text, state, error: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function decideAction(index: number, approve: boolean) {
    const pending = messages[index]?.approval;
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<{
        approved: boolean;
        message: string;
        repository?: string;
        action?: GitHubAction;
        http_status?: number;
        pull_requests?: Pull[];
        pull_request_state?: PullState;
        model?: string;
      }>(`${path}/actions/${encodeURIComponent(pending.id)}/decision`, session, {
        method: "POST",
        body: JSON.stringify({ approve }),
      });
      setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? {
        ...item,
        approval: undefined,
        answer: result.message,
        model: result.model ?? item.model,
        fetchedAt: result.approved ? new Date().toISOString() : undefined,
        result: result.approved && result.pull_requests ? {
          repository: result.repository ?? pending.repository,
          pull_requests: result.pull_requests,
        } : undefined,
        state: result.pull_request_state ?? item.state,
      } : item));
    } catch (err) {
      setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? {
        ...item, approval: undefined, error: (err as Error).message,
      } : item));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="my-6 flex gap-4 text-violet-300">
        <Link to="/shieldwing" aria-current={!showTools ? "page" : undefined}>Chat</Link>
        <Link to="/connected-tools" aria-current={showTools ? "page" : undefined}>Connected tools</Link>
      </nav>
      {error && <p role="alert" className="mb-4 text-rose-300">{error}</p>}
      {showTools ? (
        <div className="space-y-4">
        <section className="space-y-4 rounded-xl border border-violet-900 p-5">
          <h2 className="text-xl font-semibold">GitHub</h2>
          <p>{repository ? `${repository} · ${accessFailed ? "Last request failed" : "Connected"}` : "Connect one repository with a fine-grained personal access token."}</p>
          {repository && <p className="text-sm text-slate-300">AgentShield connector: {authorizedScopes.map((scope) => scope.replaceAll("_", " ")).join(", ") || "repository API"}. GitHub enforces the permissions granted to the token.</p>}
          {repository && <button disabled={busy} onClick={() => void disconnect()} className="text-violet-300">Disconnect</button>}
          <form onSubmit={connect} className="grid max-w-md gap-3">
            <label htmlFor="github-repo">Repository</label>
            <input id="github-repo" required placeholder="owner/repo or https://github.com/owner/repo" value={repoInput} onChange={(event) => setRepoInput(event.target.value)} className="rounded bg-slate-900 p-2" />
            <label htmlFor="github-credential">GitHub personal access token</label>
            <input id="github-credential" required maxLength={512} type="password" placeholder="github_pat_… or ghp_…" autoComplete="off" value={credential} onChange={(event) => setCredential(event.target.value)} className="rounded bg-slate-900 p-2" />
            <div className="rounded border border-violet-800 bg-slate-950 p-3 text-sm">
              <p className="font-semibold">Requested access</p>
              <ul className="mt-1 list-inside list-disc text-slate-300">
                <li>Only the repository entered above</li>
                <li>Repository API read and write actions, limited by this token’s actual GitHub permissions</li>
                <li>Each action displays its exact method, path, query, and body for one time approval</li>
                <li>Account and organization administration, secrets, Actions, hooks, keys, collaborator management, branch protection, and repository deletion are blocked</li>
              </ul>
              <p className="mt-2 text-xs text-slate-400">Fine-grained tokens are recommended: restrict one to this repository and grant only the permissions needed for your tasks. Classic ghp_ tokens are accepted but can have broader access. AgentShield stores the token encrypted on the server and sends it only to GitHub. GitHub enforces the token's permissions.</p>
              <label className="mt-3 flex items-start gap-2">
                <input type="checkbox" checked={authorizeRepositoryAccess} onChange={(event) => setAuthorizeRepositoryAccess(event.target.checked)} />
                <span>I authorize AgentShield-X to use repository-scoped read and write API actions, with one time approval for every action.</span>
              </label>
            </div>
            <button disabled={busy || !authorizeRepositoryAccess} className="rounded bg-violet-700 p-2 disabled:opacity-50">{repository ? "Verify and replace connection" : "Authorize and connect"}</button>
          </form>
        </section>
        <section className="space-y-4 rounded-xl border border-violet-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Google Workspace</h2>
              <p className="text-sm text-slate-300">Choose Gmail and Calendar separately. Google shows its own consent screen before AgentShield receives access.</p>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
                <li>Gmail: read headers for unread messages only; no message body, send, or draft access.</li>
                <li>Calendar: read upcoming events on calendars you own; no event changes.</li>
              </ul>
              {googleServices.length > 0 && <p className="mt-1 text-sm text-emerald-300">Authorized services: {googleServices.join(", ")}</p>}
              {googleStatus && <p role="status" className="mt-1 text-sm text-violet-300">{googleStatus}</p>}
            </div>
            {googleServices.length > 0 && <button disabled={busy} onClick={() => void disconnectGoogle()} className="text-sm text-rose-300 disabled:opacity-50">Disconnect Google</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => void connectGoogle(["gmail"])} className="rounded bg-violet-700 px-4 py-2 disabled:opacity-50">{googleServices.includes("gmail") ? "Review Gmail access" : "Connect Gmail"}</button>
            <button disabled={busy} onClick={() => void connectGoogle(["calendar"])} className="rounded bg-violet-700 px-4 py-2 disabled:opacity-50">{googleServices.includes("calendar") ? "Review Calendar access" : "Connect Calendar"}</button>
            {googleServices.includes("gmail") && <button disabled={busy} onClick={() => void loadGmail()} className="rounded border border-violet-700 px-4 py-2 disabled:opacity-50">Load unread email</button>}
            {googleServices.includes("calendar") && <button disabled={busy} onClick={() => void loadCalendar()} className="rounded border border-violet-700 px-4 py-2 disabled:opacity-50">Load upcoming events</button>}
          </div>
          {googleMessages.length > 0 && (
            <div className="space-y-2"><h3 className="font-semibold">Unread messages</h3>
              {googleMessages.map((message) => <article key={message.id} className="rounded border border-slate-800 p-3"><p className="font-semibold">{message.subject || "(no subject)"}</p><p className="text-xs text-slate-400">{message.from} · {message.date}</p></article>)}
            </div>
          )}
          {calendarEvents.length > 0 && (
            <div className="space-y-2"><h3 className="font-semibold">Upcoming events</h3>
              {calendarEvents.map((event) => <article key={event.id} className="rounded border border-slate-800 p-3"><p className="font-semibold">{event.summary}</p><p className="text-sm text-slate-300">{event.start}</p></article>)}
            </div>
          )}
        </section>
        </div>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-slate-300">Ask ShieldWing to read or change data in the connected repository. Every GitHub API action must be approved once.</p>
          {!repository && !busy && <Link className="text-violet-300" to="/connected-tools">Connect GitHub to get started</Link>}
          {messages.map((message, index) => (
            <article className="rounded-xl border border-violet-900 p-4" key={index}>
              <p className="mb-3 font-semibold">{message.prompt}</p>
              {message.error && <p role="alert" className="text-rose-300">{message.error}</p>}
              {message.approval && (
                <div className="my-4 rounded-lg border border-amber-500/50 bg-amber-950/30 p-4" role="group" aria-label="Approve connector action">
                  <h3 className="font-semibold text-amber-200">ShieldWing requests a GitHub action</h3>
                  <p className="mt-2 text-sm"><strong>{message.approval.action.method}</strong> <code>/repos/{message.approval.repository}{message.approval.action.endpoint}</code></p>
                  {Object.keys(message.approval.action.query).length > 0 && <pre className="mt-2 overflow-auto rounded bg-slate-950 p-2 text-xs">Query: {JSON.stringify(message.approval.action.query, null, 2)}</pre>}
                  {Object.keys(message.approval.action.body).length > 0 && <pre className="mt-2 max-h-56 overflow-auto rounded bg-slate-950 p-2 text-xs">Body: {JSON.stringify(message.approval.action.body, null, 2)}</pre>}
                  <p className="mt-1 text-sm text-slate-300">Only this action is approved; approval expires at {new Date(message.approval.expiresAt).toLocaleTimeString()}. GitHub may reject it if the token lacks the required permission.</p>
                  <div className="mt-3 flex gap-3">
                    <button type="button" disabled={busy} onClick={() => void decideAction(index, true)} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Allow once</button>
                    <button type="button" disabled={busy} onClick={() => void decideAction(index, false)} className="rounded border border-slate-500 px-4 py-2 text-sm disabled:opacity-50">Deny</button>
                  </div>
                </div>
              )}
              {message.answer && <p className="my-3 whitespace-pre-wrap">{message.answer}</p>}
              {message.model && <p className="text-xs text-slate-400">Answered with {message.model}</p>}
              {message.fetchedAt && (
                <time className="text-sm text-slate-300" dateTime={message.fetchedAt}>
                  Fetched {new Date(message.fetchedAt).toLocaleString()}
                </time>
              )}
              {(message.result || message.state) && (
                <button type="button" disabled={busy || !repository} onClick={() => void send(message.prompt, index)} className="ml-3 text-sm text-violet-300 disabled:opacity-50">
                  Refresh results
                </button>
              )}
              {message.result && (
                <>
                  <p>{message.result.repository} · {message.result.pull_requests.length === 20 ? "Showing 20" : message.result.pull_requests.length} {message.state === "all" ? "" : message.state} pull requests</p>
                  <ul className="mt-2 space-y-2">
                    {message.result.pull_requests.map((pull) => (
                      <li key={pull.number}><a className="text-violet-300" href={pull.url} target="_blank" rel="noreferrer">#{pull.number} {pull.title}</a></li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          ))}
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(prompt); }}>
            <input aria-label="Message to ShieldWing" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Summarize the open pull requests" className="min-w-0 flex-1 rounded bg-slate-900 p-2" />
            <button type="submit" disabled={busy || !repository || !prompt.trim()} className="rounded bg-violet-700 px-4 disabled:opacity-50">Send</button>
          </form>
          <button disabled={busy || !repository} onClick={() => void send("List open pull requests")} className="text-violet-300 disabled:opacity-50">Summarize open pull requests</button>
          {busy && <p role="status">Waiting for the server…</p>}
        </section>
      )}
    </>
  );
}

export function ShieldWingStudio() {
  const { token, org, user, isLoading } = useAuth();
  return (
    <main className="min-h-screen bg-[#0a0518] px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link to="/wing" className="text-sm text-violet-300">Back to ShieldWing</Link>
        <h1 className="mt-2 text-3xl font-semibold">ShieldWing Studio</h1>
        {token && org ? <WorkspaceStudio key={JSON.stringify([user?.id, org.id])} session={token} workspace={org.id} /> :
          <p className="mt-4">{isLoading ? "Loading workspace…" : "Sign in to an AgentShield workspace to use live tools."}</p>}
      </div>
    </main>
  );
}
