import React, { useRef, useEffect } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// Define a custom theme type that extends the ITheme interface
type CustomTheme = {
  background: string;
  foreground: string;
  cursor: string;
  black: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  [key: string]: string; // Allow additional properties
};

interface TerminalProps {
  onData?: (data: string) => void;
  height?: string;
}

const Terminal: React.FC<TerminalProps> = ({ onData, height = '100%' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Initialize terminal only if it doesn't exist yet
    if (!xtermRef.current && terminalRef.current) {
      // Create new terminal
      xtermRef.current = new XTerm({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: '#1a1b26',
          foreground: '#c0caf5',
          cursor: '#c0caf5',
          black: '#15161e',
          green: '#9ece6a',
          yellow: '#e0af68',
          blue: '#7aa2f7',
          magenta: '#bb9af7',
          cyan: '#7dcfff',
          white: '#a9b1d6',
          brightBlack: '#414868',
          brightRed: '#f7768e',
          brightGreen: '#9ece6a',
          brightYellow: '#e0af68',
          brightBlue: '#7aa2f7',
          brightMagenta: '#bb9af7',
          brightCyan: '#7dcfff',
          brightWhite: '#c0caf5',
          selection: 'rgba(113, 125, 177, 0.3)' // Add back with type assertion
        } as any,
        cursorBlink: true,
        scrollback: 1000,
      });

      // Create and load fit addon
      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);

      // Open the terminal
      xtermRef.current.open(terminalRef.current);

      // Fit the terminal to container
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }, 100);

      // Write a welcome message
      xtermRef.current.writeln('Welcome to AI Studio Terminal');
      xtermRef.current.writeln('Terminal functionality is coming soon...');
      xtermRef.current.writeln('');
      xtermRef.current.write('$ ');

      // Listen for data from the terminal
      if (onData) {
        xtermRef.current.onData((data) => {
          onData(data);
          
          // Echo the input
          xtermRef.current?.write(data);
          
          // Handle special commands
          if (data === '\r') {
            xtermRef.current?.writeln('');
            xtermRef.current?.write('$ ');
          }
        });
      }

      // Handle resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);

      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        xtermRef.current?.dispose();
      };
    }
  }, [onData]);

  // Add data to terminal
  const writeToTerminal = (data: string) => {
    if (xtermRef.current) {
      xtermRef.current.writeln(data);
    }
  };

  return (
    <div 
      ref={terminalRef} 
      className="terminal-container"
      style={{ 
        height: height,
        width: '100%',
        backgroundColor: '#1a1b26',
        padding: '0.5rem'
      }}
    />
  );
};

export default Terminal;