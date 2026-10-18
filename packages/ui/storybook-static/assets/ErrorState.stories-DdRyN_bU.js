import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{c as p}from"./cn-DOIGBiOF.js";import{c as a}from"./createLucideIcon-Si29XmKi.js";import"./index-Bc2G9s8g.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=a("OctagonAlert",[["polygon",{points:"7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2",key:"h1p8hx"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=a("RotateCw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]),c=({title:d="Service Interrupted",error:l,remediation:r,onRetry:o,className:m})=>e.jsxs("div",{role:"alert",className:p("flex flex-col items-center justify-center p-8 text-center border border-bad/40 rounded-sm bg-bad/5 font-sans",m),children:[e.jsx("div",{className:"w-12 h-12 rounded-none border border-bad/50 flex items-center justify-center bg-bg text-bad mb-4",children:e.jsx(u,{size:24})}),e.jsx("h3",{className:"font-chakra text-base font-semibold tracking-wide text-bad uppercase mb-1",children:d}),e.jsx("p",{className:"text-xs text-fg/90 max-w-md font-mono bg-bg/60 p-2 rounded-sm border border-bad/30 my-2 break-all",children:l}),r&&e.jsxs("p",{className:"text-xs text-mut max-w-sm mb-4 leading-relaxed",children:["How to fix: ",r]}),o&&e.jsxs("button",{onClick:o,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-panel hover:bg-line/20 text-fg font-chakra font-medium text-xs tracking-wider uppercase transition-colors",children:[e.jsx(x,{size:13}),e.jsx("span",{children:"Retry connection"})]})]});c.__docgenInfo={description:"",methods:[],displayName:"ErrorState",props:{title:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Service Interrupted"',computed:!1}},error:{required:!0,tsType:{name:"string"},description:""},remediation:{required:!1,tsType:{name:"string"},description:""},onRetry:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};const y={title:"Components/ErrorState",component:c,tags:["autodocs"]},t={args:{title:"Decision Service Unreachable",error:"HTTPConnectionPool(host='decision-service', port=8001): Read timed out (0.5s limit)",remediation:"Check if the decision service container is healthy on port 8001.",onRetry:()=>{}}};var n,s,i;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    title: "Decision Service Unreachable",
    error: "HTTPConnectionPool(host='decision-service', port=8001): Read timed out (0.5s limit)",
    remediation: "Check if the decision service container is healthy on port 8001.",
    onRetry: () => {}
  }
}`,...(i=(s=t.parameters)==null?void 0:s.docs)==null?void 0:i.source}}};const v=["ConnectionRefused"];export{t as ConnectionRefused,v as __namedExportsOrder,y as default};
