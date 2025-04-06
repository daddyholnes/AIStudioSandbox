import React, { useState, useEffect } from 'react';
import Editor from './Editor';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (content: string) => void;
  onCursorPositionChange?: (position: { line: number, column: number }) => void;
  remoteCursors?: Array<{
    id: string;
    name: string;
    color: string;
    position: { line: number, column: number };
  }>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  language,
  onChange,
  onCursorPositionChange,
  remoteCursors = []
}) => {
  const [value, setValue] = useState(content);

  // Update local state when content prop changes
  useEffect(() => {
    setValue(content);
  }, [content]);

  // Handle code changes
  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="h-full relative">
      <Editor
        initialValue={value}
        language={language}
        onChange={handleChange}
        height="100%"
      />
      
      {/* Placeholder for remote cursor indicators */}
      {remoteCursors && remoteCursors.length > 0 && (
        <div className="absolute top-2 right-2 bg-background/70 border rounded p-1 text-xs">
          {remoteCursors.map(cursor => (
            <div 
              key={cursor.id} 
              className="flex items-center mb-1 last:mb-0"
              title={`${cursor.name} is editing`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: cursor.color }}
              ></div>
              <span>{cursor.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;