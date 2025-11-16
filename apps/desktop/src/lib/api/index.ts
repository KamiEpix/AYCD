/**
 * Tauri IPC API Layer
 * All Tauri invoke calls should go through this module
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Example: Greet command
 */
export async function greet(name: string): Promise<string> {
  return await invoke<string>('greet', { name });
}

// API modules
export * from './projects';
export * from './documents';

// Future API modules will be added here:
// export * from './search';
// export * from './ai';
