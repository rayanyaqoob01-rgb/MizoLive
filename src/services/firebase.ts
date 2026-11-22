import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInAnonymously,
  linkWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported, logEvent } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported, getToken } from 'firebase/messaging';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';
import { apiClient } from './apiClient';

export const ADMIN_EMAIL = 'rayanyaqoob01@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirebaseDiagnosticsStatus {
  projectId: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  firebaseCoreReady: boolean;
  authReady: boolean;
  firestoreConnected: boolean;
  firestoreError?: string;
  storageReady: boolean;
  fcmStatus: 'ready' | 'needs_vapid_key' | 'unsupported' | 'permission_denied';
  analyticsStatus: 'active' | 'missing_measurement_id' | 'unsupported';
  remoteConfigStatus: 'activated' | 'defaults_only' | 'error';
  appCheckStatus: 'active' | 'needs_recaptcha_site_key';
  crashReportingStatus: 'client_error_listener_active';
  remoteConfigValues: {
    audioCallRate: number;
    videoCallRate: number;
    maxRoomSeats: number;
    maintenanceMode: boolean;
  };
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    ...(firebaseConfig.measurementId ? { measurementId: firebaseConfig.measurementId } : {}),
  });
  auth = getAuth(app);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  storage = getStorage(app);
} catch (err) {
  apiClient.recordExternalError('firebase/init', String(err));
  throw err;
}

export { app, auth, db, storage };

const diagnosticsState: FirebaseDiagnosticsStatus = {
  projectId: firebaseConfig.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  storageBucket: firebaseConfig.storageBucket,
  firebaseCoreReady: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
  authReady: Boolean(auth),
  firestoreConnected: false,
  storageReady: Boolean(storage),
  fcmStatus: import.meta.env.VITE_FIREBASE_VAPID_KEY ? 'unsupported' : 'needs_vapid_key',
  analyticsStatus: firebaseConfig.measurementId ? 'unsupported' : 'missing_measurement_id',
  remoteConfigStatus: 'defaults_only',
  appCheckStatus: import.meta.env.VITE_FIREBASE_APPCHECK_KEY ? 'active' : 'needs_recaptcha_site_key',
  crashReportingStatus: 'client_error_listener_active',
  remoteConfigValues: {
    audioCallRate: 40,
    videoCallRate: 90,
    maxRoomSeats: 12,
    maintenanceMode: false,
  },
};

export function getFirebaseDiagnosticsStatus(): FirebaseDiagnosticsStatus {
  return { ...diagnosticsState };
}

export function isVerifiedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return (
    Boolean(user.emailVerified) &&
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error:', serialized);
  apiClient.recordExternalError(`firestore:${operationType}:${path || 'root'}`, errInfo.error, 403);
  throw new Error(serialized);
}

// Startup Connection Validation (Mandatory)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    diagnosticsState.firestoreConnected = true;
    diagnosticsState.firestoreError = undefined;
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      diagnosticsState.firestoreConnected = false;
      diagnosticsState.firestoreError = 'Client offline or unreachable Firebase project.';
    } else if (msg.toLowerCase().includes('permission')) {
      // Server responded (rules/doc missing) -> connectivity to Firestore backend verified
      diagnosticsState.firestoreConnected = true;
      diagnosticsState.firestoreError = undefined;
      return true;
    } else {
      diagnosticsState.firestoreConnected = false;
      diagnosticsState.firestoreError = msg;
    }
    return false;
  }
}

export async function initializeExtendedFirebaseServices() {
  await testFirestoreConnection();

  // Optional App Check
  const recaptchaKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY || firebaseConfig.recaptchaSiteKey;
  if (recaptchaKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
      diagnosticsState.appCheckStatus = 'active';
    } catch {
      diagnosticsState.appCheckStatus = 'needs_recaptcha_site_key';
    }
  }

  // Optional Analytics
  try {
    if (firebaseConfig.measurementId && (await isAnalyticsSupported())) {
      const analytics = getAnalytics(app);
      logEvent(analytics, 'mizo_live_app_open');
      diagnosticsState.analyticsStatus = 'active';
    }
  } catch {
    diagnosticsState.analyticsStatus = 'unsupported';
  }

  // Remote Config with resilient defaults
  try {
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = 3600000;
    rc.defaultConfig = {
      audio_call_rate: 40,
      video_call_rate: 90,
      max_room_seats: 12,
      maintenance_mode: false,
    };
    await fetchAndActivate(rc);
    diagnosticsState.remoteConfigStatus = 'activated';
    diagnosticsState.remoteConfigValues = {
      audioCallRate: getValue(rc, 'audio_call_rate').asNumber() || 40,
      videoCallRate: getValue(rc, 'video_call_rate').asNumber() || 90,
      maxRoomSeats: getValue(rc, 'max_room_seats').asNumber() || 12,
      maintenanceMode: getValue(rc, 'maintenance_mode').asBoolean(),
    };
  } catch {
    diagnosticsState.remoteConfigStatus = 'defaults_only';
  }

  // Global Crash & Unhandled Error Telemetry Hook
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      apiClient.recordExternalError('crashlytics/window_error', event.message || 'Runtime error');
    });
    window.addEventListener('unhandledrejection', (event) => {
      apiClient.recordExternalError(
        'crashlytics/unhandled_rejection',
        event.reason instanceof Error ? event.reason.message : String(event.reason)
      );
    });
  }
}

export async function requestFcmPushToken(): Promise<{ ok: boolean; token?: string; reason?: string }> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    diagnosticsState.fcmStatus = 'needs_vapid_key';
    return { ok: false, reason: 'VITE_FIREBASE_VAPID_KEY missing' };
  }
  try {
    const supported = await isMessagingSupported();
    if (!supported) {
      diagnosticsState.fcmStatus = 'unsupported';
      return { ok: false, reason: 'Browser does not support FCM Web Push' };
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      diagnosticsState.fcmStatus = 'permission_denied';
      return { ok: false, reason: 'Notification permission denied' };
    }
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey });
    diagnosticsState.fcmStatus = 'ready';
    if (auth.currentUser) {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid, 'private', 'info'),
        {
          uid: auth.currentUser.uid,
          fcmToken: token,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return { ok: true, token };
  } catch (err: any) {
    apiClient.recordExternalError('firebase/fcm', err?.message || 'FCM registration error');
    return { ok: false, reason: err?.message || 'FCM failed' };
  }
}

/* =========================================================
   FIREBASE AUTHENTICATION FLOWS
   ========================================================= */
export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (username.trim()) {
    await updateProfile(cred.user, { displayName: username.trim() });
  }
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // non-fatal if quota/rate-limited
  }
  return cred;
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('No signed-in user');
  return sendEmailVerification(auth.currentUser);
}

export async function signInAsGuest() {
  return signInAnonymously(auth);
}

export async function linkGuestWithGoogle() {
  if (!auth.currentUser) return signInWithGoogle();
  const provider = new GoogleAuthProvider();
  return linkWithPopup(auth.currentUser, provider);
}

export async function signOutFirebase() {
  return signOut(auth);
}

export async function changeAccountPassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Password change requires an email/password account.');
  }
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export async function deleteCurrentFirebaseAccount() {
  if (!auth.currentUser) throw new Error('No active account');
  await deleteUser(auth.currentUser);
}

/* =========================================================
   FIRESTORE PROFILE, STORAGE & MODERATION PERSISTENCE
   ========================================================= */
export async function syncUserProfileToFirestore(payload: {
  userId: string;
  username: string;
  bio: string;
  avatar: string;
  coverImage: string;
  profileTheme: 'royal-purple' | 'obsidian-gold' | 'neon-orchid' | 'midnight-crown';
  profilePrivacy: 'public' | 'followers' | 'private';
  level: number;
  xp: number;
  equippedFrameId: string | null;
  equippedEntryId: string | null;
  equippedAssetId: string | null;
}) {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;

  const profileRef = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(profileRef);
    const dataToWrite: Record<string, unknown> = {
      uid: user.uid,
      userId: payload.userId,
      username: payload.username,
      bio: payload.bio,
      avatar: payload.avatar,
      coverImage: payload.coverImage,
      profileTheme: payload.profileTheme,
      profilePrivacy: payload.profilePrivacy,
      level: Math.max(1, Math.min(99, payload.level)),
      xp: payload.xp,
      equippedFrameId: payload.equippedFrameId || '',
      equippedEntryId: payload.equippedEntryId || '',
      equippedAssetId: payload.equippedAssetId || '',
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      dataToWrite.verified = false;
      dataToWrite.vipLevel = 0;
      dataToWrite.svipLevel = 0;
      dataToWrite.followersCount = 123;
      dataToWrite.followingCount = 28;
      dataToWrite.totalLikes = 7500;
      dataToWrite.totalProfileViews = 1420;
      dataToWrite.createdAt = serverTimestamp();
    }

    await setDoc(profileRef, dataToWrite, { merge: true });

    await setDoc(
      doc(db, 'users', user.uid, 'private', 'info'),
      {
        uid: user.uid,
        email: user.email || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function uploadMediaToFirebaseStorage(
  folder: 'profile' | 'rooms' | 'videos' | 'chats',
  file: File
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, error: 'Sign in required to upload media to cloud storage' };
  }
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path =
    folder === 'profile'
      ? `users/${user.uid}/profile/${safeName}`
      : `${folder}/${user.uid}/${safeName}`;
  try {
    const targetRef = storageRef(storage, path);
    await uploadBytes(targetRef, file);
    const url = await getDownloadURL(targetRef);
    return { ok: true, url };
  } catch (err: any) {
    const msg = err?.message || 'Firebase Storage upload failed';
    apiClient.recordExternalError(`storage:${path}`, msg);
    return { ok: false, error: msg };
  }
}

export async function submitReportToFirestore(report: {
  targetId: string;
  targetName: string;
  targetType: 'user' | 'live' | 'room' | 'video';
  reason: string;
}) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'reports'), {
      reporterUid: user.uid,
      targetId: report.targetId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'target',
      targetName: report.targetName.slice(0, 80),
      targetType: report.targetType,
      reason: report.reason.slice(0, 300),
      status: 'open',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'reports');
  }
}
