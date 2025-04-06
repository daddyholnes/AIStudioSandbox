import { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import CodeStudio from './pages/CodeStudio';

function App() {
  const [aiModel, setAiModel] = useState('gemini-2.0-flash-exp');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    // Apply dark mode to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/" component={() => 
          <CodeStudio 
            aiModel={aiModel} 
            setAiModel={setAiModel}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        } />
        <Route>
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl">Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;