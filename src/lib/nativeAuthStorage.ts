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
const nativeAuthStorage: AuthStorage = {
  async getItem(key) {
    try {
      const secureValue = await SecureStorage.getItem(key);
      if (secureValue !== null) return secureValue;

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
