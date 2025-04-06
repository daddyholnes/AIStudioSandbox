import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '@/lib/utils';

// Import Monaco CSS
import 'monaco-editor/min/vs/editor/editor.main.css';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor = ({ content, language, onChange }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  useEffect(() => {
    if (editorRef.current) {
      if (!monacoEditorRef.current) {
        monacoEditorRef.current = monaco.editor.create(editorRef.current, {
          value: content,
          language: mapLanguage(language),
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: '"Roboto Mono", monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          roundedSelection: true,
          selectOnLineNumbers: true,
          wordWrap: 'on',
          tabSize: 2,
        });
        
        // Add event listener for content changes
        monacoEditorRef.current.onDidChangeModelContent(() => {
          const value = monacoEditorRef.current?.getValue() || '';
          onChange(value);
        });
        
        // Register basic completion provider
        monaco.languages.registerCompletionItemProvider('javascript', {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'console.log',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'console.log($1);',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              },
              {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              },
              {
                label: 'setTimeout',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'setTimeout(() => {\n\t${1}\n}, ${2:1000});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              }
            ];
            return { suggestions };
          }
        });
      } else {
        // Update content if it changes externally
        if (monacoEditorRef.current.getValue() !== content) {
          monacoEditorRef.current.setValue(content);
        }
        
        // Update language if it changes
        monaco.editor.setModelLanguage(
          monacoEditorRef.current.getModel() as monaco.editor.ITextModel, 
          mapLanguage(language)
        );
      }
    }
    
    return () => {
      monacoEditorRef.current?.dispose();
    };
  }, [language]);
  
  // Map file extensions to Monaco languages
  const mapLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'markdown': 'markdown',
      'md': 'markdown'
    };
    
    return languageMap[lang] || 'plaintext';
  };
  
  return (
    <div ref={editorRef} className="w-full h-full" />
  );
};

export default CodeEditor;
