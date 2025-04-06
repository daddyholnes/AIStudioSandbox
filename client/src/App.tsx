import { Switch, Route } from "wouter";
import { useEffect } from "react";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { initWebSocket } from "@/lib/websocket";

function App() {
  // Initialize WebSocket connection on app load
  useEffect(() => {
    // Initialize WebSocket
    const socket = initWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
