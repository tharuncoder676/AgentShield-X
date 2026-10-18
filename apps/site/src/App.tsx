import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { Home } from "./pages/Home";
import { Demo } from "./pages/Demo";
import { ArchitectureSite } from "./pages/ArchitectureSite";
import { Docs } from "./pages/Docs";
import { Benchmarks } from "./pages/Benchmarks";
import { Pricing } from "./pages/Pricing";
import { Legal } from "./pages/Legal";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-fg flex flex-col font-sans selection:bg-ok/20 selection:text-ok">
        <SiteHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/architecture" element={<ArchitectureSite />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
};
