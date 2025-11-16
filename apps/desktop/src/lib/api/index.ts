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

// Future API modules will be added here:
// export * from './documents';
// export * from './projects';
// export * from './search';
// export * from './ai';
