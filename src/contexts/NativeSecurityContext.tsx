import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
  type CheckBiometryResult,
} from "@aparajita/capacitor-biometric-auth";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { useAuth } from "@/contexts/AuthContext";

const BACKGROUND_LOCK_DELAY_MS = 60_000;

type ToggleResult = { success: true } | { success: false; error: string };

type NativeSecurityContextValue = {
  isNative: boolean;
  isAvailable: boolean;
  biometricLabel: string;
  biometricLockEnabled: boolean;
  setBiometricLockEnabled: (enabled: boolean) => Promise<ToggleResult>;
};

const NativeSecurityContext = createContext<NativeSecurityContextValue | undefined>(undefined);

function preferenceKey(userId: string) {
  return `looma-app-lock:${userId}`;
}

function labelForBiometry(type: BiometryType) {
  switch (type) {
    case BiometryType.faceId:
      return "Face ID";
    case BiometryType.touchId:
      return "Touch ID";
    case BiometryType.fingerprintAuthentication:
      return "Fingerprint";
    case BiometryType.faceAuthentication:
      return "Face unlock";
    case BiometryType.irisAuthentication:
      return "Iris unlock";
    default:
      return "Biometric lock";
  }
}

function friendlyBiometryError(error: unknown) {
  if (!(error instanceof BiometryError)) return "Device authentication was not completed.";

  switch (error.code) {
    case BiometryErrorType.biometryNotEnrolled:
      return "Set up biometrics in your phone settings first.";
    case BiometryErrorType.biometryNotAvailable:
      return "Biometric authentication is not available on this device.";
    case BiometryErrorType.passcodeNotSet:
    case BiometryErrorType.noDeviceCredential:
      return "Set a screen lock on your phone first.";
    case BiometryErrorType.userCancel:
    case BiometryErrorType.systemCancel:
    case BiometryErrorType.appCancel:
      return "Authentication cancelled.";
    default:
      return "Device authentication failed. Try again.";
  }
}

function NativeLockScreen({
  isUnlocking,
  onUnlock,
  onSignOut,
}: {
  isUnlocking: boolean;
  onUnlock: () => void;
  onSignOut: () => void;
}) {
  return (
    <main className="fixed inset-0 z-[1000] flex min-h-[100dvh] flex-col items-center justify-center bg-[#090b0f] px-8 text-[#f5f6f7]">
      <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.025] text-sm font-medium tracking-[0.18em]">
        L
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/48">LOOMA</p>
      <h1 className="mt-3 text-center text-[25px] font-medium tracking-[-0.02em]">App locked</h1>
      <p className="mt-2 max-w-[280px] text-center text-[14px] leading-6 text-white/52">
        Unlock with your device to view your cognitive data.
      </p>

      <button
        type="button"
        onClick={onUnlock}
        disabled={isUnlocking}
        className="mt-9 min-h-12 w-full max-w-[300px] rounded-full border border-white/18 bg-white text-[13px] font-medium uppercase tracking-[0.14em] text-black transition-opacity disabled:opacity-55"
      >
        {isUnlocking ? "Unlocking…" : "Unlock"}
      </button>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-5 text-[12px] text-white/42 underline-offset-4 hover:text-white/70 hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}

export function NativeSecurityProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [initializedUserId, setInitializedUserId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<CheckBiometryResult | null>(null);
  const [biometricLockEnabled, setBiometricLockEnabledState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const unlockingRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    if (!isNative) {
      setIsLocked(false);
      return { success: true } as const;
    }

    unlockingRef.current = true;
    setIsUnlocking(true);
    try {
      await BiometricAuth.authenticate({
        reason: "Unlock LOOMA",
        cancelTitle: "Cancel",
        allowDeviceCredential: true,
        iosFallbackTitle: "Use device passcode",
        androidTitle: "Unlock LOOMA",
        androidSubtitle: "Confirm it’s you to view your cognitive data",
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.weak,
      });
      setIsLocked(false);
      return { success: true } as const;
    } catch (error) {
      setIsLocked(true);
      return { success: false, error: friendlyBiometryError(error) } as const;
    } finally {
      setIsUnlocking(false);
      // The biometric activity itself may briefly generate an app-resume event.
      window.setTimeout(() => {
        unlockingRef.current = false;
      }, 250);
    }
  }, [isNative]);

  useEffect(() => {
    if (!isNative || authLoading) return;

    let cancelled = false;

    const initialize = async () => {
      if (!user?.id) {
        setBiometricLockEnabledState(false);
        setIsLocked(false);
        setInitializedUserId(null);
        return;
      }

      try {
        const [info, storedPreference] = await Promise.all([
          BiometricAuth.checkBiometry(),
          SecureStorage.getItem(preferenceKey(user.id)),
        ]);
        if (cancelled) return;

        const enabled = storedPreference === "true";
        setAvailability(info);
        setBiometricLockEnabledState(enabled);
        setIsLocked(enabled);
        setInitializedUserId(user.id);

        if (enabled) void authenticate();
      } catch (error) {
        console.warn("[NativeSecurity] Could not initialize app lock", error);
        if (!cancelled) {
          setBiometricLockEnabledState(false);
          setIsLocked(false);
          setInitializedUserId(user.id);
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [authLoading, authenticate, isNative, user?.id]);

  useEffect(() => {
    if (!isNative) return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        backgroundedAtRef.current = Date.now();
        return;
      }

      const backgroundedAt = backgroundedAtRef.current;
      backgroundedAtRef.current = null;
      if (
        unlockingRef.current ||
        !biometricLockEnabled ||
        !user?.id ||
        backgroundedAt === null ||
        Date.now() - backgroundedAt < BACKGROUND_LOCK_DELAY_MS
      ) {
        return;
      }

      setIsLocked(true);
      void authenticate();
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        listener = handle;
      }
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [authenticate, biometricLockEnabled, isNative, user?.id]);

  const setBiometricLockEnabled = useCallback(async (enabled: boolean): Promise<ToggleResult> => {
    if (!isNative || !user?.id) {
      return { success: false, error: "App lock is available in the mobile app." };
    }

    let info = availability;
    try {
      info = await BiometricAuth.checkBiometry();
      setAvailability(info);
    } catch (error) {
      return { success: false, error: friendlyBiometryError(error) };
    }

    if (enabled && !info.isAvailable) {
      return { success: false, error: info.reason || "Set up biometrics in your phone settings first." };
    }

    // Confirm device ownership both when enabling and when disabling the lock.
    if (enabled || biometricLockEnabled) {
      const result = await authenticate();
      if (!result.success) return result;
    }

    try {
      await SecureStorage.setItem(preferenceKey(user.id), String(enabled));
      setBiometricLockEnabledState(enabled);
      setIsLocked(false);
      return { success: true };
    } catch (error) {
      console.warn("[NativeSecurity] Could not save app lock preference", error);
      return { success: false, error: "Could not save the app lock setting." };
    }
  }, [authenticate, availability, biometricLockEnabled, isNative, user?.id]);

  const value = useMemo<NativeSecurityContextValue>(() => ({
    isNative,
    isAvailable: Boolean(availability?.isAvailable),
    biometricLabel: labelForBiometry(availability?.biometryType ?? BiometryType.none),
    biometricLockEnabled,
    setBiometricLockEnabled,
  }), [availability, biometricLockEnabled, isNative, setBiometricLockEnabled]);

  // Gate the first frame for every account, including account switches, until
  // that user's lock preference has been loaded from secure storage.
  if (isNative && user && initializedUserId !== user.id) {
    return <div className="fixed inset-0 bg-[#090b0f]" aria-label="Securing LOOMA" />;
  }

  if (isNative && user && biometricLockEnabled && isLocked) {
    return (
      <NativeSecurityContext.Provider value={value}>
        <NativeLockScreen
          isUnlocking={isUnlocking}
          onUnlock={() => void authenticate()}
          onSignOut={() => void logout()}
        />
      </NativeSecurityContext.Provider>
    );
  }

  return (
    <NativeSecurityContext.Provider value={value}>
      {children}
    </NativeSecurityContext.Provider>
  );
}

export function useNativeSecurity() {
  const context = useContext(NativeSecurityContext);
  if (!context) throw new Error("useNativeSecurity must be used within NativeSecurityProvider");
  return context;
}
