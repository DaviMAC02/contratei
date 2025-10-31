"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getDeviceFingerprint,
  getDeviceMetadata,
  clearDeviceFingerprint,
} from "@/lib/device-fingerprint";
import { trpc } from "@/lib/trpc-client";
import { signOutWithRevocation } from "@/lib/session-utils";

export function DeviceTracker() {
  const { data: session, status } = useSession();
  const [hasTracked, setHasTracked] = useState(false);
  const trackDeviceMutation = trpc.device.track.useMutation();

  useEffect(() => {
    // Only track when user is authenticated and hasn't been tracked yet
    if (status === "authenticated" && session?.user && !hasTracked) {
      const trackDevice = async () => {
        try {
          const deviceId = await getDeviceFingerprint();
          const deviceMetadata = getDeviceMetadata();

          // Get user's IP and location from browser (if available)
          let location = null;
          try {
            const response = await fetch("https://ipapi.co/json/").catch(() =>
              null
            );
            if (response) {
              const data = await response.json();
              location = {
                city: data.city,
                region: data.region,
                country: data.country_name,
                countryCode: data.country_code,
                latitude: data.latitude,
                longitude: data.longitude,
                source: "ipapi",
              };
            }
          } catch (error) {
            console.error("Error getting location:", error);
          }

          // Track device using tRPC
          await trackDeviceMutation.mutateAsync({
            deviceId,
            deviceMetadata,
            location: location || undefined,
          });

          setHasTracked(true);
          console.log("Device tracked successfully");
        } catch (error: any) {
          console.error("Error tracking device:", error);
          
          // If device is revoked, sign out the user
          if (error?.data?.code === "FORBIDDEN" && error?.data?.cause?.code === "REVOKED_DEVICE") {
            console.error("Device revoked, signing out:", error.data.cause.reason);
            await signOutWithRevocation({
              callbackUrl: "/auth/signin?error=RevokedDevice",
              reason: "REVOKED_DEVICE",
            });
          }
        }
      };

      // Small delay to ensure session is fully established
      const timer = setTimeout(() => {
        trackDevice();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [session, status, hasTracked, trackDeviceMutation]);

  // Clear fingerprint on logout
  useEffect(() => {
    if (status === "unauthenticated") {
      clearDeviceFingerprint();
      setHasTracked(false);
    }
  }, [status]);

  return null; // This component doesn't render anything
}

