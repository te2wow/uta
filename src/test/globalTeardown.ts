import { GlobalConfig } from '@jest/types';

export default async function globalTeardown(globalConfig: GlobalConfig.InitialOptions): Promise<void> {
  console.log('🧹 Starting Jest Global Teardown for VRM Mirror Studio');
  
  // Calculate test execution time
  if (global.__JEST_START_TIME__) {
    const endTime = Date.now();
    const executionTime = endTime - global.__JEST_START_TIME__;
    console.log(`⏱️ Total test execution time: ${executionTime}ms`);
  }
  
  // Clean up any global resources
  // Close database connections if any
  // Stop external services if any
  
  // Clean up environment variables
  delete process.env.VITE_VOICEMOD_API_KEY;
  delete process.env.VITE_MEDIAPIPE_MODEL_PATH;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Jest Global Teardown completed');
}