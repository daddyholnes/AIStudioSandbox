import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
// Import other Firebase services as needed (e.g., auth, storage)

let adminApp: App;
let firestoreDb: Firestore;

try {
  // Check if already initialized to prevent errors during hot-reloads
  if (!adminApp) { 
    // Option 1: Use Application Default Credentials (ADC)
    // Ensure GOOGLE_APPLICATION_CREDENTIALS env var is set to the path of your service account key file
    // initializeApp(); 

    // Option 2: Explicitly provide service account key path (less recommended for security)
    // const serviceAccount = require('/path/to/your/serviceAccountKey.json'); 
    // initializeApp({
    //   credential: cert(serviceAccount)
    // });

    // Initialize using ADC (most common for server environments)
    adminApp = initializeApp(); 
    firestoreDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error);
  // Handle initialization error appropriately
}

// Export the initialized services
export { adminApp, firestoreDb };

// Example usage (add your specific Firebase logic below)
// export const saveUserData = async (userId: string, data: any) => {
//   if (!firestoreDb) {
//     throw new Error('Firestore is not initialized.');
//   }
//   const userRef = firestoreDb.collection('users').doc(userId);
//   await userRef.set(data, { merge: true });
// };
