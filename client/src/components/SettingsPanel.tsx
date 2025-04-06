import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Database, KeyRound, Code, Palette, Bot, Cloud, Moon, Sun } from 'lucide-react';

interface SettingsPanelProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const SettingsPanel = ({ aiModel, setAiModel, isDarkMode, setIsDarkMode }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState('general');

  const googleModels = [
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash-exp' },
    { label: 'Gemini 2.0 Pro', value: 'gemini-2.0-pro-exp' },
    { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash-001' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro-001' },
    { label: 'Codey', value: 'codechat-bison' },
    { label: 'PaLM 2', value: 'chat-bison' }
  ];

  const partnerModels = [
    { label: 'Claude 3 Opus', value: 'claude-3-opus' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
    { label: 'Mistral Large', value: 'mistral-large' },
    { label: 'Llama 3', value: 'llama-3-coder' }
  ];

  const imageModels = [
    { label: 'Imagen 3', value: 'imagen-3' },
    { label: 'Stable Diffusion XL', value: 'stable-diffusion-xl' }
  ];

  return (
    <div className="h-full flex flex-col overflow-auto p-4 bg-background">
      <div className="flex items-center mb-6">
        <Settings className="h-5 w-5 mr-2" />
        <h2 className="text-lg font-medium">Settings</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="genkit">Genkit</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <div className="text-xs text-muted-foreground">Enable dark theme for the app</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Font Size</Label>
                  <div className="text-xs text-muted-foreground">Set the default font size</div>
                </div>
                <Select defaultValue="14">
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collaboration</CardTitle>
              <CardDescription>Real-time collaboration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Collaboration</Label>
                  <div className="text-xs text-muted-foreground">Allow others to join your sessions</div>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-share with AI Assistant</Label>
                  <div className="text-xs text-muted-foreground">Share your workspace with AI</div>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google AI Models</CardTitle>
              <CardDescription>Configure Google's AI models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Chat Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {googleModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Default Code Model</Label>
                <Select defaultValue="codechat-bison">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="codechat-bison">Codey</SelectItem>
                    <SelectItem value="gemini-2.0-pro-exp">Gemini 2.0 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Partner Models</Label>
                <Select defaultValue="claude-3-opus">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Image Models</Label>
                <Select defaultValue="imagen-3">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
            
          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>Configure AI model behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Temperature: 0.7</Label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  defaultValue="0.7" 
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Deterministic</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Max Output Tokens: 1024</Label>
                <input 
                  type="range" 
                  min="256" 
                  max="8192" 
                  step="256" 
                  defaultValue="1024" 
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label className="mb-2">Advanced Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="web-access" />
                  <label htmlFor="web-access" className="text-sm">Enable Web Access</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="deep-search" />
                  <label htmlFor="deep-search" className="text-sm">Enable Deep Search</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="thinking" />
                  <label htmlFor="thinking" className="text-sm">Enable Thinking Mode</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Configure your AI service API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>OpenAI API Key</Label>
                <div className="flex space-x-2">
                  <Input type="password" value="••••••••••••••••••••••••••" />
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Google AI API Key</Label>
                <div className="flex space-x-2">
                  <Input type="password" value="••••••••••••••••••••••••••" />
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Anthropic API Key</Label>
                <div className="flex space-x-2">
                  <Input type="password" value="••••••••••••••••••••••••••" />
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>LiveKit API Key</Label>
                <div className="flex space-x-2">
                  <Input type="password" value="••••••••••••••••••••••••••" />
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor Settings</CardTitle>
              <CardDescription>Customize your code editor experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tab Size</Label>
                <Select defaultValue="2">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="tab">Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select defaultValue="monospace">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="firacode">Fira Code</SelectItem>
                    <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label className="mb-2">Editor Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="word-wrap" defaultChecked />
                  <label htmlFor="word-wrap" className="text-sm">Word Wrap</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="line-numbers" defaultChecked />
                  <label htmlFor="line-numbers" className="text-sm">Line Numbers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-save" defaultChecked />
                  <label htmlFor="auto-save" className="text-sm">Auto Save</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-format" defaultChecked />
                  <label htmlFor="auto-format" className="text-sm">Auto Format</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="genkit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genkit Settings</CardTitle>
              <CardDescription>Configure Firebase Genkit integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Project ID</Label>
                <Input placeholder="Auto-detected from credentials" />
              </div>
              
              <div className="space-y-2">
                <Label>API Version</Label>
                <Select defaultValue="v2beta">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select API version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1beta">v1beta</SelectItem>
                    <SelectItem value="v2beta">v2beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Select defaultValue="us-central1">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-central1">us-central1</SelectItem>
                    <SelectItem value="europe-west1">europe-west1</SelectItem>
                    <SelectItem value="asia-northeast1">asia-northeast1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex flex-col space-y-2">
                <Label className="mb-2">Genkit Features</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="tracing" defaultChecked />
                  <label htmlFor="tracing" className="text-sm">Enable Tracing and Metrics</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="caching" defaultChecked />
                  <label htmlFor="caching" className="text-sm">Enable Response Caching</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="multi-modal" defaultChecked />
                  <label htmlFor="multi-modal" className="text-sm">Enable Multi-modal Support</label>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Connected Models</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="google-ai" defaultChecked />
                    <label htmlFor="google-ai" className="text-sm">Google AI</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="openai" defaultChecked />
                    <label htmlFor="openai" className="text-sm">OpenAI</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="anthropic" defaultChecked />
                    <label htmlFor="anthropic" className="text-sm">Anthropic</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="vertex" defaultChecked />
                    <label htmlFor="vertex" className="text-sm">Vertex AI</label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Genkit Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPanel;