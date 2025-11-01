"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinkedInStatus } from "@/hooks/useLinkedInStatus";

export function LinkedInNotificationBanner() {
  const { needsRenewal, daysUntilExpiry, isTokenValid, isConnected } = useLinkedInStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not connected, dismissed, or doesn't need renewal
  if (!isConnected || isDismissed || (!needsRenewal && isTokenValid)) {
    return null;
  }

  const isExpired = !isTokenValid;
  const urgencyLevel = daysUntilExpiry <= 2 ? "critical" : daysUntilExpiry <= 7 ? "warning" : "info";

  const getBannerStyles = () => {
    if (isExpired) {
      return "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600";
    }
    if (urgencyLevel === "critical") {
      return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-600";
    }
    return "bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 border-yellow-500";
  };

  const getMessage = () => {
    if (isExpired) {
      return "Din LinkedIn-adgang er udløbet! Forny den nu for at fortsætte med at udgive opslag.";
    }
    if (daysUntilExpiry === 1) {
      return "Din LinkedIn-adgang udløber i morgen! Forny den nu for at undgå afbrydelser.";
    }
    if (daysUntilExpiry <= 2) {
      return `Din LinkedIn-adgang udløber om ${daysUntilExpiry} dage! Forny den snart.`;
    }
    return `Din LinkedIn-adgang udløber om ${daysUntilExpiry} dage. Overvej at forny den.`;
  };

  return (
    <div className={`border-b ${getBannerStyles()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {getMessage()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              asChild
              className={`h-10 px-6 ${
                isExpired || urgencyLevel === "critical" 
                  ? "bg-white text-red-600 hover:bg-gray-100" 
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              <Link href="/dashboard/integration">
                <RefreshCw className="w-4 h-4 mr-2" />
                {isExpired ? "Forny nu" : "Forny adgang"}
              </Link>
            </Button>
            
            {!isExpired && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                aria-label="Luk notifikation"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
