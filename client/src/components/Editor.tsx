import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

interface EditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  height?: string;
}

export default function Editor({ 
  initialValue = '', 
  language = 'javascript',
  onChange,
  height = '100%'
}: EditorProps) {
  const [code, setCode] = useState(initialValue);

  // Automatically synchronize the code with local storage
  useEffect(() => {
    const savedCode = localStorage.getItem('currentCode');
    if (savedCode && !initialValue) {
      setCode(savedCode);
    }
  }, [initialValue]);
  
  // Determine which language extension to use
  const getLanguageExtension = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return javascript();
      case 'python':
      case 'py':
        return python();
      default:
        return javascript();
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    
    // Save to local storage
    localStorage.setItem('currentCode', value);
    
    // Call the onChange prop if provided
    if (onChange) {
      onChange(value);
    }
    
    // Send to WebSocket for collaboration (if implemented)
    try {
      const { webSocketCollab } = require('../lib/websocketCollab');
      if (webSocketCollab && webSocketCollab.isConnected()) {
        webSocketCollab.sendMessage({
          type: 'codeUpdate',
          content: value,
          language
        });
      }
    } catch (error) {
      console.log('WebSocket not available for code sync');
    }
  };

  return (
    <div className="w-full h-full">
      <CodeMirror
        value={code}
        height={height}
        extensions={[getLanguageExtension()]}
        onChange={handleChange}
        theme={oneDark}
        className="text-sm"
      />
    </div>
  );
}