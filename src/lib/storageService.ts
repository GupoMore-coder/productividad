import { get, set, del, keys, clear } from 'idb-keyval';

/**
 * storageService.ts
 * Proporciona una capa de persistencia usando IndexedDB para el Modo Mock.
 * Esto evita el error de QuotaExceeded de localStorage al guardar imágenes base64.
 */

export const mockStorage = {
  // Genéricos
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const val = await get(key);
      return val !== undefined ? val : null;
    } catch (err) {
      console.warn(`[mockStorage] Error al leer ${key}:`, err);
      return null;
    }
  },

  setItem: async (key: string, value: any): Promise<void> => {
    try {
      await set(key, value);
    } catch (err) {
      console.error(`[mockStorage] Error al escribir ${key}:`, err);
      throw err;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (err) {
      console.warn(`[mockStorage] Error al eliminar ${key}:`, err);
    }
  },

  clearAll: async (): Promise<void> => {
    await clear();
  },

  getAllKeys: async (): Promise<string[]> => {
    return (await keys()) as string[];
  },

  // Helpers específicos para sincronizar con localStorage (migración)
  syncFromLocalStorage: async (key: string) => {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      try {
        await set(key, JSON.parse(localVal));
        localStorage.removeItem(key);
        console.log(`[mockStorage] Migrado ${key} a IndexedDB.`);
      } catch (err) {
        console.warn(`[mockStorage] Error migrando ${key}:`, err);
      }
    }
  }
};
