import { GlobalConfig } from '@jest/types';

export default async function globalSetup(globalConfig: GlobalConfig.InitialOptions): Promise<void> {
  console.log('🚀 Starting Jest Global Setup for VRM Mirror Studio');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.CI = 'true';
  
  // Mock environment-specific configurations
  process.env.VITE_VOICEMOD_API_KEY = 'test-api-key';
  process.env.VITE_MEDIAPIPE_MODEL_PATH = '/test/models';
  
  // Set up global fetch mock if needed
  if (!global.fetch) {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch as any;
  }
  
  // Set up performance measurement
  const startTime = Date.now();
  global.__JEST_START_TIME__ = startTime;
  
  // Initialize test database or external services if needed
  // (Currently not needed for this project)
  
  console.log('✅ Jest Global Setup completed');
}

// Export types for TypeScript
declare global {
  var __JEST_START_TIME__: number;
  var fetch: typeof import('node-fetch').default;
}