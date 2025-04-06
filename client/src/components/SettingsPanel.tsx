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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(2048);
  const [topK, setTopK] = useState(40);
  const [topP, setTopP] = useState(0.95);
  const [webSearch, setWebSearch] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  const handleSave = () => {
    // Save settings to local storage
    const settings = {
      model: selectedModel,
      temperature,
      maxOutputTokens,
      topK,
      topP,
      webSearch,
      thinkingEnabled,
      darkMode,
      apiKey: apiKey || undefined // Only save if provided
    };
    
    localStorage.setItem('aiStudioSettings', JSON.stringify(settings));
    
    // Notify that settings are saved
    console.log('Settings saved:', settings);
    
    // Close the settings panel
    onClose();
  };
  
  return (
    <Card className="w-full max-w-2xl h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your AI Studio environment</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="model">Model Configuration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <Switch 
                  id="darkMode" 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="defaultModel">Default Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
                    <SelectItem value="gemini-2.0-pro-vision">Gemini 2.0 Pro Vision</SelectItem>
                    <SelectItem value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro (Experimental)</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="model">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature: {temperature.toFixed(2)}</Label>
                </div>
                <Slider 
                  id="temperature"
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={[temperature]} 
                  onValueChange={(values) => setTemperature(values[0])}
                />
                <p className="text-xs text-gray-500">
                  Controls randomness: Lower values are more focused and deterministic, higher values more creative.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="maxOutputTokens">Max Output Tokens: {maxOutputTokens}</Label>
                </div>
                <Slider 
                  id="maxOutputTokens"
                  min={1} 
                  max={4096} 
                  step={1} 
                  value={[maxOutputTokens]} 
                  onValueChange={(values) => setMaxOutputTokens(values[0])}
                />
                <p className="text-xs text-gray-500">
                  Maximum length of the model's response in tokens. Higher values allow for longer outputs.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="topK">Top-K: {topK}</Label>
                </div>
                <Slider 
                  id="topK"
                  min={1} 
                  max={100} 
                  step={1} 
                  value={[topK]} 
                  onValueChange={(values) => setTopK(values[0])}
                />
                <p className="text-xs text-gray-500">
                  Limits token selection to top K possibilities. Lower values create more focused responses.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="topP">Top-P: {topP.toFixed(2)}</Label>
                </div>
                <Slider 
                  id="topP"
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={[topP]} 
                  onValueChange={(values) => setTopP(values[0])}
                />
                <p className="text-xs text-gray-500">
                  Nucleus sampling: Only considers tokens with combined probability mass of P. Lower values create more focused responses.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="webSearch">Web Search (DeepSearch)</Label>
                  <p className="text-sm text-gray-500">Allow AI to search the web for information</p>
                </div>
                <Switch 
                  id="webSearch" 
                  checked={webSearch} 
                  onCheckedChange={setWebSearch}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="thinking">Thinking Access</Label>
                  <p className="text-sm text-gray-500">Enable step-by-step reasoning for complex questions</p>
                </div>
                <Switch 
                  id="thinking" 
                  checked={thinkingEnabled} 
                  onCheckedChange={setThinkingEnabled}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Google AI API Key</Label>
                <Input 
                  id="apiKey"
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-gray-500">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Note: You can use the environment-provided API keys if you don't have your own.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}

export default SettingsPanel;