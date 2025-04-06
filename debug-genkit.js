// Simple debug script to examine Genkit exports

import * as core from '@genkit-ai/core';
import * as googleai from '@genkit-ai/googleai';

console.log('=== GENKIT DEBUG ===');
console.log('Core package exports:');
console.log(Object.keys(core));

console.log('\nGoogleAI package exports:');
console.log(Object.keys(googleai));

console.log('\nChecking specific core methods:');
console.log('- apiKey:', typeof core.apiKey);
console.log('- defineFlow:', typeof core.defineFlow);

if (typeof core.apiKey === 'function') {
  try {
    const key = core.apiKey('test-key');
    console.log('- apiKey result type:', typeof key);
    console.log('- apiKey properties:', Object.keys(key));
  } catch (error) {
    console.error('Error creating API key:', error);
  }
}

console.log('\nTrying to find initialization function:');
const possibleInitFunctions = Object.keys(core).filter(key => 
  typeof core[key] === 'function' && 
  ['init', 'create', 'genkit', 'genkitAI'].includes(key.toLowerCase())
);
console.log('Potential initialization functions:', possibleInitFunctions);

console.log('\n=== DEBUG COMPLETE ===');
