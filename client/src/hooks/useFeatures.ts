import { useState, useEffect } from 'react';
import websocketCollab from '../lib/websocketCollab';

interface FeatureState {
  webAccess: boolean;
  thinking: boolean;
  genkit: boolean;
  commands: boolean;
}

export default function useFeatures(sessionId?: string) {
  const [features, setFeatures] = useState<FeatureState>({
    webAccess: false,
    thinking: false,
    genkit: false,
    commands: false
  });

  // Initial load of feature state
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const endpoint = sessionId 
          ? `/api/ai/features?sessionId=${sessionId}` 
          : '/api/ai/features';
          
        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (data.features) {
          setFeatures(prev => ({ ...prev, ...data.features }));
        }
      } catch (error) {
        console.error('Failed to fetch feature toggles:', error);
      }
    };

    fetchFeatures();
  }, [sessionId]);

  // Listen for WebSocket feature updates
  useEffect(() => {
    const handleWsMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      
      if (data && data.type === 'featureUpdate') {
        setFeatures(prev => ({ ...prev, ...data.features }));
      }
    };
    
    window.addEventListener('ws-message', handleWsMessage);
    return () => window.removeEventListener('ws-message', handleWsMessage);
  }, []);

  const toggleFeature = async (feature: keyof FeatureState) => {
    // Optimistic update
    const newValue = !features[feature];
    setFeatures(prev => ({ ...prev, [feature]: newValue }));
    
    try {
      // Send via WebSocket for real-time sync
      websocketCollab.send({
        type: 'featureUpdate',
        feature,
        value: newValue
      });
      
      // Also update via REST API for persistence
      const endpoint = sessionId 
        ? `/api/ai/features?sessionId=${sessionId}` 
        : '/api/ai/features';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [feature]: newValue })
      });
      
      if (!response.ok) {
        // Revert on error
        setFeatures(prev => ({ ...prev, [feature]: !newValue }));
        console.error('Failed to update feature toggle:', await response.text());
      }
    } catch (error) {
      // Revert on error
      setFeatures(prev => ({ ...prev, [feature]: !newValue }));
      console.error('Error updating feature toggle:', error);
    }
  };

  return { features, toggleFeature };
}
