import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{r as p}from"./index-Bc2G9s8g.js";import{c as i}from"./cn-DOIGBiOF.js";import{c}from"./createLucideIcon-Si29XmKi.js";import{V as M}from"./VerdictBadge-C9B2uJkd.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=c("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=c("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=c("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=c("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);function u({columns:s,data:o,keyExtractor:j,isLoading:N=!1,emptyMessage:T="No matching records found.",onRowClick:m,pageSize:r=10,className:w}){const[a,h]=p.useState(1),[x,C]=p.useState(null),[f,y]=p.useState("asc"),_=t=>{x===t?y(f==="asc"?"desc":"asc"):(C(t),y("asc"))},l=Math.ceil(o.length/r)||1,g=o.slice((a-1)*r,a*r);return e.jsxs("div",{className:i("border border-line rounded-sm bg-panel overflow-hidden font-sans",w),children:[e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs border-collapse",children:[e.jsx("thead",{children:e.jsx("tr",{className:"border-b border-line bg-bg/50 text-mut uppercase font-chakra font-medium tracking-wider select-none",children:s.map(t=>e.jsx("th",{onClick:()=>t.sortable&&_(t.key),className:i("px-4 py-3",t.sortable&&"cursor-pointer hover:text-fg transition-colors",t.className),children:e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{children:t.header}),t.sortable&&x===t.key&&(f==="asc"?e.jsx(E,{size:13}):e.jsx(D,{size:13}))]})},t.key))})}),e.jsx("tbody",{className:"divide-y divide-line font-mono text-fg",children:N?Array.from({length:4}).map((t,n)=>e.jsx("tr",{className:"animate-pulse",children:e.jsx("td",{colSpan:s.length,className:"px-4 py-3 text-center text-mut font-sans",children:"Loading records..."})},n)):g.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:s.length,className:"px-4 py-8 text-center text-mut font-sans",children:T})}):g.map(t=>e.jsx("tr",{onClick:()=>m&&m(t),className:i("transition-colors hover:bg-line/20",m&&"cursor-pointer"),children:s.map(n=>e.jsx("td",{className:i("px-4 py-3 align-middle",n.className),children:n.cell(t)},n.key))},j(t)))})]})}),l>1&&e.jsxs("div",{className:"flex items-center justify-between px-4 py-2.5 border-t border-line bg-bg/40 text-xs text-mut font-sans",children:[e.jsxs("span",{children:["Showing ",(a-1)*r+1,"–",Math.min(a*r,o.length)," of ",o.length]}),e.jsxs("div",{className:"flex items-center gap-1 font-chakra",children:[e.jsx("button",{onClick:()=>h(t=>Math.max(1,t-1)),disabled:a===1,className:"p-1 rounded-sm border border-line hover:bg-line/20 disabled:opacity-30 disabled:cursor-not-allowed text-fg","aria-label":"Previous Page",children:e.jsx(q,{size:14})}),e.jsxs("span",{className:"px-2 text-fg tabular-nums",children:[a," / ",l]}),e.jsx("button",{onClick:()=>h(t=>Math.min(l,t+1)),disabled:a===l,className:"p-1 rounded-sm border border-line hover:bg-line/20 disabled:opacity-30 disabled:cursor-not-allowed text-fg","aria-label":"Next Page",children:e.jsx(S,{size:14})})]})]})]})}u.__docgenInfo={description:"",methods:[],displayName:"DataTable",props:{columns:{required:!0,tsType:{name:"Array",elements:[{name:"Column",elements:[{name:"T"}],raw:"Column<T>"}],raw:"Column<T>[]"},description:""},data:{required:!0,tsType:{name:"Array",elements:[{name:"T"}],raw:"T[]"},description:""},keyExtractor:{required:!0,tsType:{name:"signature",type:"function",raw:"(row: T) => string",signature:{arguments:[{type:{name:"T"},name:"row"}],return:{name:"string"}}},description:""},isLoading:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},emptyMessage:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"No matching records found."',computed:!1}},onRowClick:{required:!1,tsType:{name:"signature",type:"function",raw:"(row: T) => void",signature:{arguments:[{type:{name:"T"},name:"row"}],return:{name:"void"}}},description:""},pageSize:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"10",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""}}};const L=[{id:"ev_1",timestamp:"00:14:01",tool:"read_webpage",verdict:"allow",risk:.02,latencyMs:11.2},{id:"ev_2",timestamp:"00:14:03",tool:"search_customers",verdict:"allow",risk:.05,latencyMs:14.8},{id:"ev_3",timestamp:"00:14:09",tool:"send_email",verdict:"block",risk:.94,latencyMs:16.4},{id:"ev_4",timestamp:"00:14:15",tool:"run_sql",verdict:"sanitize",risk:.28,latencyMs:12.9},{id:"ev_5",timestamp:"00:14:22",tool:"read_pdf",verdict:"allow",risk:.01,latencyMs:9.7}],I={title:"Components/DataTable",component:u,tags:["autodocs"]},d={render:()=>e.jsx(u,{columns:[{key:"id",header:"Event ID",cell:s=>e.jsx("span",{className:"font-mono text-xs",children:s.id})},{key:"timestamp",header:"Time",cell:s=>e.jsx("span",{children:s.timestamp}),sortable:!0},{key:"tool",header:"Tool Name",cell:s=>e.jsx("span",{className:"font-chakra font-medium",children:s.tool}),sortable:!0},{key:"verdict",header:"Verdict",cell:s=>e.jsx(M,{action:s.verdict,size:"sm"})},{key:"risk",header:"Risk",cell:s=>e.jsx("span",{className:"tabular-nums font-mono",children:s.risk.toFixed(2)}),sortable:!0},{key:"latencyMs",header:"Latency",cell:s=>e.jsxs("span",{className:"text-mut font-mono",children:[s.latencyMs,"ms"]})}],data:L,keyExtractor:s=>s.id,pageSize:5})};var b,k,v;d.parameters={...d.parameters,docs:{...(b=d.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <DataTable<AuditLogRow> columns={[{
    key: "id",
    header: "Event ID",
    cell: r => <span className="font-mono text-xs">{r.id}</span>
  }, {
    key: "timestamp",
    header: "Time",
    cell: r => <span>{r.timestamp}</span>,
    sortable: true
  }, {
    key: "tool",
    header: "Tool Name",
    cell: r => <span className="font-chakra font-medium">{r.tool}</span>,
    sortable: true
  }, {
    key: "verdict",
    header: "Verdict",
    cell: r => <VerdictBadge action={r.verdict} size="sm" />
  }, {
    key: "risk",
    header: "Risk",
    cell: r => <span className="tabular-nums font-mono">{r.risk.toFixed(2)}</span>,
    sortable: true
  }, {
    key: "latencyMs",
    header: "Latency",
    cell: r => <span className="text-mut font-mono">{r.latencyMs}ms</span>
  }]} data={mockData} keyExtractor={r => r.id} pageSize={5} />
}`,...(v=(k=d.parameters)==null?void 0:k.docs)==null?void 0:v.source}}};const B=["AuditGrid"];export{d as AuditGrid,B as __namedExportsOrder,I as default};
