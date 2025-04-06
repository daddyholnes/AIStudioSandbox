import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor = ({ content, language, onChange }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (editorRef.current) {
      const editor = monaco.editor.create(editorRef.current, {
        value: content,
        language: mapLanguage(language),
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3
      });
      
      // Save editor instance
      monacoEditorRef.current = editor;
      
      // Set up change event handler
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        onChange(value);
      });
      
      // Cleanup on unmount
      return () => {
        editor.dispose();
      };
    }
  }, []);
  
  // Update content when it changes externally
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue();
      if (content !== currentValue) {
        monacoEditorRef.current.setValue(content);
      }
    }
  }, [content]);
  
  // Update language when it changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setModelLanguage(
        monacoEditorRef.current.getModel()!,
        mapLanguage(language)
      );
    }
  }, [language]);
  
  // Map language names to Monaco editor language identifiers
  const mapLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'python': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'csharp',
      'go': 'go',
      'ruby': 'ruby',
      'php': 'php',
      'sql': 'sql',
      'markdown': 'markdown',
      'plaintext': 'plaintext',
      'yaml': 'yaml',
      'shell': 'shell',
      'dockerfile': 'dockerfile'
    };
    
    return languageMap[lang.toLowerCase()] || 'plaintext';
  };
  
  return (
    <div ref={editorRef} className="h-full w-full" />
  );
};

export default CodeEditor;