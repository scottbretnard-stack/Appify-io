/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import BuilderWizard from "./components/BuilderWizard";
import { Smartphone } from "lucide-react";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground group-hover:rotate-12 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">Appify</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Examples</a>
              <a href="#" className="hover:text-primary transition-colors">API</a>
            </nav>
            <div className="flex items-center gap-4">
               <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">Beta v1.0</span>
            </div>
          </div>
        </header>

        <main className="relative pb-24 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30">
            <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] left-[5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
          </div>

          <BuilderWizard />
        </main>

        <footer className="border-t py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-primary" />
                <span className="font-bold">Appify Builder</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                The most efficient way to turn web applications into mobile experiences. 
                Built for SaaS founders, agency owners, and digital creators.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Releases</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t flex justify-between items-center text-xs text-muted-foreground">
            <span>© 2026 Appify. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

