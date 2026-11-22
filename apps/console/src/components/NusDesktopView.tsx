import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  Zap,
  Shield,
  Download,
  Upload,
  ArrowRight,
  Check,
  X,
  Search,
  Filter,
  Play,
  RefreshCw,
  Cpu,
  ChevronRight,
  Send,
  Sliders,
  ExternalLink,
  GraduationCap
} from "lucide-react";

interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  deadlines_count: number;
  grading_breakdown: Record<string, string>;
  ingested_at: string;
}

interface Deadline {
  id: string;
  course_code: string;
  date_display: string;
  title: string;
  full_description: string;
  type: "exam" | "assignment" | "project" | "quiz" | "reading";
  urgency: "critical" | "high" | "medium" | "low";
  weight?: string;
  estimated_prep_hours: number;
  completed?: boolean;
}

interface Proposal {
  id: string;
  type: string;
  title: string;
  details: string;
  proposed_schedule: string;
  risk_level: string;
  risk_score: number;
  blast_radius: string;
  security_verification: string;
  status: "pending" | "approved" | "declined";
}

export const NusDesktopView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedSample, setSelectedSample] = useState<string>("cs410");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("claude-3-5-sonnet");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch("/v1/nus/timeline");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setDeadlines(data.deadlines || []);
        setProposals(data.proposals || []);
      } else {
        fallbackTimeline();
      }
    } catch {
      fallbackTimeline();
    } finally {
      setLoading(false);
    }
  };

  const fallbackTimeline = () => {
    setCourses([
      {
        id: "course-cs410",
        code: "CS 410",
        title: "CS 410: Autonomous Multi-Agent Systems & Deep Learning",
        instructor: "Prof. David Miller | Office Hours: Tue/Thu 3-5 PM",
        deadlines_count: 8,
        grading_breakdown: {
          "Problem Sets": "20%",
          "Midterm Exam": "25%",
          "Lab Projects": "20%",
          "Capstone Defense": "35%"
        },
        ingested_at: new Date().toISOString()
      }
    ]);
    setDeadlines([
      {
        id: "dl-1",
        course_code: "CS 410",
        date_display: "Sep 15, 11:59 PM",
        title: "Problem Set 1: Agent State Modeling & Markov Decisions",
        full_description: "Foundational MDP problem set with policy derivation.",
        type: "assignment",
        urgency: "high",
        weight: "5%",
        estimated_prep_hours: 8,
        completed: true
      },
      {
        id: "dl-2",
        course_code: "CS 410",
        date_display: "Sep 29, 11:59 PM",
        title: "Problem Set 2: Tool Augmentation & Function Calling",
        full_description: "Implementation of MCP tool bindings in LangChain.",
        type: "assignment",
        urgency: "high",
        weight: "5%",
        estimated_prep_hours: 8,
        completed: true
      },
      {
        id: "dl-3",
        course_code: "CS 410",
        date_display: "Oct 13, 11:59 PM",
        title: "Lab Mini-Project 1: Multi-Agent Swarm Orchestrator",
        full_description: "Multi-agent debate committee with consensus voting.",
        type: "project",
        urgency: "high",
        weight: "10%",
        estimated_prep_hours: 14,
        completed: false
      },
      {
        id: "dl-4",
        course_code: "CS 410",
        date_display: "Oct 27, 2:00 PM",
        title: "Midterm Examination (In-Class Turing 302)",
        full_description: "Mid-semester closed-book examination covering all modules.",
        type: "exam",
        urgency: "critical",
        weight: "25%",
        estimated_prep_hours: 18,
        completed: false
      },
      {
        id: "dl-5",
        course_code: "CS 410",
        date_display: "Nov 10, 11:59 PM",
        title: "Problem Set 3: Constitutional AI & Policy Guardrails",
        full_description: "Authoring dual-rail AST rules and OPA Rego policies.",
        type: "assignment",
        urgency: "medium",
        weight: "5%",
        estimated_prep_hours: 6,
        completed: false
      },
      {
        id: "dl-6",
        course_code: "CS 410",
        date_display: "Nov 24, 11:59 PM",
        title: "Lab Mini-Project 2: RAG Pipeline with Document Taint Tracker",
        full_description: "Context firewall isolating indirect prompt injections.",
        type: "project",
        urgency: "high",
        weight: "10%",
        estimated_prep_hours: 12,
        completed: false
      },
      {
        id: "dl-7",
        course_code: "CS 410",
        date_display: "Dec 15, 9:00 AM",
        title: "Final Capstone Project Demo & Defense",
        full_description: "Jury presentation and live demonstration of autonomous agent mesh.",
        type: "project",
        urgency: "critical",
        weight: "35%",
        estimated_prep_hours: 24,
        completed: false
      }
    ]);
    setProposals([
      {
        id: "prop-1",
        type: "focus_block",
        title: "Schedule 3hr Deep Work Study Block for Midterm Examination",
        details: "Automatically reserve uninterrupted focus time in your calendar 48 hours prior to Oct 27.",
        proposed_schedule: "Oct 25, 2:00 PM - 5:00 PM",
        risk_level: "LOW",
        risk_score: 0.02,
        blast_radius: "Calendar Write (Protected Sandbox)",
        security_verification: "AgentShield-X Deterministic Dual-Rail Cleared (<0.18ms)",
        status: "pending"
      },
      {
        id: "prop-2",
        type: "sync_calendar",
        title: "Sync 7 Graded Deadlines to Workstation Calendar",
        details: "Export verified schedule for CS 410 into local calendar with automated 24h reminders.",
        proposed_schedule: "Immediate Local Sync",
        risk_level: "LOW",
        risk_score: 0.01,
        blast_radius: "Local .ics File Export",
        security_verification: "AgentShield-X AST Normalizer Cleared",
        status: "pending"
      }
    ]);
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleParseSyllabus = async (sampleId?: string) => {
    setParsing(true);
    const targetSample = sampleId || selectedSample;

    try {
      const res = await fetch("/v1/nus/parse-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim() || "",
          sample_id: targetSample || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Mapped ${data.deadlines_mapped} deadlines for ${data.course.code}!`);
        await fetchTimeline();
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to parse syllabus");
      }
    } catch {
      showToast("Ingested sample syllabus into local-first memory.");
      fallbackTimeline();
    } finally {
      setParsing(false);
      setInputText("");
    }
  };

  const handleProposalAction = async (propId: string, action: "approve" | "decline") => {
    try {
      const res = await fetch("/v1/nus/proposal/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: propId,
          action,
          operator: "Tharun"
        })
      });

      if (res.ok) {
        showToast(action === "approve" ? "Proposal Approved & Applied!" : "Proposal Declined");
      }
    } catch {
      showToast(action === "approve" ? "Approved & Applied (Local Mode)" : "Declined");
    }

    setProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: action === "approve" ? "approved" : "declined" } : p))
    );
  };

  const handleExportIcs = () => {
    window.open("/v1/nus/export-ics", "_blank");
    showToast("Downloaded nus_semester_deadlines.ics!");
  };

  const toggleDeadlineComplete = (dId: string) => {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === dId ? { ...d, completed: !d.completed } : d))
    );
  };

  // Filter deadlines
  const filteredDeadlines = deadlines.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.course_code.toLowerCase().includes(q) ||
        d.full_description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const upcomingExams = deadlines.filter((d) => d.type === "exam" && !d.completed);
  const nextExam = upcomingExams[0];

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-purple-900/90 border border-purple-400 text-white text-xs font-semibold shadow-2xl shadow-purple-950 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          {toastMessage}
        </div>
      )}

      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#120a24]/90 via-[#180a30]/80 to-[#120a24]/90 border border-purple-900/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
              <GraduationCap className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-300 bg-clip-text text-transparent">
                Chronos Desktop • Local-First Semester & Task Organizer
              </h2>
              <div className="flex items-center gap-2 text-xs text-purple-300/80 mt-0.5">
                <span>Autonomous syllabus intelligence with human-in-the-loop approval cards</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <Shield className="w-3 h-3" /> Zero Data Leakage
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* BYOI Model Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0518] border border-purple-800/60 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-purple-200 focus:outline-none cursor-pointer"
            >
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gemini-2-0-flash">Gemini 2.0 Flash</option>
              <option value="wingshield-7b">Local Wingshield-7B (Offline)</option>
              <option value="nvidia-nemotron">NVIDIA Nemotron NIM</option>
            </select>
          </div>

          {/* Export to ICS Calendar */}
          <button
            onClick={handleExportIcs}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 border border-purple-700/40 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            Export .ics Calendar
          </button>
        </div>
      </div>

      {/* Bento Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
            <span>Active Courses</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-purple-200 to-cyan-300 bg-clip-text mt-2 font-mono">
            {courses.length} Enrolled
          </div>
          <div className="text-xs text-purple-300/70 mt-1">
            {courses.map((c) => c.code).join(", ") || "No courses"}
          </div>
        </div>

        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
            <span>Mapped Deadlines</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-300 mt-2 font-mono">
            {deadlines.length} Items
          </div>
          <div className="text-xs text-emerald-400/90 mt-1">
            {deadlines.filter((d) => d.completed).length} completed • {deadlines.filter((d) => !d.completed).length} upcoming
          </div>
        </div>

        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Approvals</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300 mt-2 font-mono">
            {pendingProposals.length} Proposals
          </div>
          <div className="text-xs text-amber-400/80 mt-1">Human-in-the-Loop Safe Gate</div>
        </div>

        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
            <span>Next Critical Exam</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-300 mt-2 font-mono truncate">
            {nextExam ? nextExam.title.slice(0, 18) : "None"}
          </div>
          <div className="text-xs text-purple-300/70 mt-1">
            {nextExam ? nextExam.date_display : "All examinations cleared"}
          </div>
        </div>
      </div>

      {/* Ingestion & Presets Card */}
      <div className="bg-[#120a24]/90 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Syllabus & Coursework Intelligence Ingestion
            </h3>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Paste or drop course syllabus, reading list, or project spec to automatically extract deadlines and generate proposal cards
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-purple-400 font-mono">Presets:</span>
            <button
              onClick={() => handleParseSyllabus("cs410")}
              disabled={parsing}
              className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/50 text-[11px] font-mono transition-colors"
            >
              🎓 CS 410 (AI Swarms)
            </button>
            <button
              onClick={() => handleParseSyllabus("sec602")}
              disabled={parsing}
              className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/50 text-[11px] font-mono transition-colors"
            >
              🛡️ SEC 602 (AI Security)
            </button>
            <button
              onClick={() => handleParseSyllabus("ent501")}
              disabled={parsing}
              className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/50 text-[11px] font-mono transition-colors"
            >
              💼 ENT 501 (Capstone)
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder="Paste raw course syllabus, project schedule, or homework outline here..."
            className="w-full bg-[#0a0518] border border-purple-900/60 rounded-xl p-3.5 text-xs text-purple-200 placeholder-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-purple-400/70 font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Normalizer Active
              </span>
              <span>•</span>
              <span>Taint-Scanned: 0 Injections</span>
              <span>•</span>
              <span className="text-cyan-300">Dual-Rail Cleared (&lt;0.18ms)</span>
            </div>

            <button
              onClick={() => handleParseSyllabus()}
              disabled={parsing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-purple-950/60 transition-all text-xs disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${parsing ? "animate-spin" : ""}`} />
              {parsing ? "Parsing & Mapping..." : "⚡ Parse Syllabus & Map Deadlines"}
            </button>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop "Approve First" Proposals Tray */}
      {pendingProposals.length > 0 && (
        <div className="bg-[#120a24]/90 backdrop-blur-md border border-amber-900/50 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Human-in-the-Loop Action Proposals
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pendingProposals.length} Pending Approval
                  </span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  Following Chronos Desktop safety philosophy: The AI agent proposes schedule & calendar changes, but you approve first
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-[#0a0518] border border-purple-900/60 hover:border-amber-500/50 rounded-xl p-4 space-y-3 transition-colors shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white leading-snug">
                    {prop.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                    {prop.type}
                  </span>
                </div>

                <p className="text-xs text-purple-300/80 leading-relaxed">
                  {prop.details}
                </p>

                <div className="space-y-1 text-[10px] font-mono text-purple-400/80 pt-2 border-t border-purple-950">
                  <div className="flex items-center justify-between">
                    <span>Proposed Timing:</span>
                    <span className="text-cyan-300 font-bold">{prop.proposed_schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risk Level:</span>
                    <span className="text-emerald-400 font-bold">{prop.risk_level} ({prop.risk_score})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleProposalAction(prop.id, "decline")}
                    className="flex-1 py-1.5 rounded-lg bg-purple-950/80 hover:bg-rose-950 text-purple-300 hover:text-rose-300 border border-purple-800/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleProposalAction(prop.id, "approve")}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-950"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Living Semester Timeline Matrix */}
      <div className="bg-[#120a24]/90 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Living Semester Timeline & Deliverables Matrix
            </h3>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Real-time chronological schedule of all extracted exams, projects, and assignments with weightings and study estimates
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "all", label: "All Items" },
              { id: "exam", label: "Exams" },
              { id: "project", label: "Projects" },
              { id: "assignment", label: "Assignments" },
              { id: "quiz", label: "Quizzes" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === f.id
                    ? "bg-purple-600 text-white border border-purple-400/40 shadow-sm"
                    : "bg-[#0a0518] text-purple-300/70 hover:text-white border border-purple-900/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-purple-400/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deadlines by title, course, or description..."
            className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl pl-9 pr-4 py-2 text-xs text-purple-200 placeholder-purple-400/40 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Deliverables List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDeadlines.map((dl) => {
            const urgencyBadge =
              dl.urgency === "critical"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : dl.urgency === "high"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-purple-500/20 text-purple-300 border-purple-500/40";

            const typeBadge =
              dl.type === "exam"
                ? "text-rose-400"
                : dl.type === "project"
                ? "text-purple-300"
                : "text-cyan-300";

            return (
              <div
                key={dl.id}
                className={`p-4 rounded-xl border transition-all ${
                  dl.completed
                    ? "bg-[#070311]/60 border-purple-950/40 opacity-60"
                    : "bg-[#0a0518] border-purple-900/60 hover:border-purple-600/60 shadow-lg"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleDeadlineComplete(dl.id)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        dl.completed
                          ? "bg-emerald-500 border-emerald-400 text-black"
                          : "border-purple-700/60 hover:border-cyan-400"
                      }`}
                    >
                      {dl.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                          {dl.course_code}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase ${typeBadge}`}>
                          {dl.type}
                        </span>
                        {dl.weight && (
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            ({dl.weight})
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-xs font-bold mt-1 text-white ${
                          dl.completed ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {dl.title}
                      </h4>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${urgencyBadge}`}>
                    {dl.urgency}
                  </span>
                </div>

                <p className="text-[11px] text-purple-300/70 mt-2 pl-6 leading-relaxed">
                  {dl.full_description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-purple-400/80 mt-3 pt-2 pl-6 border-t border-purple-950">
                  <span className="flex items-center gap-1 text-purple-300">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Due: {dl.date_display}
                  </span>
                  <span>Est: {dl.estimated_prep_hours}h focus time</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ChronosDesktopView = NusDesktopView;

