"use client";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLinkedInStatus } from "@/hooks/useLinkedInStatus";

export function LinkedInStatusCard() {
  const { 
    isConnected, 
    isTokenValid, 
    daysUntilExpiry, 
    expiryDate, 
    needsRenewal 
  } = useLinkedInStatus();

  if (!isConnected) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">LinkedIn ikke forbundet</h3>
              <p className="text-sm text-gray-600 mt-1">
                Forbind din LinkedIn-konto for at kunne udgive opslag.
              </p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/integration">
              Forbind LinkedIn
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const isExpired = !isTokenValid;
  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('da-DK', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = () => {
    if (isExpired) {
      return {
        bgColor: "from-red-50 to-red-100",
        borderColor: "border-red-200",
        iconBg: "bg-red-600",
        icon: AlertTriangle,
        title: "LinkedIn-adgang udløbet",
        description: "Din adgang er udløbet. Forny den nu for at fortsætte.",
        buttonText: "Forny Nu",
        buttonStyle: "bg-red-600 hover:bg-red-700",
        urgent: true
      };
    }
    
    if (needsRenewal) {
      const urgency = daysUntilExpiry <= 2 ? "critical" : "warning";
      return {
        bgColor: urgency === "critical" ? "from-orange-50 to-red-50" : "from-yellow-50 to-orange-50",
        borderColor: urgency === "critical" ? "border-orange-200" : "border-yellow-200",
        iconBg: urgency === "critical" ? "bg-orange-600" : "bg-yellow-600",
        icon: Clock,
        title: `LinkedIn-adgang udløber ${daysUntilExpiry === 1 ? 'i morgen' : `om ${daysUntilExpiry} dage`}`,
        description: `Adgangen udløber den ${expiryDate ? formatExpiryDate(expiryDate) : 'N/A'}`,
        buttonText: "Forny Adgang",
        buttonStyle: urgency === "critical" ? "bg-orange-600 hover:bg-orange-700" : "bg-yellow-600 hover:bg-yellow-700",
        urgent: urgency === "critical"
      };
    }

    return {
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      iconBg: "bg-green-600",
      icon: CheckCircle,
      title: "LinkedIn-adgang aktiv",
      description: `Adgangen udløber den ${expiryDate ? formatExpiryDate(expiryDate) : 'N/A'}`,
      buttonText: "Administrer",
      buttonStyle: "bg-green-600 hover:bg-green-700",
      urgent: false
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Card className={`p-6 bg-gradient-to-r ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {config.title}
              {config.urgent && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  URGENT
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild className={`${config.buttonStyle}`}>
            <Link href="/dashboard/integration">
              {(isExpired || needsRenewal) && <RefreshCw className="w-4 h-4 mr-2" />}
              {config.buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
