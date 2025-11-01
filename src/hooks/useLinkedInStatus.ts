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

export function useLinkedInStatus(): LinkedInStatus {
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
    const checkLinkedInStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        const { data: profile, error } = await supabase
          .from("linkedin_profiles" as any)
          .select("*")
          .eq("user_id", user.id)
          .single();

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
        console.error("Error checking LinkedIn status:", error);
      }
    };

    checkLinkedInStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkLinkedInStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [supabase]);

  return status;
}
