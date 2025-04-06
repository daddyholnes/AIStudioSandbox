import { SiGoogle } from 'react-icons/si';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  aiModel: string;
  setAiModel: (model: string) => void;
}

const Header = ({ aiModel, setAiModel }: HeaderProps) => {
  const [micActive, setMicActive] = useState(false);
  
  const toggleMic = () => {
    setMicActive(prev => !prev);
  };
  
  return (
    <div className="border-b p-2 flex items-center justify-between">
      <div className="flex items-center">
        <SiGoogle className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-semibold text-lg hidden sm:inline">CodeStudio AI</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Select value={aiModel} onValueChange={setAiModel}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
            <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant={micActive ? "default" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={toggleMic}
          title={micActive ? "Turn Microphone Off" : "Turn Microphone On"}
        >
          {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Header;