"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LinkedInProfile {
  id: string;
  person_urn: string;
  linkedin_member_id: string;
  scope: string;
  access_token_expires_at: string;
  created_at: string;
}

interface LinkedInStatus {
  isConnected: boolean;
  isTokenValid: boolean;
  daysUntilExpiry: number;
  expiryDate: Date | null;
  profile: LinkedInProfile | null;
  needsRenewal: boolean; // True if expires within 7 days
}

export function useLinkedInStatus(enabled: boolean = true): LinkedInStatus {
  const [status, setStatus] = useState<LinkedInStatus>({
    isConnected: false,
    isTokenValid: false,
    daysUntilExpiry: 0,
    expiryDate: null,
    profile: null,
    needsRenewal: false,
  });

  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;
    
    const checkLinkedInStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        const { data: profile, error } = await supabase
          .from("linkedin_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile && !error) {
          const profileData = profile as any;
          const expiryDate = new Date(profileData.access_token_expires_at);
          const now = new Date();
          const timeDiff = expiryDate.getTime() - now.getTime();
          const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
          const isTokenValid = expiryDate > now;
          const needsRenewal = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

          setStatus({
            isConnected: true,
            isTokenValid,
            daysUntilExpiry,
            expiryDate,
            profile: profileData as LinkedInProfile,
            needsRenewal,
          });
        } else {
          // No LinkedIn profile found - this is normal, not an error
          setStatus({
            isConnected: false,
            isTokenValid: false,
            daysUntilExpiry: 0,
            expiryDate: null,
            profile: null,
            needsRenewal: false,
          });
        }
      } catch (error) {
        // Only log actual errors, not missing profiles
        console.error("Unexpected error checking LinkedIn status:", error);
        setStatus({
          isConnected: false,
          isTokenValid: false,
          daysUntilExpiry: 0,
          expiryDate: null,
          profile: null,
          needsRenewal: false,
        });
      }
    };

    checkLinkedInStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkLinkedInStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [supabase, enabled]);

  return status;
}
