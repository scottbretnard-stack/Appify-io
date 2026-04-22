import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Smartphone, Globe, Download, Wand2, Settings, Palette, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const formSchema = z.object({
  url: z.string().url("Please enter a valid HTTPS URL").startsWith("https://", "Only HTTPS sites are supported for Appify")
});

export default function BuilderWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [config, setConfig] = useState({
    name: "",
    primaryColor: "#3b82f6",
    theme: "light",
    showControls: true
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" }
  });

  const onAnalyze = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/analyze-url", { url: values.url });
      setAnalysis(data);
      setConfig(prev => ({ ...prev, name: data.title || "My Mobile App" }));
      
      // Get AI Branding Suggestions on Frontend
      const prompt = `Based on the website title "${data.title}" and description "${data.description}", suggest a professional brand identity for a mobile app. 
      Return ONLY JSON in this format: { "appName": "String", "primaryColor": "Hex", "slogan": "String", "theme": "light" | "dark" }`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const responseText = result.text.trim().replace(/```json|```/g, "");
      const branding = JSON.parse(responseText);

      setConfig(prev => ({ 
        ...prev, 
        name: branding.appName || data.title,
        primaryColor: branding.primaryColor || "#3b82f6",
        theme: branding.theme || "light"
      }));

      setStep(2);
      toast.success("Site analyzed! AI suggests some branding for you.");
    } catch (error) {
      console.error(error);
      toast.error("Analysis failed. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const onFinalize = () => {
    setStep(3);
  };

  const onGenerate = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/generate-project", {
        url: form.getValues().url,
        ...config
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}-expo-project.zip`;
      link.click();
      toast.success("Project generated successfully!");
    } catch (error) {
      toast.error("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
        >
          <Smartphone className="w-3 h-3" />
          <span>v1.0 Release</span>
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-4 font-sans leading-tight">
          Turn your website into <br/><span className="text-primary italic">a mobile reality.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Enter your URL and let our AI-powered engine handle the wrapping, branding, and scaffolding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
                  <div className="h-px w-8 bg-muted" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                  <div className="h-px w-8 bg-muted" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
                </div>
                <Badge variant="outline" className="font-mono">{step === 1 ? 'URL' : step === 2 ? 'BRANDING' : 'EXPORT'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="url" 
                            placeholder="https://example.com" 
                            {...form.register("url")} 
                            className="bg-muted/50 border-2"
                          />
                          <Button onClick={form.handleSubmit(onAnalyze)} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                            Analyze
                          </Button>
                        </div>
                        {form.formState.errors.url && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {form.formState.errors.url.message}</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border bg-muted/20">
                          <Globe className="w-5 h-5 text-primary mb-2" />
                          <h4 className="text-sm font-semibold mb-1">Web Standards</h4>
                          <p className="text-xs text-muted-foreground">We ensure your site meets mobile WebView accessibility standards.</p>
                        </div>
                        <div className="p-4 rounded-xl border bg-muted/20">
                          <Smartphone className="w-5 h-5 text-primary mb-2" />
                          <h4 className="text-sm font-semibold mb-1">PWA Ready</h4>
                          <p className="text-xs text-muted-foreground">Native optimizations for responsive and progressive web apps.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>App Name</Label>
                          <Input value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className="w-12 p-1" />
                            <Input value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className="font-mono text-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Theme Selection</Label>
                        <Tabs defaultValue={config.theme} onValueChange={(v) => setConfig({ ...config, theme: v as any })}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="light">Light Mode</TabsTrigger>
                            <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <Palette className="w-5 h-5 text-primary" />
                        <div className="text-sm">
                          <span className="font-bold">AI Branding Active:</span> We've inferred these styles from your site's content.
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button className="flex-1" onClick={onFinalize}>Configure Export</Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="space-y-6 py-4">
                      <div className="flex flex-col items-center text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Ready to Export</h3>
                        <p className="text-sm text-muted-foreground">Your React Native (Expo) source project is prepared.</p>
                      </div>

                      <div className="space-y-4 rounded-xl border p-4 bg-muted/10">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Platform</span>
                          <span className="font-semibold">React Native (Expo)</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Features</span>
                          <span className="font-semibold text-xs bg-muted px-2 py-0.5 rounded">WebView</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button className="flex-1 h-12 text-lg" onClick={onGenerate} disabled={loading}>
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                          Generate & Download ZIP
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 sticky top-8">
          <div className="relative mx-auto w-[280px] h-[560px] bg-card border-[8px] border-muted rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="absolute top-0 w-full h-6 bg-muted flex justify-center items-end pb-1">
              <div className="w-16 h-4 bg-background rounded-full" />
            </div>
            <div className={`w-full h-full pt-6 p-4 flex flex-col ${config.theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl overflow-hidden relative">
                {step === 1 ? (
                  <div className="text-center p-4">
                    <Globe className="w-10 h-10 mx-auto text-muted mb-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Waiting for URL analysis...</p>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-2 left-2 right-2 h-4 bg-muted/20 rounded animate-pulse" />
                    <div className="w-full h-full flex flex-col pt-6">
                      <div className="flex-1 bg-muted/10 flex items-center justify-center p-4 text-center">
                         <div className="space-y-2">
                           {analysis?.favicon && <img src={analysis.favicon} className="w-12 h-12 rounded-full mx-auto shadow-md" crossOrigin="anonymous" />}
                           <p className="text-sm font-bold">{config.name}</p>
                           <p className="text-[10px] opacity-60">Connected to {form.getValues().url}</p>
                         </div>
                      </div>
                      <div className="h-10 bg-muted/20 border-t flex items-center px-4">
                        <div className="w-full h-1 bg-primary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="h-10 mt-2 flex justify-between items-center px-4">
                <div className="w-3 h-3 rounded-sm border-2 border-muted" />
                <div className="w-3 h-3 rounded-full border-2 border-muted" />
                <div className="w-3 h-3 border-r-2 border-b-2 border-muted rotate-45 mb-1" />
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-xs text-muted-foreground font-mono">LIVE MOBILE PREVIEW</p>
        </div>
      </div>
    </div>
  );
}
