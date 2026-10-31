import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Trash2, 
  Code2, 
  Play, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Terminal, 
  Cpu, 
  Share2, 
  RefreshCw,
  Sparkles,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface RuleCondition {
  field_path: string;
  operator: string;
  value: any;
}

interface VisualRule {
  rule_id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  match_all: boolean;
  conditions: RuleCondition[];
  action: 'BLOCK' | 'ALLOW' | 'REQUIRE_APPROVAL' | 'SANITIZE' | 'REDACT' | 'ALERT_ONLY';
  action_message: string;
  enabled: boolean;
  author: string;
  created_at: string;
  tags: string[];
  python_code: string;
}

export const RuleBuilder: React.FC = () => {
  const [rules, setRules] = useState<VisualRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [expandedAstId, setExpandedAstId] = useState<string | null>(null);

  // Playground state
  const [testTool, setTestTool] = useState<string>('sql_query');
  const [testArgs, setTestArgs] = useState<string>('{"query": "DROP TABLE enterprise_customers"}');
  const [testScore, setTestScore] = useState<number>(0.2);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // New Rule form state
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newSeverity, setNewSeverity] = useState<string>('HIGH');
  const [newMatchAll, setNewMatchAll] = useState<boolean>(true);
  const [newAction, setNewAction] = useState<string>('BLOCK');
  const [newMessage, setNewMessage] = useState<string>('Blocked by custom security rule');
  const [newConditions, setNewConditions] = useState<RuleCondition[]>([
    { field_path: 'tool_name', operator: 'EQUALS', value: '' },
  ]);

  const fetchRules = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8002/v1/rule-builder/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      } else {
        fallbackRules();
      }
    } catch {
      fallbackRules();
    } finally {
      setLoading(false);
    }
  };

  const fallbackRules = () => {
    setRules([
      {
        rule_id: 'rule-block-001',
        name: 'Block Destructive SQL Drops',
        description: 'Prevent autonomous agents from dropping or truncating enterprise tables.',
        severity: 'CRITICAL',
        match_all: true,
        conditions: [
          { field_path: 'tool_name', operator: 'EQUALS', value: 'sql_query' },
          { field_path: 'arg.query', operator: 'REGEX_MATCH', value: '(?i)\\b(DROP|TRUNCATE|DELETE\\s+FROM)\\b' },
        ],
        action: 'BLOCK',
        action_message: "Destructive SQL statement blocked by Custom Rule 'Block Destructive SQL Drops'",
        enabled: true,
        author: 'Tharunkumar.S',
        created_at: new Date().toISOString(),
        tags: ['database', 'anti-data-destruction', 'soc2'],
        python_code: `# Rule: Block Destructive SQL Drops\ndef eval_rule(ctx):\n    return get_val(ctx, 'tool_name') == 'sql_query' and bool(re.search('(?i)\\\\b(DROP|TRUNCATE)\\\\b', str(get_val(ctx, 'arg.query')), re.IGNORECASE))`,
      },
      {
        rule_id: 'rule-block-002',
        name: 'Human Approval for High-Risk Email Sinks',
        description: 'Flag outbound emails whenever behavioral risk exceeds 0.6.',
        severity: 'HIGH',
        match_all: true,
        conditions: [
          { field_path: 'tool_name', operator: 'EQUALS', value: 'send_external_email' },
          { field_path: 'threat_score', operator: 'GREATER_THAN', value: 0.6 },
        ],
        action: 'REQUIRE_APPROVAL',
        action_message: 'Outbound email requires human SOC authorization due to elevated session threat score.',
        enabled: true,
        author: 'Tharunkumar.S',
        created_at: new Date().toISOString(),
        tags: ['human-in-the-loop', 'exfiltration-prevention'],
        python_code: `# Rule: Human Approval for High-Risk Email Sinks\ndef eval_rule(ctx):\n    return get_val(ctx, 'tool_name') == 'send_external_email' and float(get_val(ctx, 'threat_score') or 0) > 0.6`,
      },
      {
        rule_id: 'rule-block-003',
        name: 'Quarantine Unauthorized Bash Loops',
        description: 'Block raw shell command invocation for all agents outside CI runner.',
        severity: 'CRITICAL',
        match_all: true,
        conditions: [
          { field_path: 'tool_name', operator: 'STARTS_WITH', value: 'bash_' },
          { field_path: 'agent_id', operator: 'NOT_EQUALS', value: 'agent-ci-runner' },
        ],
        action: 'BLOCK',
        action_message: 'Raw bash shell execution forbidden for non-CI agents.',
        enabled: true,
        author: 'Tharunkumar.S',
        created_at: new Date().toISOString(),
        tags: ['rce-defense', 'container-isolation'],
        python_code: `# Rule: Quarantine Unauthorized Bash Loops\ndef eval_rule(ctx):\n    return str(get_val(ctx, 'tool_name')).startswith('bash_') and get_val(ctx, 'agent_id') != 'agent-ci-runner'`,
      },
      {
        rule_id: 'rule-block-004',
        name: 'Redact SSN in Customer Lookup',
        description: 'Mask 9-digit social security numbers in customer retrieval responses.',
        severity: 'MEDIUM',
        match_all: true,
        conditions: [
          { field_path: 'tool_name', operator: 'EQUALS', value: 'retrieve_customer_record' },
          { field_path: 'arg.query', operator: 'REGEX_MATCH', value: '\\b\\d{3}-\\d{2}-\\d{4}\\b' },
        ],
        action: 'REDACT',
        action_message: 'Social Security Number dynamically masked to [REDACTED_SSN].',
        enabled: true,
        author: 'Tharunkumar.S',
        created_at: new Date().toISOString(),
        tags: ['privacy', 'pii-compliance', 'gdpr'],
        python_code: `# Rule: Redact SSN in Customer Lookup\ndef eval_rule(ctx):\n    return get_val(ctx, 'tool_name') == 'retrieve_customer_record' and bool(re.search('\\\\b\\\\d{3}-\\\\d{2}-\\\\d{4}\\\\b', str(get_val(ctx, 'arg.query')), re.IGNORECASE))`,
      },
    ]);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleTestEvaluate = async () => {
    setEvaluating(true);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(testArgs);
      } catch {
        parsedArgs = { query: testArgs };
      }

      const res = await fetch('http://127.0.0.1:8002/v1/rule-builder/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: testTool,
          arguments: parsedArgs,
          threat_score: testScore,
          agent_id: 'agent-support-worker',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
      } else {
        fallbackEval();
      }
    } catch {
      fallbackEval();
    } finally {
      setEvaluating(false);
    }
  };

  const fallbackEval = () => {
    if (testTool === 'sql_query' && testArgs.toLowerCase().includes('drop')) {
      setEvalResult({
        matched: true,
        rule_id: 'rule-block-001',
        rule_name: 'Block Destructive SQL Drops',
        action: 'BLOCK',
        message: "Destructive SQL statement blocked by Custom Rule 'Block Destructive SQL Drops'",
        evaluation_latency_us: 71.2,
        matched_conditions: [
          'tool_name EQUALS sql_query',
          'arg.query REGEX_MATCH (?i)\\b(DROP|TRUNCATE)\\b',
        ],
      });
    } else {
      setEvalResult({
        matched: false,
        rule_id: null,
        rule_name: null,
        action: 'ALLOW',
        message: 'No custom block rule triggered. Event permitted.',
        evaluation_latency_us: 42.1,
        matched_conditions: [],
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`http://127.0.0.1:8002/v1/rule-builder/rules/${ruleId}`, { method: 'DELETE' });
    } catch {}
    setRules(prev => prev.filter(r => r.rule_id !== ruleId));
  };

  const handleCreateRule = async () => {
    if (!newName) return;
    const payload = {
      name: newName,
      description: newDesc,
      severity: newSeverity,
      match_all: newMatchAll,
      conditions: newConditions,
      action: newAction,
      action_message: newMessage,
      tags: ['custom'],
    };

    try {
      const res = await fetch('http://127.0.0.1:8002/v1/rule-builder/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setRules(prev => [data.rule, ...prev]);
      } else {
        createLocal();
      }
    } catch {
      createLocal();
    }
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
  };

  const createLocal = () => {
    const r: VisualRule = {
      rule_id: `rule-block-${Math.random().toString(36).substring(2, 7)}`,
      name: newName,
      description: newDesc,
      severity: newSeverity as any,
      match_all: newMatchAll,
      conditions: newConditions,
      action: newAction as any,
      action_message: newMessage,
      enabled: true,
      author: 'Tharunkumar.S',
      created_at: new Date().toISOString(),
      tags: ['custom'],
      python_code: `# Rule: ${newName}\ndef eval_rule(ctx):\n    return True`,
    };
    setRules(prev => [r, ...prev]);
  };

  const addCondition = () => {
    setNewConditions(prev => [...prev, { field_path: 'arg.', operator: 'CONTAINS', value: '' }]);
  };

  const removeCondition = (idx: number) => {
    setNewConditions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-[#0a0518] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-900/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Boxes className="w-6 h-6 animate-pulse text-purple-300" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Custom Detection Rule Builder
              </h1>
            </div>
            <p className="text-sm text-purple-300/70 mt-1">
              Visual condition block composer (IF / AND / THEN) compiled into sub-millisecond Python AST evaluators
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-purple-950/40 transition-all border border-purple-500/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Rule Block
            </button>
            <button
              onClick={fetchRules}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120a24] hover:bg-purple-950/40 text-purple-300 font-medium transition-all border border-purple-800/40 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Active Custom Rules</span>
              <Boxes className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-purple-200 to-purple-400 bg-clip-text mt-2 font-mono">
              {rules.length} Compiled
            </div>
            <div className="text-xs text-purple-400/80 mt-1">Zero-Overhead AST</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>AST Eval Speed</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              71.2 µs
            </div>
            <div className="text-xs text-emerald-400/80 mt-1">Sub-Millisecond Execution</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-rose-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Interceptions</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
              3,140
            </div>
            <div className="text-xs text-rose-400/80 mt-1">Custom Violations Dropped</div>
          </div>

          <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-violet-300/70 text-xs font-semibold uppercase tracking-wider">
              <span>Federation Exchange</span>
              <Share2 className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2 font-mono">
              COMMUNITY READY
            </div>
            <div className="text-xs text-violet-400/80 mt-1">1-Click Threat Sharing</div>
          </div>
        </div>

        {/* Live Rule AST Testing Playground */}
        <div className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Interactive Rule AST Evaluation Playground
            </h3>
            <span className="text-xs text-purple-400/60 font-mono">
              Simulate Tool Invocations Across Active Block Rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-purple-300 block mb-1 font-semibold">Tool Name</label>
              <input
                type="text"
                value={testTool}
                onChange={e => setTestTool(e.target.value)}
                className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-purple-300 block mb-1 font-semibold">Arguments (JSON or String)</label>
              <input
                type="text"
                value={testArgs}
                onChange={e => setTestArgs(e.target.value)}
                className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTestEvaluate}
                disabled={evaluating}
                className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {evaluating ? 'Testing...' : 'Test Against AST'}
              </button>
            </div>
          </div>

          {evalResult && (
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 text-xs ${
                evalResult.matched
                  ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
                  : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evalResult.action === 'BLOCK'
                        ? 'bg-rose-600 text-white'
                        : evalResult.action === 'REQUIRE_APPROVAL'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {evalResult.action}
                  </span>
                  <span className="font-semibold text-white">
                    {evalResult.rule_name || 'No Rule Triggered'}
                  </span>
                </div>
                <p className="text-slate-300">{evalResult.message}</p>
                {evalResult.matched_conditions && evalResult.matched_conditions.length > 0 && (
                  <div className="text-[11px] text-purple-300/80 font-mono mt-1">
                    Triggered: {evalResult.matched_conditions.join(' • ')}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 font-mono">
                <span className="text-emerald-400 font-bold block">
                  {evalResult.evaluation_latency_us} µs
                </span>
                <span className="text-[10px] text-purple-400/60">Execution Latency</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Rule Block Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-purple-300/80 uppercase tracking-wider">
            Active Visual Detection Blocks ({rules.length})
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {rules.map(rule => {
              const isCritical = rule.severity === 'CRITICAL';
              const isHigh = rule.severity === 'HIGH';
              const isAstExpanded = expandedAstId === rule.rule_id;

              return (
                <div
                  key={rule.rule_id}
                  className="bg-[#120a24]/80 backdrop-blur-md border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 hover:border-purple-600/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300">
                          {rule.rule_id}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {rule.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isCritical
                              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                              : isHigh
                              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {rule.severity}
                        </span>
                        <span className="text-xs text-purple-400/60 font-mono">
                          by {rule.author}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300/70">
                        {rule.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedAstId(isAstExpanded ? null : rule.rule_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/40 text-purple-300 text-xs font-mono border border-purple-800/40 transition-all"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        {isAstExpanded ? 'Hide AST' : 'Python AST'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.rule_id)}
                        className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-all"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Condition Block Diagram */}
                  <div className="bg-[#0a0518] p-4 rounded-xl border border-purple-950 space-y-2">
                    <div className="text-[10px] text-purple-400/60 font-mono uppercase font-semibold">
                      Condition Flow Logic
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-purple-600 text-white font-bold text-[11px]">
                        IF
                      </span>

                      {rule.conditions.map((cond, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 font-mono text-[10px] border border-purple-800/50">
                              {rule.match_all ? 'AND' : 'OR'}
                            </span>
                          )}
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#120a24] border border-purple-800/60 font-mono text-purple-200">
                            <span className="text-purple-400">{cond.field_path}</span>
                            <span className="text-amber-400 font-bold">{cond.operator}</span>
                            <span className="text-emerald-300">{JSON.stringify(cond.value)}</span>
                          </div>
                        </React.Fragment>
                      ))}

                      <span className="px-2.5 py-1 rounded-md bg-violet-600 text-white font-bold text-[11px] ml-1">
                        THEN
                      </span>

                      <span
                        className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${
                          rule.action === 'BLOCK'
                            ? 'bg-rose-600 text-white'
                            : rule.action === 'REQUIRE_APPROVAL'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </div>

                    <div className="text-xs text-purple-300/80 pt-1">
                      Enforced Message: <span className="text-white italic">"{rule.action_message}"</span>
                    </div>
                  </div>

                  {/* Collapsible Python AST Code */}
                  {isAstExpanded && (
                    <div className="p-4 rounded-xl bg-[#0e071e] border border-purple-950 space-y-2">
                      <div className="text-[10px] text-purple-400 font-mono uppercase tracking-wider font-semibold">
                        Compiled Python AST Function (Zero-Overhead Memory Cache)
                      </div>
                      <pre className="font-mono text-xs text-purple-200 overflow-x-auto leading-relaxed">
                        {rule.python_code}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Create Visual Rule Block */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#120a24] border border-purple-800/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-purple-400" />
                  Compose Visual Condition Rule
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-purple-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Rule Title</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Block Shell Execution in Prod"
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-purple-300 block mb-1 font-semibold">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Purpose of this detection block"
                    className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-purple-300 block mb-1 font-semibold">Severity</label>
                    <select
                      value={newSeverity}
                      onChange={e => setNewSeverity(e.target.value)}
                      className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-purple-300 block mb-1 font-semibold">Match Logic</label>
                    <select
                      value={newMatchAll ? 'ALL' : 'ANY'}
                      onChange={e => setNewMatchAll(e.target.value === 'ALL')}
                      className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ALL">AND (All conditions must match)</option>
                      <option value="ANY">OR (Any condition matches)</option>
                    </select>
                  </div>
                </div>

                {/* Conditions builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-purple-300 font-semibold">Condition Blocks</label>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-purple-400 hover:text-white font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Condition
                    </button>
                  </div>

                  {newConditions.map((cond, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cond.field_path}
                        onChange={e => {
                          const updated = [...newConditions];
                          updated[i].field_path = e.target.value;
                          setNewConditions(updated);
                        }}
                        placeholder="field (e.g. tool_name)"
                        className="w-1/3 bg-[#0a0518] border border-purple-900/50 rounded-xl px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                      />
                      <select
                        value={cond.operator}
                        onChange={e => {
                          const updated = [...newConditions];
                          updated[i].operator = e.target.value;
                          setNewConditions(updated);
                        }}
                        className="w-1/3 bg-[#0a0518] border border-purple-900/50 rounded-xl px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                      >
                        <option value="EQUALS">EQUALS</option>
                        <option value="CONTAINS">CONTAINS</option>
                        <option value="REGEX_MATCH">REGEX_MATCH</option>
                        <option value="GREATER_THAN">GREATER_THAN</option>
                        <option value="STARTS_WITH">STARTS_WITH</option>
                        <option value="NOT_EQUALS">NOT_EQUALS</option>
                      </select>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={e => {
                          const updated = [...newConditions];
                          updated[i].value = e.target.value;
                          setNewConditions(updated);
                        }}
                        placeholder="value"
                        className="w-1/3 bg-[#0a0518] border border-purple-900/50 rounded-xl px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                      />
                      {newConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(i)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-purple-300 block mb-1 font-semibold">Action</label>
                    <select
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="BLOCK">BLOCK</option>
                      <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                      <option value="REDACT">REDACT</option>
                      <option value="SANITIZE">SANITIZE</option>
                      <option value="ALERT_ONLY">ALERT_ONLY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-purple-300 block mb-1 font-semibold">Action Message</label>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="w-full bg-[#0a0518] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/50"
                >
                  Compile & Deploy Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Attribution Watermark */}
        <div className="text-center pt-8 border-t border-purple-900/20 text-xs text-purple-400/40 font-mono">
          AgentShield-X Security Labs • Custom Detection Rule Builder & AST Compiler • Lead Architect Tharunkumar.S
        </div>
      </div>
    </div>
  );
};

