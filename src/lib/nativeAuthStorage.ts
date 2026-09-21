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

const nativeAuthStorage: AuthStorage = {
  async getItem(key) {
    if (memoryCache.has(key)) return memoryCache.get(key) ?? null;
    try {
      const secureValue = await SecureStorage.getItem(key);
      if (secureValue !== null) {
        const value = typeof secureValue === "string" ? secureValue : String(secureValue);
        memoryCache.set(key, value);
        return value;
      }

      // One-time migration from releases that stored the Supabase session in
      // the WebView. Do not remove the legacy value until secure storage wins.
      const legacyValue = window.localStorage.getItem(key);
      if (legacyValue !== null) {
        await SecureStorage.set(
          key,
          legacyValue,
          false,
          false,
          KeychainAccess.whenUnlockedThisDeviceOnly,
        );
        window.localStorage.removeItem(key);
      }
      return legacyValue;
    } catch (error) {
      // Availability is more important than forcing a logout. This fallback is
      // only used if the device keystore itself is temporarily unavailable.
      console.warn("[AuthStorage] Secure read unavailable; using local fallback", error);
      return window.localStorage.getItem(key);
    }
  },

  async setItem(key, value) {
    try {
      await SecureStorage.set(
        key,
        value,
        false,
        false,
        KeychainAccess.whenUnlockedThisDeviceOnly,
      );
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("[AuthStorage] Secure write unavailable; using local fallback", error);
      window.localStorage.setItem(key, value);
    }
  },

  async removeItem(key) {
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
