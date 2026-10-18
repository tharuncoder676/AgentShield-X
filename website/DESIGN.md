# AgentShield-X: Design System & Visual Specification

Date: 2026-10-18  
Status: **Official Design System Specification (Phase 1)**

---

## 1. Design Philosophy & Mood

**The Mood**: A calm, focused security operations room. Engineered for high-stakes operational clarity rather than marketing flash.

- **Theme Priority**: Dark first, with a complete, high-contrast light theme and a manual toggle that respects `prefers-color-scheme`.
- **The Core Motif**: The **Shield Boundary**—a crisp, hairline visual boundary where an adversarial call is visibly stopped and quarantined before execution.
- **Visual Tenet**: **Structure is Information**. Avoid decorative clutter, uniform soft shadows, and gradient washes. Every border, tag, and status dot carries semantic meaning.

---

## 2. Design Tokens

The palette is derived directly from the AgentShield-X reference design and implemented as CSS variables and Tailwind tokens:

| Token | Dark Theme | Light Theme | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `--bg` | `#060a12` | `#f3f6fa` | Deep page background |
| `--panel` | `#0e1624` | `#ffffff` | Panels, elevated surfaces, cards, flyout drawers |
| `--line` | `#1d2a3f` | `#cfd9e6` | Hairline borders, dividers, subtle table gridlines |
| `--fg` | `#e8eef7` | `#0a1424` | Primary high-contrast typography |
| `--mut` | `#93a4bd` | `#4c5c74` | Secondary text, timestamps, subtitles, inactive states |
| `--ok` | `#4fd1e8` | `#0b7a96` | **Allowed, verified, safe, primary action** (Cyan) |
| `--bad` | `#ff5a4f` | `#c3281d` | **Blocked, critical threat, honeytool trigger** (Red) |
| `--warn` | `#f5b84a` | `#a86a00` | **Flagged, sanitized, needs human approval** (Amber) |

### Strict Semantic Color Rules
- **Cyan (`--ok`)**: Reserved exclusively for safe verdicts, verified cryptographic checks, and primary user confirmations.
- **Red (`--bad`)**: Reserved exclusively for blocked tool calls, active attacks, critical honeytool triggers, and session terminations.
- **Amber (`--warn`)**: Reserved exclusively for sanitized payloads, anomalous signals, escalation queues, and degraded statuses.
- **Absolute Prohibition**: Never use cyan, red, or amber decoratively or as generic background tints. Neutral surfaces use `--panel` and `--line`.

---

## 3. Typography Hierarchy

Only three typeface families are permitted across all views:

```css
/* Headings, Brand, Numbers, Verdicts, Buttons */
font-family: 'Chakra Petch', system-ui, -apple-system, sans-serif;

/* Body Text, Explanations, Form Fields, Documentation */
font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;

/* IDs, Code, Logs, Decision Rows, Rego Policies, Latency Metrics */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
```

### Scale & Hierarchy
- **Display / Hero**: `font-chakra text-3xl md:text-5xl font-bold tracking-tight`
- **Section Headers (H1, H2)**: `font-chakra text-xl md:text-2xl font-semibold tracking-wide uppercase`
- **Component Titles (H3)**: `font-chakra text-base font-semibold`
- **Body Text**: `font-sans text-sm md:text-base leading-relaxed text-mut`
- **Monospace Elements**: `font-mono text-xs md:text-sm tracking-normal`

---

## 4. UI Rules & Anti-Patterns to Avoid

### What to Do:
1. **Hairline Separation**: Separate list items, table rows, and panel headers with sharp 1px borders (`border border-line`).
2. **Real Sequences**: Use numbered step lists only for real chronological or multi-step execution flows (e.g. Onboarding, Session Replay).
3. **Tags for Real Attributes**: Tags represent actual metadata (e.g. `severity: critical`, `detector: rules`, `taint: seg_123`).
4. **Typographic Punctuation**: Always use typographic quotation marks (“ ”) and apostrophes (’), never generic straight quotes in UI copy.
5. **Action-Oriented Copy**: Plain verbs, sentence case, active voice. Buttons clearly name their exact action (`Block Session`, `Deploy Policy`, `Verify Audit Chain`).

### Anti-Patterns Strictly Forbidden:
- **NO** generic SaaS card grids with uniform rounded corners and floating drop shadows.
- **NO** all-caps eyebrow labels (`/// FEATURE PREVIEW ///`).
- **NO** spaced em-dashes (`—`) used as visual filler.
- **NO** decorative arrow icons (`->`, `→`) randomly appended to buttons.
- **NO** gradient washes or saturated glowing borders on non-interactive panels.

---

## 5. Motion & Transitions

- **Maximum One Orchestrated Moment**: At most one prominent animation per page (e.g. the live decision interception visual).
- **Responsive Motion**: Subtle transitions (150ms–200ms) that answer direct user interactions:
  - Decision row arrival in the live feed.
  - Drawer slide-out for incident inspection.
  - Toggle flip on the shield bypass switch.
- **Accessibility (`prefers-reduced-motion`)**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 6. Core Component Catalog (`packages/ui`)

| Component | Responsibility | Key Elements |
| :--- | :--- | :--- |
| **`AppShell`** | SaaS layout container | Collapsible navigation, organization switcher, connection status dot, theme toggle |
| **`DecisionRow`** | High-density audit row | Verdict badge, agent ID, tool name, arguments snippet, risk meter, latency, reason tags |
| **`VerdictBadge`** | Verdict tag | High-contrast label for `ALLOW`, `SANITIZE`, `ESCALATE`, `BLOCK`, `KILL_SESSION` |
| **`RiskMeter`** | Visual risk barometer | Normalized bar [0.0–1.0] with calibrated threshold indicators and action coloring |
| **`Panel`** | Structured surface | Hairline-bordered card with optional title bar, action slots, and footer status |
| **`ThemeToggle`** | Theme mode selector | Accessible dark/light/system switch with zero-FOUC support |
| **`StepList`** | Chronological tracker | Status indicators: `completed`, `active`, `pending`, `blocked` |
| **`DefinitionList`** | Metadata inspector | Hairline-separated key-value pairs with monospace values |
| **`DataTable`** | Filterable data grid | Server-pagination support, column sorting, empty state integration |
| **`Drawer`** | Flyout detail inspector | Accessible sliding modal for incident triage and evidence verification |
| **`CommandPalette`** | Global quick-action | Keyboard-driven (`Cmd+K` / `Ctrl+K`) search across pages and agents |
| **`Toast`** | System notifications | Auto-dismissing alerts with explicit error remediation instructions |
| **`PolicyEditor`** | Policy editor view | Monaco/syntax-highlighted Rego viewer with diff preview |
| **`TaintGraphNode`** | Graph node | Visual representation of untrusted input sources flowing to sensitive tools |
| **`EmptyState`** | Zero-data handler | Honest empty state with plain-language explanation and primary action button |
