let sessionId = null;
let syncInterval = null;

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    sessionId = e.data.sessionId;
    startSync();
  } else if (e.data.type === 'stop') {
    stopSync();
  }
};

function startSync() {
  if (syncInterval) clearInterval(syncInterval);
  
  // Initial sync
  syncFeatures();
  
  // Set up regular syncing
  syncInterval = setInterval(syncFeatures, 5000);
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function syncFeatures() {
  if (!sessionId) return;
  
  fetch(`/api/ai/features?sessionId=${sessionId}`)
    .then(res => res.json())
    .then(state => {
      self.postMessage({
        type: 'syncUpdate',
        features: state.features
      });
    })
    .catch(error => {
      self.postMessage({
        type: 'error',
        message: 'Failed to sync features'
      });
    });
}
