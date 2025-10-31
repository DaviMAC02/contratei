/**
 * Device Fingerprint Utility
 *
 * Generates a consistent device fingerprint using FingerprintJS.
 * The fingerprint is cached in sessionStorage for the duration of the browser session.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<{ get: () => Promise<{ visitorId: string }> }> | null =
  null
let cachedFingerprint: string | null = null

const STORAGE_KEY = 'device_fingerprint'

/**
 * Initialize FingerprintJS agent (done once per page load)
 */
function initFingerprintJS() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

/**
 * Get device fingerprint
 * Returns cached value if available, otherwise generates new one
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      cachedFingerprint = stored
      return stored
    }
  }

  try {
    const fp = await initFingerprintJS()
    const result = await fp.get()
    const fingerprint = result.visitorId

    cachedFingerprint = fingerprint

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, fingerprint)
    }

    return fingerprint
  } catch (error) {
    console.error('Error generating device fingerprint:', error)
    const fallback = `fallback_${Date.now()}_${Math.random()}`
    cachedFingerprint = fallback
    return fallback
  }
}

/**
 * Clear cached fingerprint (useful for testing or logout)
 */
export function clearDeviceFingerprint() {
  cachedFingerprint = null
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Get device metadata for enhanced tracking
 */
export function getDeviceMetadata() {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      platform: '',
      language: '',
      screenResolution: '',
      timezone: '',
    }
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

