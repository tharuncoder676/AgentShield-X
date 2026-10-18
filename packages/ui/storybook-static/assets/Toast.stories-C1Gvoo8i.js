import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{r as T}from"./index-Bc2G9s8g.js";import{c}from"./cn-DOIGBiOF.js";import{c as d}from"./createLucideIcon-Si29XmKi.js";import{T as C}from"./triangle-alert-C9b_gd5a.js";import{X as N}from"./x-BpDbHPVP.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=d("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=d("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=d("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]),l=({toast:t,onDismiss:n,className:r})=>{const s={success:{icon:e.jsx(w,{size:16,className:"text-ok shrink-0 mt-0.5"}),border:"border-ok/40 bg-panel",titleColor:"text-ok"},error:{icon:e.jsx(j,{size:16,className:"text-bad shrink-0 mt-0.5"}),border:"border-bad/50 bg-panel",titleColor:"text-bad"},warning:{icon:e.jsx(C,{size:16,className:"text-warn shrink-0 mt-0.5"}),border:"border-warn/40 bg-panel",titleColor:"text-warn"},info:{icon:e.jsx(I,{size:16,className:"text-mut shrink-0 mt-0.5"}),border:"border-line bg-panel",titleColor:"text-fg"}}[t.type];return e.jsxs("div",{role:"alert",className:c("flex items-start gap-3 p-4 rounded-sm border shadow-lg max-w-md w-full font-sans transition-all animate-in slide-in-from-top-2 duration-150",s.border,r),children:[s.icon,e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:c("font-chakra text-sm font-semibold tracking-wide",s.titleColor),children:t.title}),t.message&&e.jsx("p",{className:"text-xs text-fg/80 mt-1 leading-relaxed",children:t.message}),t.remediation&&e.jsxs("p",{className:"text-xs text-mut font-mono mt-1 bg-bg/50 p-1.5 rounded-sm border border-line/40",children:["Fix: ",t.remediation]}),t.action&&e.jsx("button",{onClick:t.action.onClick,className:"mt-2 text-xs font-chakra font-medium text-ok hover:underline uppercase tracking-wider",children:t.action.label})]}),e.jsx("button",{onClick:()=>n(t.id),className:"text-mut hover:text-fg p-1 rounded-sm transition-colors","aria-label":"Dismiss notification",children:e.jsx(N,{size:14})})]})},k=({toasts:t,onDismiss:n,className:r})=>e.jsx("div",{"aria-live":"polite",className:c("fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-auto",r),children:t.map(s=>e.jsx(l,{toast:s,onDismiss:n},s.id))});l.__docgenInfo={description:"",methods:[],displayName:"Toast",props:{toast:{required:!0,tsType:{name:"ToastItem"},description:""},onDismiss:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};k.__docgenInfo={description:"",methods:[],displayName:"ToastContainer",props:{toasts:{required:!0,tsType:{name:"Array",elements:[{name:"ToastItem"}],raw:"ToastItem[]"},description:""},onDismiss:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};const P={title:"Components/Toast",component:l,tags:["autodocs"]},i={args:{toast:{id:"err_1",type:"error",title:"Gateway Authentication Failed",message:"The provided API key does not match any registered tenant boundary.",remediation:"Verify X-Shield-API-Key header in client config or regenerate under /settings.",action:{label:"Regenerate Key",onClick:()=>{}}},onDismiss:()=>{}}},a={args:{toast:{id:"suc_1",type:"success",title:"Policy Deployed Successfully",message:"OPA bundle v1.4 active on decision service (reload latency: 12ms)."},onDismiss:()=>{}}},o={render:()=>{const[t,n]=T.useState([{id:"1",type:"error",title:"Malicious Sink Trapped",message:"send_email blocked by taint tracking engine.",remediation:"Review tainted context in Incident INC-9482."},{id:"2",type:"warning",title:"Model Drift Notice",message:"Sequence autoencoder reconstruction loss elevated on Agent-03."}]);return e.jsx("div",{className:"min-h-[250px] relative",children:e.jsx(k,{toasts:t,onDismiss:r=>n(s=>s.filter(v=>v.id!==r))})})}};var m,p,u;i.parameters={...i.parameters,docs:{...(m=i.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    toast: {
      id: "err_1",
      type: "error",
      title: "Gateway Authentication Failed",
      message: "The provided API key does not match any registered tenant boundary.",
      remediation: "Verify X-Shield-API-Key header in client config or regenerate under /settings.",
      action: {
        label: "Regenerate Key",
        onClick: () => {}
      }
    },
    onDismiss: () => {}
  }
}`,...(u=(p=i.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,y,x;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    toast: {
      id: "suc_1",
      type: "success",
      title: "Policy Deployed Successfully",
      message: "OPA bundle v1.4 active on decision service (reload latency: 12ms)."
    },
    onDismiss: () => {}
  }
}`,...(x=(y=a.parameters)==null?void 0:y.docs)==null?void 0:x.source}}};var f,h,b;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => {
    const [toasts, setToasts] = useState<ToastItem[]>([{
      id: "1",
      type: "error",
      title: "Malicious Sink Trapped",
      message: "send_email blocked by taint tracking engine.",
      remediation: "Review tainted context in Incident INC-9482."
    }, {
      id: "2",
      type: "warning",
      title: "Model Drift Notice",
      message: "Sequence autoencoder reconstruction loss elevated on Agent-03."
    }]);
    return <div className="min-h-[250px] relative">\r
        <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />\r
      </div>;
  }
}`,...(b=(h=o.parameters)==null?void 0:h.docs)==null?void 0:b.source}}};const R=["ErrorWithRemediation","SuccessToast","ActiveToastStack"];export{o as ActiveToastStack,i as ErrorWithRemediation,a as SuccessToast,R as __namedExportsOrder,P as default};
