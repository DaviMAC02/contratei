import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<{ get: () => Promise<{ visitorId: string }> }> | null =
  null
let cachedFingerprint: string | null = null

const STORAGE_KEY = 'device_fingerprint'

function initFingerprintJS() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

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

export function clearDeviceFingerprint() {
  cachedFingerprint = null
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

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

