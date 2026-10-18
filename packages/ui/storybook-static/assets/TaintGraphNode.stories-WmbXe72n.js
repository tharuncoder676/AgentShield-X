import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{c as p}from"./cn-DOIGBiOF.js";import{S as x}from"./shield-alert-jfVm301B.js";import{c as l}from"./createLucideIcon-Si29XmKi.js";import"./index-Bc2G9s8g.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=l("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=l("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=l("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=l("Terminal",[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]]),s=({id:z,type:u,label:c,sublabel:o,trust:d="untrusted",isTainted:t=!1,taintOrigins:m=[],className:_,onClick:a})=>{const j=()=>{switch(u){case"source":return e.jsx(q,{size:14,className:"text-warn"});case"context":return e.jsx(S,{size:14,className:"text-mut"});case"agent_step":return e.jsx(O,{size:14,className:"text-fg"});case"sink":return t?e.jsx(x,{size:14,className:"text-bad"}):e.jsx(E,{size:14,className:"text-ok"})}},w=t?"border-bad/60 bg-bad/10 shadow-glow-bad":d==="untrusted"?"border-warn/40 bg-warn/5":"border-line bg-panel";return e.jsxs("div",{onClick:a,role:a?"button":void 0,tabIndex:a?0:void 0,className:p("rounded-sm border p-3 min-w-[180px] max-w-[240px] text-xs font-mono transition-all",w,a&&"cursor-pointer hover:border-mut/80",_),children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 mb-1.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[j(),e.jsx("span",{className:"font-chakra uppercase font-semibold text-[11px] text-fg",children:u.replace("_"," ")})]}),e.jsx("span",{className:p("text-[9px] px-1 py-0.2 rounded-sm font-chakra uppercase",t?"bg-bad/20 text-bad font-bold":d==="untrusted"?"bg-warn/20 text-warn":"bg-line/40 text-mut"),children:t?"TAINTED":d})]}),e.jsx("div",{className:"font-chakra font-medium text-fg text-sm truncate mb-0.5",title:c,children:c}),o&&e.jsx("div",{className:"text-[11px] text-mut truncate font-mono",title:o,children:o}),t&&m.length>0&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-bad/30 text-[10px] text-bad flex items-center gap-1",children:[e.jsx(x,{size:11,className:"shrink-0"}),e.jsxs("span",{className:"truncate",children:["Taint: ",m.join(", ")]})]})]})};s.__docgenInfo={description:"",methods:[],displayName:"TaintGraphNode",props:{id:{required:!0,tsType:{name:"string"},description:""},type:{required:!0,tsType:{name:"union",raw:'"source" | "context" | "agent_step" | "sink"',elements:[{name:"literal",value:'"source"'},{name:"literal",value:'"context"'},{name:"literal",value:'"agent_step"'},{name:"literal",value:'"sink"'}]},description:""},label:{required:!0,tsType:{name:"string"},description:""},sublabel:{required:!1,tsType:{name:"string"},description:""},trust:{required:!1,tsType:{name:"union",raw:'"system" | "user" | "tool" | "untrusted"',elements:[{name:"literal",value:'"system"'},{name:"literal",value:'"user"'},{name:"literal",value:'"tool"'},{name:"literal",value:'"untrusted"'}]},description:"",defaultValue:{value:'"untrusted"',computed:!1}},isTainted:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},taintOrigins:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"",defaultValue:{value:"[]",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const M={title:"Components/TaintGraphNode",component:s,tags:["autodocs"]},r={args:{id:"src_1",type:"source",label:"Webpage: https://docs.example.test",sublabel:"sha256: 4f98...c01a",trust:"untrusted",isTainted:!1}},n={args:{id:"sink_1",type:"sink",label:"Tool: send_email",sublabel:"to: exfil@attacker.example.test",trust:"untrusted",isTainted:!0,taintOrigins:["seg_webpage_4f98"]}},i={render:()=>e.jsxs("div",{className:"flex flex-col items-center gap-3 p-4 bg-bg rounded-sm border border-line max-w-sm",children:[e.jsx(s,{id:"node_1",type:"source",label:"Untrusted Inbound Email",sublabel:"src: attacker@evil.example.test",trust:"untrusted"}),e.jsx("div",{className:"text-line text-xs font-mono",children:"↓ extracts context"}),e.jsx(s,{id:"node_2",type:"context",label:"ContextSegment #seg_492",sublabel:"Taint label: UNTRUSTED",trust:"untrusted",isTainted:!0,taintOrigins:["email_inbox"]}),e.jsx("div",{className:"text-bad text-xs font-mono",children:"↓ flows into arguments"}),e.jsx(s,{id:"node_3",type:"sink",label:"Target Sink: send_email()",sublabel:"BLOCKED: Untrusted data exfil",trust:"untrusted",isTainted:!0,taintOrigins:["seg_492"]})]})};var b,g,f;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    id: "src_1",
    type: "source",
    label: "Webpage: https://docs.example.test",
    sublabel: "sha256: 4f98...c01a",
    trust: "untrusted",
    isTainted: false
  }
}`,...(f=(g=r.parameters)==null?void 0:g.docs)==null?void 0:f.source}}};var y,h,T;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    id: "sink_1",
    type: "sink",
    label: "Tool: send_email",
    sublabel: "to: exfil@attacker.example.test",
    trust: "untrusted",
    isTainted: true,
    taintOrigins: ["seg_webpage_4f98"]
  }
}`,...(T=(h=n.parameters)==null?void 0:h.docs)==null?void 0:T.source}}};var N,v,k;i.parameters={...i.parameters,docs:{...(N=i.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col items-center gap-3 p-4 bg-bg rounded-sm border border-line max-w-sm">\r
      <TaintGraphNode id="node_1" type="source" label="Untrusted Inbound Email" sublabel="src: attacker@evil.example.test" trust="untrusted" />\r
      <div className="text-line text-xs font-mono">↓ extracts context</div>\r
      <TaintGraphNode id="node_2" type="context" label="ContextSegment #seg_492" sublabel="Taint label: UNTRUSTED" trust="untrusted" isTainted={true} taintOrigins={["email_inbox"]} />\r
      <div className="text-bad text-xs font-mono">↓ flows into arguments</div>\r
      <TaintGraphNode id="node_3" type="sink" label="Target Sink: send_email()" sublabel="BLOCKED: Untrusted data exfil" trust="untrusted" isTainted={true} taintOrigins={["seg_492"]} />\r
    </div>
}`,...(k=(v=i.parameters)==null?void 0:v.docs)==null?void 0:k.source}}};const A=["SourceNode","TaintedSinkNode","TaintPathVisual"];export{r as SourceNode,i as TaintPathVisual,n as TaintedSinkNode,A as __namedExportsOrder,M as default};
