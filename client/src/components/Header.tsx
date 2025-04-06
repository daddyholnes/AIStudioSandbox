import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderProps {
  aiModel: string;
  setAiModel: (model: string) => void;
}

const Header = ({ aiModel, setAiModel }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-gray-700 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="font-google-sans text-xl text-white">D</span>
        </div>
        <h1 className="font-google-sans text-xl font-medium">Dartopia</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger className="bg-background border border-gray-700 rounded px-3 py-1 text-sm font-roboto focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</SelectItem>
              <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
              <SelectItem value="gemini-1.0">gemini-1.0</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <i className="ri-settings-4-line text-lg"></i>
        </Button>
        
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="font-google-sans text-sm">JD</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
