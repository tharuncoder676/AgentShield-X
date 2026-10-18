import{j as s}from"./jsx-runtime-DFAAy_2V.js";import{R as e}from"./RiskMeter-DMzAkDNC.js";import"./index-Bc2G9s8g.js";import"./cn-DOIGBiOF.js";const C={title:"Components/RiskMeter",component:e,tags:["autodocs"],args:{score:.12,showNumeric:!0,size:"md"}},r={args:{score:.08}},a={args:{score:.24}},t={args:{score:.78}},o={args:{score:.98}},c={render:()=>s.jsxs("div",{className:"flex flex-col gap-4 max-w-sm",children:[s.jsxs("div",{children:[s.jsx("span",{className:"text-xs text-mut mb-1 block",children:"Benign Call (0.04):"}),s.jsx(e,{score:.04})]}),s.jsxs("div",{children:[s.jsx("span",{className:"text-xs text-mut mb-1 block",children:"Sanitize Tier (0.22):"}),s.jsx(e,{score:.22})]}),s.jsxs("div",{children:[s.jsx("span",{className:"text-xs text-mut mb-1 block",children:"Escalate Tier (0.32):"}),s.jsx(e,{score:.32})]}),s.jsxs("div",{children:[s.jsx("span",{className:"text-xs text-mut mb-1 block",children:"Block Tier (0.65):"}),s.jsx(e,{score:.65})]}),s.jsxs("div",{children:[s.jsx("span",{className:"text-xs text-mut mb-1 block",children:"Kill Session (0.96):"}),s.jsx(e,{score:.96})]})]})};var n,i,m;r.parameters={...r.parameters,docs:{...(n=r.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    score: 0.08
  }
}`,...(m=(i=r.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};var l,x,d;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    score: 0.24
  }
}`,...(d=(x=a.parameters)==null?void 0:x.docs)==null?void 0:d.source}}};var p,u,k;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    score: 0.78
  }
}`,...(k=(u=t.parameters)==null?void 0:u.docs)==null?void 0:k.source}}};var g,b,j;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    score: 0.98
  }
}`,...(j=(b=o.parameters)==null?void 0:b.docs)==null?void 0:j.source}}};var v,R,h;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 max-w-sm">\r
      <div>\r
        <span className="text-xs text-mut mb-1 block">Benign Call (0.04):</span>\r
        <RiskMeter score={0.04} />\r
      </div>\r
      <div>\r
        <span className="text-xs text-mut mb-1 block">Sanitize Tier (0.22):</span>\r
        <RiskMeter score={0.22} />\r
      </div>\r
      <div>\r
        <span className="text-xs text-mut mb-1 block">Escalate Tier (0.32):</span>\r
        <RiskMeter score={0.32} />\r
      </div>\r
      <div>\r
        <span className="text-xs text-mut mb-1 block">Block Tier (0.65):</span>\r
        <RiskMeter score={0.65} />\r
      </div>\r
      <div>\r
        <span className="text-xs text-mut mb-1 block">Kill Session (0.96):</span>\r
        <RiskMeter score={0.96} />\r
      </div>\r
    </div>
}`,...(h=(R=c.parameters)==null?void 0:R.docs)==null?void 0:h.source}}};const T=["LowRisk","MediumRisk","HighRisk","CriticalKillSession","Comparison"];export{c as Comparison,o as CriticalKillSession,t as HighRisk,r as LowRisk,a as MediumRisk,T as __namedExportsOrder,C as default};
