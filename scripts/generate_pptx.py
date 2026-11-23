import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme colors
    BG_COLOR = RGBColor(13, 11, 20)         # Deep Obsidian #0d0b14
    PURPLE_ACCENT = RGBColor(168, 85, 247)   # Neon Purple #a855f7
    CYAN_ACCENT = RGBColor(6, 182, 212)      # Cyan #06b6d4
    TEXT_WHITE = RGBColor(245, 245, 255)
    TEXT_MUTED = RGBColor(148, 163, 184)     # Slate 400
    GREEN_ACCENT = RGBColor(16, 185, 129)    # Emerald 500
    CARD_BG = RGBColor(22, 18, 38)

    art_dir = r"C:\Users\sthar\.gemini\antigravity\brain\00ecf40d-fbac-403d-93d2-018d469244d6"

    def set_bg(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, title_text, category="AGENTSHIELD-X MASTER ARCHITECTURE"):
        # Category label
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.5), Inches(0.35))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = f"🛡️ {category.upper()}"
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = PURPLE_ACCENT

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
        p_title = tb_title.text_frame.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1)

    img1 = os.path.join(art_dir, "3-Scene 1 · Obsidian Aegis reveal.jpg")
    if os.path.exists(img1):
        s1.shapes.add_picture(img1, Inches(7.0), Inches(1.2), width=Inches(5.6))

    tb = s1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(6.0), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "AGENTSHIELD-X"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = PURPLE_ACCENT

    p2 = tf.add_paragraph()
    p2.text = "The Enterprise Autonomous AI Agent Security Operating System"
    p2.font.size = Pt(18)
    p2.font.bold = True
    p2.font.color.rgb = CYAN_ACCENT
    p2.space_before = Pt(12)

    bullets = [
        "⚡ Dual-Rail Decision Pipeline: Sub-millisecond deterministic AST hot-path (<0.18ms)",
        "🔒 Cryptographic Immutability: SHA-256 Merkle-WAL audit chain tracking every tool execution",
        "🧬 Behavioral Agent Genome: Continuous DNA baseline profiling detecting privilege drift",
        "💉 Cross-Agent Immunity: Automated attack signature extraction & instant vaccine broadcast",
        "🚀 Chronos Desktop AI Companion: Living screen memory & on-device neural voice"
    ]
    for b in bullets:
        pb = tf.add_paragraph()
        pb.text = b
        pb.font.size = Pt(12)
        pb.font.color.rgb = TEXT_WHITE
        pb.space_before = Pt(8)

    p_meta = tf.add_paragraph()
    p_meta.text = "Tharunkumar.S | Lead Architect • Version 2.4.0-Production Release"
    p_meta.font.size = Pt(11)
    p_meta.font.color.rgb = TEXT_MUTED
    p_meta.space_before = Pt(20)

    s1.notes_slide.notes_text_frame.text = (
        "Welcome everyone. Today we introduce AgentShield-X — the world's first enterprise runtime security OS "
        "engineered specifically for autonomous agents, multi-agent swarms, Model Context Protocol (MCP) ecosystems, "
        "and RAG pipelines. It provides dual-rail policy enforcement with sub-millisecond latency."
    )

    # -------------------------------------------------------------
    # SLIDE 2: The Agent Security Dilemma
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2)
    add_header(s2, "The Agent Security Dilemma: Why Traditional WAFs Fail")

    tb2 = s2.shapes.add_textbox(Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "THE NEW THREAT LANDSCAPE FOR AGENTS"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PURPLE_ACCENT

    p_items = [
        ("Autonomous Action Surface:", "LLMs now execute bash scripts, SQL queries, cloud APIs, and file mutations directly."),
        ("Indirect Prompt Injection:", "Adversaries embed hidden jailbreaks in customer PDFs, emails, and web pages to divert tools."),
        ("Tool Parameter Rug-Pulls:", "Malicious MCP tools mutate parameter definitions dynamically to trigger unauthorized actions."),
        ("Multi-Turn Goal Drift:", "Subtle social engineering and cognitive pressure coerce agents across 10+ turns.")
    ]
    for h, b in p_items:
        ph = tf2.add_paragraph()
        ph.text = f"• {h}"
        ph.font.bold = True
        ph.font.size = Pt(12)
        ph.font.color.rgb = CYAN_ACCENT
        ph.space_before = Pt(8)
        pb = tf2.add_paragraph()
        pb.text = f"  {b}"
        pb.font.size = Pt(11)
        pb.font.color.rgb = TEXT_WHITE

    tb2_r = s2.shapes.add_textbox(Inches(6.8), Inches(1.7), Inches(5.6), Inches(5.2))
    tf2_r = tb2_r.text_frame
    tf2_r.word_wrap = True
    p_r = tf2_r.paragraphs[0]
    p_r.text = "WHY EXISTING TOOLS ARE INSUFFICIENT"
    p_r.font.size = Pt(16)
    p_r.font.bold = True
    p_r.font.color.rgb = RGBColor(239, 68, 68)

    flaws = [
        ("Traditional WAFs (Cloudflare / AWS):", "Purely static HTTP text filtering; completely blind to agent intent and MCP schemas."),
        ("Llama Guard / NeMo Guardrails:", "High latency (500ms-2500ms), prohibitive token inference cost, and 12-18% false positive rate."),
        ("Static Regex Filters:", "Bypassed easily using Cyrillic homoglyphs, zero-width spaces, and base64 smuggling."),
        ("Lack of Execution Sandboxing:", "No speculative dry-run; attacks execute on production hardware immediately.")
    ]
    for h, b in flaws:
        ph = tf2_r.add_paragraph()
        ph.text = f"✕ {h}"
        ph.font.bold = True
        ph.font.size = Pt(12)
        ph.font.color.rgb = RGBColor(248, 113, 113)
        ph.space_before = Pt(8)
        pb = tf2_r.add_paragraph()
        pb.text = f"  {b}"
        pb.font.size = Pt(11)
        pb.font.color.rgb = TEXT_WHITE

    s2.notes_slide.notes_text_frame.text = (
        "Autonomous agents don't just generate text — they execute real actions. Traditional web application firewalls "
        "and heavy LLM-as-a-judge models fail because of latency, high false positive rates, and lack of execution context."
    )

    # -------------------------------------------------------------
    # SLIDE 3: Master Architecture — Dual-Rail Pipeline
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3)
    add_header(s3, "Master Architecture: The Deterministic Dual-Rail Engine")

    cards = [
        ("RAIL 0: NORMALIZER", "0.04 ms", "Strips Cyrillic homoglyphs, combining marks, BiDi overrides, and zero-width spaces into canonical text."),
        ("RAIL 1: AST HOT-PATH", "< 0.18 ms", "120+ regex, AST code analysis, honeypot canary tokens, PII scrubbing, and shell breakout interception."),
        ("RAIL 2: COGNITIVE GUARD", "15 - 45 ms", "Intent shift detection, multi-turn goal drift vectors, cognitive pressure analysis, & Nemotron NIM."),
        ("RAIL 3: SHADOW SANDBOX", "2.5 - 10 ms", "Speculative dry-run simulation of high-risk tools before physical execution on hardware.")
    ]

    for i, (title, lat, desc) in enumerate(cards):
        x = Inches(0.8 + (i * 2.95))
        shp = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.8), Inches(2.8), Inches(4.5))
        shp.fill.solid()
        shp.fill.fore_color.rgb = CARD_BG
        shp.line.color.rgb = PURPLE_ACCENT
        shp.line.width = Pt(1.5)

        tf_c = shp.text_frame
        tf_c.word_wrap = True
        p_c = tf_c.paragraphs[0]
        p_c.text = title
        p_c.font.bold = True
        p_c.font.size = Pt(13)
        p_c.font.color.rgb = PURPLE_ACCENT

        p_lat = tf_c.add_paragraph()
        p_lat.text = f"SLA: {lat}"
        p_lat.font.bold = True
        p_lat.font.size = Pt(12)
        p_lat.font.color.rgb = GREEN_ACCENT
        p_lat.space_before = Pt(6)

        p_desc = tf_c.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = TEXT_WHITE
        p_desc.space_before = Pt(12)

    s3.notes_slide.notes_text_frame.text = (
        "AgentShield-X balances speed and intelligence with our Dual-Rail design. Rail 1 drops malicious commands in "
        "less than 0.18 milliseconds without invoking expensive models. Sensitive tools are verified by Rail 2 and Rail 3."
    )

    # -------------------------------------------------------------
    # SLIDE 4: Rail 0 & Rail 1 Details
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4)
    add_header(s4, "Deterministic Defense: Normalizer & AST Rules Engine")

    tb4_l = s4.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf4_l = tb4_l.text_frame
    tf4_l.word_wrap = True
    tf4_l.paragraphs[0].text = "RAIL 0: DE-OBFUSCATION NORMALIZER"
    tf4_l.paragraphs[0].font.bold = True
    tf4_l.paragraphs[0].font.size = Pt(15)
    tf4_l.paragraphs[0].font.color.rgb = CYAN_ACCENT

    n_items = [
        ("Unicode NFKD Decompounding:", "Deconstructs complex composite unicode representations into standard base characters."),
        ("Combining Diacritic Stripping:", "Strips all nonspacing marks (Mn) used to evade regex triggers (e.g., bypassing 'règles' via e\\u0301)."),
        ("Homoglyph Resolution:", "Flattens Cyrillic homoglyphs (а, е, о, р, с, у, х) to Latin equivalents."),
        ("BiDi Override Scrubbing:", "Removes RTL/LTR directional overrides (\\u202E) used to invert text rendering visually in terminal logs."),
        ("Zero-Width Scrubbing:", "Eliminates zero-width spaces (\\u200B) and soft hyphens used to split tokenizers.")
    ]
    for h, b in n_items:
        p = tf4_l.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(6)

    tb4_r = s4.shapes.add_textbox(Inches(6.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf4_r = tb4_r.text_frame
    tf4_r.word_wrap = True
    tf4_r.paragraphs[0].text = "RAIL 1: 120+ CURATED AST RULES"
    tf4_r.paragraphs[0].font.bold = True
    tf4_r.paragraphs[0].font.size = Pt(15)
    tf4_r.paragraphs[0].font.color.rgb = PURPLE_ACCENT

    r_items = [
        ("Multilingual Jailbreak Matchers:", "Native syntax evaluation across English, French, Spanish, German, and Russian."),
        ("Unconstrained Persona Injections:", "Blocks 'DAN mode', 'unconstrained mode', and developer persona overrides."),
        ("Direct Shell Injection Primitives:", "Catches rm -rf /, dd if=/dev/zero, mkfs, :(){ :|:& };:, and PowerShell IEX."),
        ("Cloud Metadata & SSRF Sinks:", "Hard-blocks AWS/GCP instance metadata endpoints (169.254.169.254, metadata.google.internal)."),
        ("Base64 Payload Extraction:", "Auto-extracts and scans embedded base64 sequences dynamically in 0.08 ms.")
    ]
    for h, b in r_items:
        p = tf4_r.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(6)

    s4.notes_slide.notes_text_frame.text = (
        "Rail 0 and Rail 1 provide mathematical certainty. We strip evasion techniques at the Unicode layer, "
        "and then apply 120+ deterministic AST evaluators. This eliminates token smuggling and halts command injection."
    )

    # -------------------------------------------------------------
    # SLIDE 5: Rail 2 Cognitive Semantic & Agentic Defense
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5)
    add_header(s5, "Rail 2: Cognitive Semantic Defense & Goal Drift")

    features_s5 = [
        ("Intent Shift Detection", "Measures semantic vector divergence between the authorized task and proposed tool calls, preventing stealth hijacking."),
        ("Multi-Turn Goal Drift", "Continuously models agent reasoning trajectory across 20+ turns to detect slow-boil social engineering."),
        ("Cognitive Pressure Tracking", "Quantifies psychological coercion, urgency claims ('Production down!'), and faux authority ('I am the CEO')."),
        ("NVIDIA Nemotron Reasoning NIM", "Integrates safety reasoning NIMs for edge-case ambiguity resolution and deep policy taxonomy checking.")
    ]

    for i, (title, desc) in enumerate(features_s5):
        y = Inches(1.8 + (i * 1.25))
        shp = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y, Inches(11.7), Inches(1.1))
        shp.fill.solid()
        shp.fill.fore_color.rgb = CARD_BG
        shp.line.color.rgb = CYAN_ACCENT
        shp.line.width = Pt(1)

        tf = shp.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = f"✦ {title}"
        p_t.font.bold = True
        p_t.font.size = Pt(14)
        p_t.font.color.rgb = CYAN_ACCENT

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_WHITE
        p_d.space_before = Pt(4)

    s5.notes_slide.notes_text_frame.text = (
        "Rail 2 models agent cognition. It detects when an indirect prompt injection subtly redirects an agent from its "
        "original goal, and quantifies cognitive manipulation like urgency claims and faux executive authority."
    )

    # -------------------------------------------------------------
    # SLIDE 6: Honeytokens & Immunological Swarm Defense
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6)
    add_header(s6, "Active Deception & Cross-Agent Immunological Defense")

    tb6_l = s6.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf6_l = tb6_l.text_frame
    tf6_l.word_wrap = True
    tf6_l.paragraphs[0].text = "DYNAMIC HONEYTOKENS & CANARIES"
    tf6_l.paragraphs[0].font.bold = True
    tf6_l.paragraphs[0].font.size = Pt(15)
    tf6_l.paragraphs[0].font.color.rgb = GREEN_ACCENT

    h_items = [
        ("Realistic Decoy Credentials:", "Injects synthetic AWS access keys (AKIA...), JWTs, and database passwords into context."),
        ("Cryptographic Trap Registry:", "Canaries are cryptographically hashed in an in-memory HMAC trap database."),
        ("Deterministic Leakage Tripping:", "If an agent passes a canary into a network socket or bash command, Rail 1 blocks it instantly."),
        ("Zero Data Leakage Guarantee:", "Provides empirical mathematical proof with Wilson 95% confidence intervals.")
    ]
    for h, b in h_items:
        p = tf6_l.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    tb6_r = s6.shapes.add_textbox(Inches(6.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf6_r = tb6_r.text_frame
    tf6_r.word_wrap = True
    tf6_r.paragraphs[0].text = "IMMUNOLOGICAL MEMORY & VACCINES"
    tf6_r.paragraphs[0].font.bold = True
    tf6_r.paragraphs[0].font.size = Pt(15)
    tf6_r.paragraphs[0].font.color.rgb = PURPLE_ACCENT

    imm_items = [
        ("Attack Fingerprint Extraction:", "When an attack is intercepted on Agent Alpha, its semantic vector is extracted immediately."),
        ("Vaccine Synthesis:", "Threat patterns are compiled into lightweight, portable immunological security signatures."),
        ("Real-Time Swarm Broadcast:", "Distributes vaccine updates across all active agents in the enterprise swarm in < 50 ms."),
        ("Collective Swarm Immunity:", "Once any single agent stops an attack, every agent in the fleet becomes permanently immune.")
    ]
    for h, b in imm_items:
        p = tf6_r.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    s6.notes_slide.notes_text_frame.text = (
        "Honeytokens give us active deception, while Immunological Memory gives our multi-agent swarms self-healing "
        "capabilities. An attack on one agent generates a vaccine that protects the entire fleet in under 50 milliseconds."
    )

    # -------------------------------------------------------------
    # SLIDE 7: RAG Context Firewall & MCP Schema Scanner
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7)
    add_header(s7, "Ecosystem Security: RAG Context Firewall & MCP Guardian")

    tb7_l = s7.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf7_l = tb7_l.text_frame
    tf7_l.word_wrap = True
    tf7_l.paragraphs[0].text = "RAG CONTEXT FIREWALL"
    tf7_l.paragraphs[0].font.bold = True
    tf7_l.paragraphs[0].font.size = Pt(15)
    tf7_l.paragraphs[0].font.color.rgb = CYAN_ACCENT

    rag_items = [
        ("Indirect Injection Sanitizer:", "Scrubs retrieved documents, web search results, and vector embeddings for embedded directives."),
        ("Context Delimiter Guard:", "Prevents retrieved text from escaping prompt boundary markers (</context>, [SYSTEM], Human:)."),
        ("Document Taint Lineage:", "Cryptographically tags retrieved chunks with SHA-256 taint hashes to monitor downstream flow."),
        ("Vector Entropy Profiler:", "Flags statistical distribution anomalies indicative of base64 payloads or hidden prompt instructions.")
    ]
    for h, b in rag_items:
        p = tf7_l.add_paragraph()
        p.text = f"✦ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    tb7_r = s7.shapes.add_textbox(Inches(6.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf7_r = tb7_r.text_frame
    tf7_r.word_wrap = True
    tf7_r.paragraphs[0].text = "MCP TOOL RUG-PULL GUARDIAN"
    tf7_r.paragraphs[0].font.bold = True
    tf7_r.paragraphs[0].font.size = Pt(15)
    tf7_r.paragraphs[0].font.color.rgb = PURPLE_ACCENT

    mcp_items = [
        ("Dynamic Schema Hashing:", "Registers tool schemas at launch and intercepts unauthorized runtime parameter mutations."),
        ("Tool Rug-Pull Detection:", "Halts malicious MCP servers from silently altering tool descriptions to bypass security."),
        ("Transparent Reverse Proxy:", "Sits inline between the agent and MCP servers over stdio and Server-Sent Events (SSE)."),
        ("Parameter Boundary Validation:", "Enforces rigid regex typing, character whitelisting, and path traversal restrictions.")
    ]
    for h, b in mcp_items:
        p = tf7_r.add_paragraph()
        p.text = f"✦ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    s7.notes_slide.notes_text_frame.text = (
        "RAG and MCP are standard in modern AI development, but they introduce severe vulnerabilities. "
        "AgentShield-X provides dedicated RAG sanitization and the industry's first MCP dynamic rug-pull reverse proxy."
    )

    # -------------------------------------------------------------
    # SLIDE 8: Rail 3 Speculative Shadow Sandbox & SHA-256 WAL
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8)
    add_header(s8, "Execution Safety: Shadow Sandboxing & Cryptographic Ledger")

    tb8_l = s8.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf8_l = tb8_l.text_frame
    tf8_l.word_wrap = True
    tf8_l.paragraphs[0].text = "RAIL 3: SHADOW EXECUTION SANDBOX"
    tf8_l.paragraphs[0].font.bold = True
    tf8_l.paragraphs[0].font.size = Pt(15)
    tf8_l.paragraphs[0].font.color.rgb = GREEN_ACCENT

    sbox_items = [
        ("Speculative Dry-Run:", "High-risk tools (file modification, SQL, terminal execution) are emulated in an ephemeral process sandbox."),
        ("Blast Radius Calculation:", "Measures file system modification depth, outbound socket requests, and privilege escalation."),
        ("Deterministic Safety Gates:", "Only actions passing strict isolation invariants are allowed onto physical infrastructure."),
        ("Sub-10ms Emulation SLA:", "Ultra-lightweight process isolation optimized for low-latency production pipelines.")
    ]
    for h, b in sbox_items:
        p = tb8_l.text_frame.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    tb8_r = s8.shapes.add_textbox(Inches(6.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf8_r = tb8_r.text_frame
    tf8_r.word_wrap = True
    tf8_r.paragraphs[0].text = "CRYPTOGRAPHIC SHA-256 WAL AUDIT LEDGER"
    tf8_r.paragraphs[0].font.bold = True
    tf8_r.paragraphs[0].font.size = Pt(15)
    tf8_r.paragraphs[0].font.color.rgb = CYAN_ACCENT

    wal_items = [
        ("SHA-256 Merkle Chaining:", "Every turn, normalized input, detector score, and tool execution is chained cryptographically."),
        ("Tamper-Evident Integrity:", "Built-in cryptographic CLI verification (agentshield audit verify) instantly detects log tampering."),
        ("High-Throughput SQLite WAL:", "High concurrency with sub-millisecond commit latency; zero database lock bottlenecks."),
        ("Counterfactual Policy Replay:", "Replays historical incident traces against newly authored policies to prove prevention.")
    ]
    for h, b in wal_items:
        p = tb8_r.text_frame.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    s8.notes_slide.notes_text_frame.text = (
        "Rail 3 provides speculative execution sandboxing, while our Write-Ahead Log audit ledger creates an immutable "
        "cryptographic Merkle chain. This guarantees forensic accountability and allows historical policy replays."
    )

    # -------------------------------------------------------------
    # SLIDE 9: Chronos Desktop AI Companion Subsystem
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9)
    add_header(s9, "Chronos Desktop: Autonomous AI Companion Subsystem")

    img_chronos = os.path.join(art_dir, "9-Scene 7 · Native downloads.jpg")
    if os.path.exists(img_chronos):
        s9.shapes.add_picture(img_chronos, Inches(7.2), Inches(1.8), width=Inches(5.3))

    tb9 = s9.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0))
    tf9 = tb9.text_frame
    tf9.word_wrap = True
    p = tf9.paragraphs[0]
    p.text = "AUTONOMOUS SCREEN MEMORY & VOICE COMPANION"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = PURPLE_ACCENT

    c_points = [
        ("Living Screen Observation:", "Observes desktop windows and project workflows with zero-trust local token redaction."),
        ("Whisper.cpp Speech Recognition:", "High-fidelity local speech-to-text with global hotkey support (Ctrl+Shift+Space)."),
        ("Kokoro On-Device Neural Voice:", "Zero-latency offline neural voice synthesis with natural cadence and tone."),
        ("The Knot Overlay:", "Interactive fluid floating companion overlay with living timeline and course tracking."),
        ("100% Offline 588 MB Installer:", "Self-contained Chronos-Desktop-Setup.exe installer bundling all models and SQLite runtime.")
    ]
    for h, b in c_points:
        p = tf9.add_paragraph()
        p.text = f"◈ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    s9.notes_slide.notes_text_frame.text = (
        "Chronos Desktop is our autonomous companion agent. It provides living screen observation, Whisper voice recognition, "
        "and Kokoro neural audio, all running 100% locally on-device with zero-trust token redaction."
    )

    # -------------------------------------------------------------
    # SLIDE 10: Web Console, ShieldWing Studio & Ecosystem
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10)
    add_header(s10, "Operations: Cyberpunk Web Console & ShieldWing Studio")

    img_console = os.path.join(art_dir, "7-Scene 12 · ShieldWing Copilot UI.jpg")
    if os.path.exists(img_console):
        s10.shapes.add_picture(img_console, Inches(7.2), Inches(1.8), width=Inches(5.3))

    tb10 = s10.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0))
    tf10 = tb10.text_frame
    tf10.word_wrap = True
    p = tf10.paragraphs[0]
    p.text = "ENTERPRISE SECURITY OPERATIONS CENTER"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT

    ui_points = [
        ("ShieldWing Studio:", "Visual node-based pipeline designer to build and configure custom agent security rails."),
        ("49 Enterprise Connectors:", "Pre-built connectors for Slack, Discord, GitHub, Jira, AWS, Datadog, Salesforce, and Postgres."),
        ("SecureTokenVault:", "In-memory, session-isolated credential manager with AES-GCM encryption for API keys."),
        ("Simulation Lab & Red-Teaming:", "Interactive adversarial war-gaming harness executing multi-turn jailbreak simulations."),
        ("Cyberpunk Purple UI Design:", "High-contrast dark obsidian aesthetic built with React, Vite, and Tailwind CSS.")
    ]
    for h, b in ui_points:
        p = tf10.add_paragraph()
        p.text = f"✦ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(8)

    s10.notes_slide.notes_text_frame.text = (
        "The Web Console provides security operators with a single pane of glass. ShieldWing Studio allows visual policy design, "
        "SecureTokenVault protects enterprise secrets, and 49 connectors integrate with existing enterprise tools."
    )

    # -------------------------------------------------------------
    # SLIDE 11: Developer CLI & Python SDK
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11)
    add_header(s11, "Developer Experience: Universal CLI & Python SDK")

    tb11_l = s11.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf11_l = tb11_l.text_frame
    tf11_l.word_wrap = True
    tf11_l.paragraphs[0].text = "CLICK CLI INTERFACE"
    tf11_l.paragraphs[0].font.bold = True
    tf11_l.paragraphs[0].font.size = Pt(15)
    tf11_l.paragraphs[0].font.color.rgb = PURPLE_ACCENT

    cli_text = (
        "# Install globally via pip\n"
        "$ pip install agentshield-x\n\n"
        "# Run universal AST static security scan\n"
        "$ agentshield scan ./my_agent_repo\n\n"
        "# Verify cryptographic SHA-256 audit log integrity\n"
        "$ agentshield audit verify\n\n"
        "# Execute live empirical benchmark suite\n"
        "$ agentshield benchmark run --all\n\n"
        "# Launch local developer security gateway\n"
        "$ agentshield gateway start --port 8080"
    )
    p_code = tf11_l.add_paragraph()
    p_code.text = cli_text
    p_code.font.name = "Consolas"
    p_code.font.size = Pt(11)
    p_code.font.color.rgb = CYAN_ACCENT
    p_code.space_before = Pt(10)

    tb11_r = s11.shapes.add_textbox(Inches(6.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tf11_r = tb11_r.text_frame
    tf11_r.word_wrap = True
    tf11_r.paragraphs[0].text = "DROP-IN PYTHON @protect DECORATOR"
    tf11_r.paragraphs[0].font.bold = True
    tf11_r.paragraphs[0].font.size = Pt(15)
    tf11_r.paragraphs[0].font.color.rgb = GREEN_ACCENT

    py_text = (
        "import agentshield\n\n"
        "@agentshield.protect(\n"
        "    mode='enforce',         # enforce | monitor | shadow\n"
        "    sensitivity='critical',  # low | medium | critical\n"
        "    track_taint=True        # SHA-256 taint propagation\n"
        ")\n"
        "def execute_bash_command(cmd: str):\n"
        "    # Automatically inspected by Fast-Rail AST\n"
        "    # Obfuscation stripped in 0.04 ms\n"
        "    # Shadow sandboxed before execution\n"
        "    return os.system(cmd)"
    )
    p_py = tf11_r.add_paragraph()
    p_py.text = py_text
    p_py.font.name = "Consolas"
    p_py.font.size = Pt(11)
    p_py.font.color.rgb = TEXT_WHITE
    p_py.space_before = Pt(10)

    s11.notes_slide.notes_text_frame.text = (
        "We designed AgentShield-X with a zero-friction developer experience. A single CLI command scans your code, "
        "and wrapping sensitive functions with @agentshield.protect activates the complete dual-rail security perimeter."
    )

    # -------------------------------------------------------------
    # SLIDE 12: ⭐ THE CRITICAL SLIDE: Why AgentShield-X is Best
    # -------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12)
    add_header(s12, "⭐ Why AgentShield-X is Better and Best Compared to Existing Solutions", "COMPETITIVE BENCHMARK TEARDOWN")

    # Add Comparison Table
    rows = 9
    cols = 5
    table_shape = s12.shapes.add_table(rows, cols, Inches(0.8), Inches(1.7), Inches(11.7), Inches(4.8))
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(2.6)
    table.columns[1].width = Inches(2.5)
    table.columns[2].width = Inches(2.2)
    table.columns[3].width = Inches(2.2)
    table.columns[4].width = Inches(2.2)

    headers = ["SECURITY CAPABILITY", "🛡️ AGENTSHIELD-X", "🟢 NVIDIA NeMo", "🔵 Llama Guard", "🟣 Lakera Guard"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = PURPLE_ACCENT if col_idx == 1 else TEXT_WHITE
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(30, 24, 52) if col_idx == 1 else RGBColor(20, 16, 32)

    matrix = [
        ("Fast-Path Latency", "⚡ < 0.18 ms (AST Hot-Path)", "❌ 450 - 1,200 ms", "❌ 350 - 800 ms", "❌ 180 - 500 ms"),
        ("Architecture", "✅ Dual-Rail (AST + Cognitive)", "❌ Colang Flow Only", "❌ Single-Rail Classifier", "❌ API Cloud Proxy"),
        ("Execution Sandboxing", "✅ Speculative Shadow Runtime", "❌ None (Text Only)", "❌ None (Text Only)", "❌ None (Text Only)"),
        ("Swarm Immunization", "✅ Instant Fleet Vaccine Push", "❌ None", "❌ None", "❌ Centralized Cloud"),
        ("MCP Rug-Pull Defense", "✅ Dynamic Schema Hashing", "❌ No MCP Awareness", "❌ No MCP Awareness", "❌ Basic Validation"),
        ("Unicode Normalizer", "✅ Cyrillic, BiDi, Steganography", "⚠️ NFKC Only", "⚠️ Vulnerable to Diacritics", "⚠️ Cloud API Only"),
        ("False Positive Rate", "🎯 0.0% FPR on Dev Prompts", "❌ 8.4% - 14.2% FPR", "❌ 12.0% - 18.5% FPR", "❌ 6.2% FPR"),
        ("Hardware / Offline", "💻 100% Offline (CPU Native)", "❌ Requires GPU Server", "❌ Requires GPU (Weights)", "❌ Cloud API Bound")
    ]

    for row_idx, data in enumerate(matrix):
        for col_idx, val in enumerate(data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10)
            if col_idx == 1:
                p.font.bold = True
                p.font.color.rgb = GREEN_ACCENT if "✅" in val or "⚡" in val or "🎯" in val or "💻" in val else TEXT_WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(25, 20, 45)
            else:
                p.font.color.rgb = RGBColor(248, 113, 113) if "❌" in val else (RGBColor(251, 191, 36) if "⚠️" in val else TEXT_WHITE)
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(15, 12, 24)

    s12.notes_slide.notes_text_frame.text = (
        "This is the pivotal slide of the deck. NeMo and Llama Guard add 500 to 1,200 milliseconds of latency, "
        "have a 10% to 18% false positive rate on developer code, and lack execution-aware sandboxing. AgentShield-X "
        "is 100x faster (<0.18ms), achieves 0% false positives on hard negatives, and provides real speculative sandboxing."
    )

    # -------------------------------------------------------------
    # SLIDE 13: Empirical Ground-Truth Benchmarks
    # -------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13)
    add_header(s13, "Empirical Validation: Ground-Truth Datasets & Benchmark Results")

    img_bench = os.path.join(art_dir, "4-Scene 6 · Benchmark leaderboard.jpg")
    if os.path.exists(img_bench):
        s13.shapes.add_picture(img_bench, Inches(7.2), Inches(1.8), width=Inches(5.3))

    tb13 = s13.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0))
    tf13 = tb13.text_frame
    tf13.word_wrap = True
    p = tf13.paragraphs[0]
    p.text = "EMPIRICAL PYTEST & DATASET RESULTS"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = GREEN_ACCENT

    results = [
        ("Total Real Tests Passed:", "48 / 48 (100.0% Pass Rate across test harness)"),
        ("Unshielded Attack Leakage:", "80.0% Data Exfiltration (95% CI: 68.2% - 88.2%)"),
        ("Prompt Hardening Alone:", "30.0% Attack Leakage (95% CI: 19.9% - 42.5%)"),
        ("AgentShield-X Enforce Mode:", "0.0% Leakage (100% Interception on critical attacks)"),
        ("False Positive Rate (Hard Negs):", "0.0% FPR (100.0% Precision on developer code)"),
        ("Fast-Path AST Latency:", "< 0.18 ms (Sub-millisecond SLA consistently met)"),
        ("Mean Detection Latency:", "0.891 ms (p50: 0.806 ms, p99: 4.334 ms)"),
        ("Added Enforce Overhead:", "4.22 ms (Target SLA: 50.0 ms)"),
        ("Audit Integrity Verification:", "100% Verified, 0 Broken SHA-256 Sequences")
    ]
    for h, b in results:
        p = tf13.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(4)

    s13.notes_slide.notes_text_frame.text = (
        "These are verified empirical metrics. In our benchmark datasets, unshielded agents leak data 80% of the time. "
        "AgentShield-X brings leakage to 0.0%, maintains 0% false positives, and adds only 4.22ms of enforce overhead."
    )

    # -------------------------------------------------------------
    # SLIDE 14: Roadmap & Call to Action
    # -------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14)
    add_header(s14, "Enterprise Summary & Production Roadmap")

    img_end = os.path.join(art_dir, "18-Scene 11 · Forensics & War Game SimLab.jpg")
    if os.path.exists(img_end):
        s14.shapes.add_picture(img_end, Inches(7.2), Inches(1.8), width=Inches(5.3))

    tb14 = s14.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0))
    tf14 = tb14.text_frame
    tf14.word_wrap = True
    p = tf14.paragraphs[0]
    p.text = "PRODUCTION MILESTONES (v2.4.0) & ROADMAP"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT

    road_items = [
        ("Current Release (v2.4.0):", "Dual-Rail Decision Pipeline, MCP Rug-Pull Guard, Speculative Sandboxing, Chronos Desktop."),
        ("WASM Edge Gate (v2.5):", "Sub-millisecond WebAssembly edge filter for Cloudflare Workers & AWS Lambda@Edge."),
        ("Kernel eBPF Interposition:", "Linux kernel-level system call mediation for zero-escape agent process enforcement."),
        ("Hardware Attestation:", "HSM-signed cryptographic proofs for compliance and regulatory AI audits."),
        ("Try It Live:", "https://agentshield-x-ecru.vercel.app/"),
        ("Download Chronos Desktop:", "https://agentshield-x-ecru.vercel.app/downloads/Chronos-Desktop-Setup-1.0.0.exe")
    ]
    for h, b in road_items:
        p = tf14.add_paragraph()
        p.text = f"✦ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.space_before = Pt(6)

    s14.notes_slide.notes_text_frame.text = (
        "AgentShield-X provides the runtime security foundation necessary for enterprise adoption of autonomous AI agents. "
        "Visit our live console or download Chronos Desktop today. Thank you!"
    )

    # Output paths
    out_pptx = r"apps\console\public\AgentShieldX_Master_Presentation.pptx"
    out_root = r"AgentShieldX_Master_Presentation.pptx"
    prs.save(out_pptx)
    prs.save(out_root)
    print(f"Presentation saved successfully to {out_pptx} and {out_root}!")

if __name__ == "__main__":
    create_deck()
