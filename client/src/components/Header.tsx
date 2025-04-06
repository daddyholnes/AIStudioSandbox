import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Sun, Moon, Play, Save, PlusCircle } from 'lucide-react';

interface HeaderProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const Header = ({ aiModel, setAiModel, isDarkMode, setIsDarkMode }: HeaderProps) => {
  const handleModelChange = (value: string) => {
    setAiModel(value);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="flex items-center justify-between p-2 bg-secondary border-b">
      <div className="flex items-center">
        <div className="flex items-center mr-6">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground mr-2">
            <span className="font-bold">D</span>
          </div>
          <h1 className="text-lg font-bold">Dartopia</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            New File
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm">AI Model:</label>
          <Select value={aiModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="max-h-80 overflow-y-auto">
              <SelectGroup>
                <SelectLabel>Gemini Models</SelectLabel>
                <SelectItem value="gemini-2.0-flash-001">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="gemini-2.0-flash-lite-001">Gemini 2.0 Flash-Lite (Preview)</SelectItem>
                <SelectItem value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro Experimental</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>PaLM Models</SelectLabel>
                <SelectItem value="text-bison">PaLM 2 for Text</SelectItem>
                <SelectItem value="chat-bison">PaLM 2 for Chat</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Code Models</SelectLabel>
                <SelectItem value="code-gecko">Codey for Code Completion</SelectItem>
                <SelectItem value="code-bison">Codey for Code Generation</SelectItem>
                <SelectItem value="codechat-bison">Codey for Code Chat</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Vision Models</SelectLabel>
                <SelectItem value="imagen-3.0-generate-002">Imagen 3</SelectItem>
                <SelectItem value="imagen-3.0-fast-generate-001">Imagen 3 Fast</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Anthropic Models</SelectLabel>
                <SelectItem value="claude-3-7-sonnet">Claude 3.7 Sonnet</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet v2</SelectItem>
                <SelectItem value="claude-3.5-haiku">Claude 3.5 Haiku</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Meta Models</SelectLabel>
                <SelectItem value="llama-3.3">Llama 3.3 (Preview)</SelectItem>
                <SelectItem value="llama-3.2">Llama 3.2 (Preview)</SelectItem>
                <SelectItem value="llama-3.1">Llama 3.1</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Mistral AI</SelectLabel>
                <SelectItem value="mistral-small-3.1">Mistral Small 3.1 (25.03)</SelectItem>
                <SelectItem value="mistral-large-24.11">Mistral Large (24.11)</SelectItem>
                <SelectItem value="mistral-nemo">Mistral Nemo</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Specialized Models</SelectLabel>
                <SelectItem value="codestral-2405">Codestral (25.01)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;