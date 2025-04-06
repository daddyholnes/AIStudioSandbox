import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
            <SelectContent>
              <SelectItem value="gemini-2.0-flash-exp">Gemini Flash</SelectItem>
              <SelectItem value="gemini-2.0-pro-exp">Gemini Pro</SelectItem>
              <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
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