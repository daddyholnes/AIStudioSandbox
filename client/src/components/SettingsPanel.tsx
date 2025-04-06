import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  // State for selected models
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  
  // State for AI options
  const [webAccessEnabled, setWebAccessEnabled] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [promptsEnabled, setPromptsEnabled] = useState(true);
  const [genkitEnabled, setGenkitEnabled] = useState(true);
  const [commandsEnabled, setCommandsEnabled] = useState(false);
  
  // State for appearance options
  const [darkMode, setDarkMode] = useState(true);
  const [compactUI, setCompactUI] = useState(false);
  
  // AI models
  const googleModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-pro-vision', name: 'Gemini 1.5 Pro Vision' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
    { id: 'codey-text-code-generation', name: 'Codey Text-Code Generation' },
    { id: 'imagen-3.0', name: 'Imagen 3.0' },
  ];
  
  const partnerModels = [
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku (Anthropic)' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Anthropic)' },
    { id: 'jamba-1.5', name: 'Jamba 1.5 (AI21 Labs)' },
    { id: 'llama-3-8b', name: 'Llama 3 8B (Meta)' }, 
    { id: 'mistral-medium', name: 'Mistral Medium (Mistral AI)' },
    { id: 'mistral-large', name: 'Mistral Large (Mistral AI)' },
  ];

  return (
    <div className="h-full overflow-auto bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Selection</CardTitle>
              <CardDescription>Select the AI model to use for generating content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-model">Google AI Model</Label>
                <Select 
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Google Models</SelectLabel>
                      {googleModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Partner Models</SelectLabel>
                      {partnerModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
                </div>
                <Slider 
                  id="temperature"
                  min={0} 
                  max={1} 
                  step={0.1} 
                  value={[temperature]}
                  onValueChange={(values) => setTemperature(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values produce more predictable outputs, higher values more creative
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chat Options</CardTitle>
              <CardDescription>Configure how the AI assistant works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="history">Chat History</Label>
                  <p className="text-xs text-muted-foreground">Save chat history for later reference</p>
                </div>
                <Switch 
                  id="history"
                  checked={historyEnabled}
                  onCheckedChange={setHistoryEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="web-access">Web Access</Label>
                  <p className="text-xs text-muted-foreground">Allow AI to search and access web content</p>
                </div>
                <Switch 
                  id="web-access"
                  checked={webAccessEnabled}
                  onCheckedChange={setWebAccessEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="thinking">Thinking (Chain of Thought)</Label>
                  <p className="text-xs text-muted-foreground">Show AI's step-by-step reasoning</p>
                </div>
                <Switch 
                  id="thinking"
                  checked={thinkingEnabled}
                  onCheckedChange={setThinkingEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="prompts">Saved Prompts</Label>
                  <p className="text-xs text-muted-foreground">Access to template prompts</p>
                </div>
                <Switch 
                  id="prompts"
                  checked={promptsEnabled}
                  onCheckedChange={setPromptsEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="genkit">Genkit Integration</Label>
                  <p className="text-xs text-muted-foreground">Use Google Genkit for advanced flows</p>
                </div>
                <Switch 
                  id="genkit"
                  checked={genkitEnabled}
                  onCheckedChange={setGenkitEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="commands">Commands</Label>
                  <p className="text-xs text-muted-foreground">Enable slash commands in chat</p>
                </div>
                <Switch 
                  id="commands"
                  checked={commandsEnabled}
                  onCheckedChange={setCommandsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Enable dark mode for the interface</p>
                </div>
                <Switch 
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-ui">Compact UI</Label>
                  <p className="text-xs text-muted-foreground">Reduce spacing in the UI for more content</p>
                </div>
                <Switch 
                  id="compact-ui"
                  checked={compactUI}
                  onCheckedChange={setCompactUI}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>AI Studio + Sandbox</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">AI Studio Sandbox</h3>
                <p className="text-sm text-muted-foreground">
                  AI Studio Sandbox is an innovative development environment that combines real-time collaboration, 
                  intelligent code assistance, and cutting-edge AI technologies to help you build better applications.
                </p>
                
                <h4 className="font-medium mt-4">Technologies</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>React + TypeScript frontend</li>
                  <li>Express backend</li>
                  <li>Google AI integration</li>
                  <li>WebSocket real-time collaboration</li>
                  <li>CodeMirror editor</li>
                </ul>
                
                <p className="text-sm mt-4">
                  Version 0.1.0 (Alpha)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}