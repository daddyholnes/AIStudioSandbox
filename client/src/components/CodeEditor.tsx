import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor = ({ content, language, onChange }: CodeEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      // Dispose of previous editor instance if it exists
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      
      // Create new editor
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: content,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
          enabled: true,
        },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        tabSize: 2,
      });
      
      // Set up change handler
      editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue() || '';
        onChange(value);
      });
    }
    
    return () => {
      // Cleanup on unmount
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [language]); // Only re-initialize when language changes
  
  // Update content when it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (content !== currentValue) {
        editorRef.current.setValue(content);
      }
    }
  }, [content]);
  
  return <div ref={containerRef} className="code-editor" />;
};

export default CodeEditor;