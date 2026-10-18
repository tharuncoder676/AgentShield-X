import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{r as b}from"./index-Bc2G9s8g.js";import{c as N}from"./cn-DOIGBiOF.js";import{c as w}from"./createLucideIcon-Si29XmKi.js";import{C as m}from"./check-eOoujeM4.js";import{C as E}from"./copy-CE-RHsgK.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=w("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]),o=({value:t,onChange:a,readOnly:l=!1,language:v="rego",diffValue:R,className:j,error:s})=>{const[i,c]=b.useState(!1),k=t.split(`
`),C=()=>{navigator.clipboard.writeText(t),c(!0),setTimeout(()=>c(!1),2e3)};return e.jsxs("div",{className:N("rounded-sm border border-line bg-panel overflow-hidden font-mono text-xs flex flex-col",j),children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 border-b border-line bg-bg/50",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"font-chakra uppercase text-fg font-semibold tracking-wider text-[11px]",children:[v," policy"]}),l&&e.jsx("span",{className:"text-[10px] text-mut px-1.5 py-0.5 rounded-sm bg-line/40",children:"READ-ONLY"}),s?e.jsxs("span",{className:"flex items-center gap-1 text-[11px] text-bad font-chakra",children:[e.jsx(T,{size:12})," Syntax Error"]}):e.jsxs("span",{className:"flex items-center gap-1 text-[11px] text-ok font-chakra",children:[e.jsx(m,{size:12})," Validated"]})]}),e.jsxs("button",{type:"button",onClick:C,className:"flex items-center gap-1 text-mut hover:text-fg text-[11px] px-1.5 py-0.5 rounded-sm hover:bg-line/20 transition-colors",title:"Copy policy",children:[i?e.jsx(m,{size:12,className:"text-ok"}):e.jsx(E,{size:12}),e.jsx("span",{children:i?"Copied":"Copy"})]})]}),e.jsxs("div",{className:"flex flex-1 overflow-auto max-h-[420px] bg-bg/30",children:[e.jsx("div",{className:"select-none py-3 pl-3 pr-2 text-right text-mut/40 font-mono text-xs border-r border-line/30 bg-bg/20 min-w-[3rem]","aria-hidden":"true",children:k.map((d,p)=>e.jsx("div",{className:"leading-5",children:p+1},p))}),l?e.jsx("pre",{className:"p-3 text-xs leading-5 text-fg font-mono overflow-x-auto flex-1 whitespace-pre",children:t}):e.jsx("textarea",{value:t,onChange:d=>a&&a(d.target.value),spellCheck:!1,className:"flex-1 p-3 bg-transparent text-xs leading-5 text-fg font-mono resize-none focus:outline-none min-h-[200px]"})]}),s&&e.jsx("div",{className:"px-4 py-2 bg-bad/10 border-t border-bad/30 text-bad text-xs font-sans",children:s})]})};o.__docgenInfo={description:"",methods:[],displayName:"PolicyEditor",props:{value:{required:!0,tsType:{name:"string"},description:""},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(val: string) => void",signature:{arguments:[{type:{name:"string"},name:"val"}],return:{name:"void"}}},description:""},readOnly:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},language:{required:!1,tsType:{name:"union",raw:'"rego" | "json" | "yaml"',elements:[{name:"literal",value:'"rego"'},{name:"literal",value:'"json"'},{name:"literal",value:'"yaml"'}]},description:"",defaultValue:{value:'"rego"',computed:!1}},diffValue:{required:!1,tsType:{name:"string"},description:""},className:{required:!1,tsType:{name:"string"},description:""},error:{required:!1,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""}}};const S=`package agentshield.authz

default allow = false

# Rule 1: Honeytools are unconditionally blocked
deny[msg] {
    input.tool.name == "export_all_customers"
    msg := "Critical honeytool trap triggered"
}

# Rule 2: Tainted context cannot reach external communication sinks
deny[msg] {
    input.tool.sensitivity == "critical"
    count(input.taint) > 0
    msg := "Tainted context segment flowing to sensitive sink"
}

# Rule 3: Allow if no deny rules fired
allow {
    count(deny) == 0
}`,O={title:"Components/PolicyEditor",component:o,tags:["autodocs"]},n={args:{value:S,readOnly:!0,language:"rego"}},r={render:()=>{const[t,a]=b.useState(`package agentshield.authz

default allow = true

# Missing bracket syntax error:
deny[msg {
    input.risk > 0.7
}`);return e.jsx(o,{value:t,onChange:a,error:"Syntax error at line 6, col 10: unexpected token '{', expected ']'"})}};var x,u,g;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    value: sampleRego,
    readOnly: true,
    language: "rego"
  }
}`,...(g=(u=n.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var f,y,h;r.parameters={...r.parameters,docs:{...(f=r.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const [code, setCode] = useState(\`package agentshield.authz\\n\\ndefault allow = true\\n\\n# Missing bracket syntax error:\\ndeny[msg {\\n    input.risk > 0.7\\n}\`);
    return <PolicyEditor value={code} onChange={setCode} error="Syntax error at line 6, col 10: unexpected token '{', expected ']'" />;
  }
}`,...(h=(y=r.parameters)==null?void 0:y.docs)==null?void 0:h.source}}};const I=["ValidRegoPolicy","EditableWithSyntaxError"];export{r as EditableWithSyntaxError,n as ValidRegoPolicy,I as __namedExportsOrder,O as default};
