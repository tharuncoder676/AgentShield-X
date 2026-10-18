import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{r as c}from"./index-Bc2G9s8g.js";import{c as v}from"./cn-DOIGBiOF.js";import{S,a as w}from"./shield-B9N_AElG.js";import{X as j}from"./x-BpDbHPVP.js";import{c as C}from"./createLucideIcon-Si29XmKi.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=C("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]),u=({isOpen:a,onClose:s,items:d,placeholder:b="Search pages, agents, incidents, or actions... (Cmd+K)"})=>{const[i,p]=c.useState(""),[m,o]=c.useState(0);c.useEffect(()=>{const t=n=>{(n.metaKey||n.ctrlKey)&&n.key==="k"&&(n.preventDefault(),a&&s()),n.key==="Escape"&&a&&s()};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[a,s]);const r=d.filter(t=>t.title.toLowerCase().includes(i.toLowerCase())||t.category.toLowerCase().includes(i.toLowerCase())||t.subtitle&&t.subtitle.toLowerCase().includes(i.toLowerCase())),y=t=>{t.key==="ArrowDown"?(t.preventDefault(),o(n=>(n+1)%(r.length||1))):t.key==="ArrowUp"?(t.preventDefault(),o(n=>(n-1+r.length)%(r.length||1))):t.key==="Enter"&&r[m]&&(t.preventDefault(),r[m].onSelect(),s())};return a?e.jsxs("div",{className:"fixed inset-0 z-50 flex items-start justify-center pt-20 p-4",role:"dialog","aria-modal":"true","aria-label":"Command Palette",children:[e.jsx("div",{className:"fixed inset-0 bg-bg/80 backdrop-blur-sm transition-opacity",onClick:s,"aria-hidden":"true"}),e.jsxs("div",{className:"relative z-10 w-full max-w-xl bg-panel border border-line shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[70vh] font-sans",children:[e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b border-line bg-bg/40",children:[e.jsx(S,{size:16,className:"text-mut shrink-0"}),e.jsx("input",{type:"text",value:i,onChange:t=>{p(t.target.value),o(0)},onKeyDown:y,placeholder:b,autoFocus:!0,className:"w-full bg-transparent text-sm text-fg placeholder:text-mut/70 focus:outline-none font-mono"}),i&&e.jsx("button",{onClick:()=>p(""),className:"p-1 text-mut hover:text-fg text-xs","aria-label":"Clear query",children:e.jsx(j,{size:14})}),e.jsx("kbd",{className:"hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-line/40 text-mut rounded-sm border border-line",children:"ESC"})]}),e.jsx("div",{className:"overflow-y-auto p-2 divide-y divide-line/30",children:r.length===0?e.jsx("div",{className:"p-8 text-center text-xs text-mut font-sans",children:"No matching commands or resources found."}):r.map((t,n)=>{const x=n===m;return e.jsxs("div",{onClick:()=>{t.onSelect(),s()},onMouseEnter:()=>o(n),className:v("flex items-center justify-between p-2.5 rounded-sm cursor-pointer transition-colors text-xs font-mono",x?"bg-ok/10 text-fg border-l-2 border-l-ok":"text-fg/80 hover:bg-line/20"),children:[e.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[e.jsx("div",{className:"text-mut shrink-0",children:t.icon||e.jsx(w,{size:14})}),e.jsxs("div",{className:"truncate",children:[e.jsx("span",{className:"font-chakra font-medium text-sm text-fg mr-2",children:t.title}),t.subtitle&&e.jsx("span",{className:"text-mut text-xs",children:t.subtitle})]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("span",{className:"text-[10px] uppercase font-chakra text-mut px-1.5 py-0.5 rounded-sm bg-line/30 border border-line",children:t.category}),x&&e.jsx(k,{size:13,className:"text-ok"})]})]},t.id)})}),e.jsxs("div",{className:"px-4 py-2 border-t border-line bg-bg/50 text-[11px] text-mut flex items-center justify-between font-chakra",children:[e.jsx("span",{children:"Navigate with ↑ ↓ and Enter"}),e.jsx("span",{children:"AgentShield-X Security Hub"})]})]})]}):null};u.__docgenInfo={description:"",methods:[],displayName:"CommandPalette",props:{isOpen:{required:!0,tsType:{name:"boolean"},description:""},onClose:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},items:{required:!0,tsType:{name:"Array",elements:[{name:"CommandItem"}],raw:"CommandItem[]"},description:""},placeholder:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Search pages, agents, incidents, or actions... (Cmd+K)"',computed:!1}}}};const D={title:"Components/CommandPalette",component:u,tags:["autodocs"]},l={render:()=>{const[a,s]=c.useState(!0),d=[{id:"1",title:"Live Feed",category:"Pages",subtitle:"Streaming decisions & trace events",onSelect:()=>{}},{id:"2",title:"Incidents & Triage",category:"Pages",subtitle:"Review 3 active flagged incidents",onSelect:()=>{}},{id:"3",title:"Architecture Explorer",category:"Pages",subtitle:"Interactive data plane & ML map",onSelect:()=>{}},{id:"4",title:"Support-Agent-01",category:"Agents",subtitle:"Customer support LLM agent",onSelect:()=>{}},{id:"5",title:"Bypass Shield (Emergency)",category:"Actions",subtitle:"Disable interception for testing",onSelect:()=>{}},{id:"6",title:"Verify Audit Hash-Chain",category:"Actions",subtitle:"Verify SHA-256 tamper-evident logs",onSelect:()=>{}}];return e.jsxs("div",{children:[e.jsx("button",{onClick:()=>s(!0),className:"px-3 py-1.5 rounded-sm bg-panel border border-line text-xs font-chakra uppercase",children:"Open Command Palette (Cmd+K)"}),e.jsx(u,{isOpen:a,onClose:()=>s(!1),items:d})]})}};var g,f,h;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    const items = [{
      id: "1",
      title: "Live Feed",
      category: "Pages",
      subtitle: "Streaming decisions & trace events",
      onSelect: () => {}
    }, {
      id: "2",
      title: "Incidents & Triage",
      category: "Pages",
      subtitle: "Review 3 active flagged incidents",
      onSelect: () => {}
    }, {
      id: "3",
      title: "Architecture Explorer",
      category: "Pages",
      subtitle: "Interactive data plane & ML map",
      onSelect: () => {}
    }, {
      id: "4",
      title: "Support-Agent-01",
      category: "Agents",
      subtitle: "Customer support LLM agent",
      onSelect: () => {}
    }, {
      id: "5",
      title: "Bypass Shield (Emergency)",
      category: "Actions",
      subtitle: "Disable interception for testing",
      onSelect: () => {}
    }, {
      id: "6",
      title: "Verify Audit Hash-Chain",
      category: "Actions",
      subtitle: "Verify SHA-256 tamper-evident logs",
      onSelect: () => {}
    }];
    return <div>\r
        <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-sm bg-panel border border-line text-xs font-chakra uppercase">\r
          Open Command Palette (Cmd+K)\r
        </button>\r
\r
        <CommandPalette isOpen={open} onClose={() => setOpen(false)} items={items} />\r
      </div>;
  }
}`,...(h=(f=l.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};const K=["GlobalNavigation"];export{l as GlobalNavigation,K as __namedExportsOrder,D as default};
