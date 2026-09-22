import { Capacitor } from "@capacitor/core";
import {
  KeychainAccess,
  SecureStorage,
} from "@aparajita/capacitor-secure-storage";

type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const isNative = Capacitor.isNativePlatform();

/**
 * Supabase accepts asynchronous auth storage. On native builds this adapter
 * keeps refresh tokens in Android Keystore/iOS Keychain instead of the WebView
 * localStorage. Existing native installs are migrated lazily on first read so
 * upgrading LOOMA does not sign the user out.
 */
/**
 * Every Supabase request reads the session through this adapter. On Android the
 * keystore call crosses the native bridge, so without a memory cache a screen
 * that fires a dozen queries pays a dozen serialized bridge round-trips (and an
 * occasional timeout shows up as "signed out"). The cache is the source of
 * truth once warm; secure storage stays the durable copy.
 */
const memoryCache = new Map<string, string | null>();

function unwrapLegacySecureValue(value: string): string {
  // Releases up to 1.0.28 used SecureStorage.set(), which JSON-encoded the
  // already serialized Supabase session. SecureStorage.getItem() then returned
  // the extra quoted value and Supabase could not hydrate it after a cold start.
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : value;
  } catch {
    return value;
  }
}

async function readSecureValue(key: string): Promise<string | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await SecureStorage.getItem(key);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 120 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

const nativeAuthStorage: AuthStorage = {
  async getItem(key) {
    if (memoryCache.has(key)) return memoryCache.get(key) ?? null;
    try {
      const secureValue = await readSecureValue(key);
      if (secureValue !== null) {
        const rawValue = typeof secureValue === "string" ? secureValue : String(secureValue);
        const value = unwrapLegacySecureValue(rawValue);
        if (value !== rawValue) {
          // Repair the old double-encoded value in place so every later launch
          // reads the canonical Supabase session format.
          await SecureStorage.setItem(key, value);
        }
        memoryCache.set(key, value);
        return value;
      }

      // One-time migration from releases that stored the Supabase session in
      // the WebView. Do not remove the legacy value until secure storage wins.
      const legacyValue = window.localStorage.getItem(key);
      if (legacyValue !== null) {
        await SecureStorage.setItem(key, legacyValue);
        window.localStorage.removeItem(key);
      }
      memoryCache.set(key, legacyValue);
      return legacyValue;
    } catch (error) {
      // Availability is more important than forcing a logout. This fallback is
      // only used if the device keystore itself is temporarily unavailable.
      console.warn("[AuthStorage] Secure read unavailable; using local fallback", error);
      return window.localStorage.getItem(key);
    }
  },

  async setItem(key, value) {
    memoryCache.set(key, value);
    try {
      // setItem stores the already serialized Supabase payload verbatim.
      // SecureStorage.set() would JSON-encode it a second time.
      await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
      await SecureStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("[AuthStorage] Secure write unavailable; using local fallback", error);
      window.localStorage.setItem(key, value);
    }
  },

  async removeItem(key) {
    memoryCache.delete(key);
    try {
      await SecureStorage.removeItem(key);
    } catch (error) {
      console.warn("[AuthStorage] Secure removal unavailable", error);
    } finally {
      window.localStorage.removeItem(key);
    }
  },
};

export const supabaseAuthStorage = isNative ? nativeAuthStorage : window.localStorage;
export const usesNativeAuthStorage = isNative;
