import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{P as r}from"./Panel-CLVNV0NK.js";import"./index-Bc2G9s8g.js";import"./cn-DOIGBiOF.js";const v={title:"Components/Panel",component:r,tags:["autodocs"],args:{title:"System Telemetry",subtitle:"Real-time inspection of decision service latency and health"}},t={render:()=>e.jsx(r,{title:"System Telemetry",subtitle:"Real-time inspection of decision service latency and health",footer:e.jsx("span",{children:"Status: Operational (p95: 18.4ms)"}),className:"max-w-lg",children:e.jsx("p",{className:"text-xs text-mut font-sans leading-relaxed",children:"The AgentShield-X gateway is intercepting tool calls. All 7 security detectors and calibrated monotonic LightGBM risk stackers are active."})})},a={render:()=>e.jsx(r,{variant:"shield",title:"Shield Boundary Active",subtitle:"Autonomous fail-closed enforcement",className:"max-w-lg",children:e.jsxs("div",{className:"text-xs text-fg font-mono",children:["Active Policy: ",e.jsx("span",{className:"text-ok",children:"Strict-Enterprise-v1.4"})]})})},s={render:()=>e.jsx(r,{variant:"critical",title:"Critical Incident Detected",subtitle:"Exfiltration honeytool trigger intercepted",className:"max-w-lg",children:e.jsxs("div",{className:"text-xs text-bad font-mono",children:["Event: ",e.jsx("span",{className:"underline",children:"export_all_customers()"})," triggered."]})})};var n,i,l;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <Panel title="System Telemetry" subtitle="Real-time inspection of decision service latency and health" footer={<span>Status: Operational (p95: 18.4ms)</span>} className="max-w-lg">\r
      <p className="text-xs text-mut font-sans leading-relaxed">\r
        The AgentShield-X gateway is intercepting tool calls. All 7 security detectors\r
        and calibrated monotonic LightGBM risk stackers are active.\r
      </p>\r
    </Panel>
}`,...(l=(i=t.parameters)==null?void 0:i.docs)==null?void 0:l.source}}};var o,c,d;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => <Panel variant="shield" title="Shield Boundary Active" subtitle="Autonomous fail-closed enforcement" className="max-w-lg">\r
      <div className="text-xs text-fg font-mono">\r
        Active Policy: <span className="text-ok">Strict-Enterprise-v1.4</span>\r
      </div>\r
    </Panel>
}`,...(d=(c=a.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};var m,p,x;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <Panel variant="critical" title="Critical Incident Detected" subtitle="Exfiltration honeytool trigger intercepted" className="max-w-lg">\r
      <div className="text-xs text-bad font-mono">\r
        Event: <span className="underline">export_all_customers()</span> triggered.\r
      </div>\r
    </Panel>
}`,...(x=(p=s.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};const y=["Default","ShieldVariant","CriticalThreatVariant"];export{s as CriticalThreatVariant,t as Default,a as ShieldVariant,y as __namedExportsOrder,v as default};
