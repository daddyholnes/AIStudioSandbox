import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import CodeStudio from '@/pages/CodeStudio';
import './index.css';

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={CodeStudio} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;