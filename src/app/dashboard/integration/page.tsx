"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface LinkedInProfile {
  id: string;
  person_urn: string;
  linkedin_member_id: string;
  scope: string;
  access_token_expires_at: string;
  created_at: string;
}

export default function IntegrationPage() {
  const sp = useSearchParams();
  const justConnected = sp.get("connected") === "linkedin";
  const err = sp.get("linkedin_error");
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    const checkLinkedInConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("linkedin_profiles" as any)
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setLinkedInProfile(profile as any);
        }
      } catch (error) {
        console.error("Error checking LinkedIn connection:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLinkedInConnection();
  }, [supabase, justConnected]);

  const isConnected = linkedInProfile !== null;
  const isTokenValid = linkedInProfile 
    ? new Date(linkedInProfile.access_token_expires_at) > new Date()
    : false;

  if (loading) {
    return (
      <div className="space-y-8 pt-16">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Integration</h1>
          <p className="text-lg text-gray-600">Forbind din LinkedIn-konto for at kunne udgive opslag fra dit dashboard.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Tjekker LinkedIn forbindelse...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-16">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Integration</h1>
        <p className="text-lg text-gray-600">Forbind din LinkedIn-konto for at kunne udgive opslag fra dit dashboard.</p>
      </div>

      <div className="max-w-4xl">
        {/* Status Messages */}
        {justConnected && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">LinkedIn forbundet! 🎉</h3>
                <p className="text-gray-700 mt-1">Din LinkedIn-konto er nu forbundet og klar til brug.</p>
              </div>
            </div>
          </Card>
        )}

        {err && (
          <Card className="p-6 bg-gradient-to-r from-red-50 to-red-50 border-red-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Forbindelsesfejl</h3>
                <p className="text-gray-700 mt-1">Fejl: {decodeURIComponent(err)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Connection Status Card */}
        {isConnected && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-white" />
                  </div>
                  {/* Green dot indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    LinkedIn Connected
                    <span className="text-sm font-normal text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      {isTokenValid ? "Active" : "Token Expired"}
                    </span>
                  </h3>
                  <p className="text-gray-700 mt-1">
                    Forbundet den {linkedInProfile ? new Date(linkedInProfile.created_at).toLocaleDateString('da-DK') : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isTokenValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {isTokenValid ? 'Online' : 'Needs Refresh'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Integration Card */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">LinkedIn Integration</h3>
          </div>
          
          <div className="space-y-6">
            {!isConnected ? (
              <>
                <div>
                  <p className="text-base text-gray-600 mb-4">
                    Forbind din LinkedIn-konto for at kunne udgive opslag direkte fra dit dashboard. 
                    Du får adgang til at dele tekst og billeder på din LinkedIn-profil.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-base font-medium text-blue-900 mb-2">Hvad får du adgang til:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Udgiv tekst-opslag på LinkedIn</li>
                      <li>• Upload og del billeder</li>
                      <li>• Administrer dine posts fra ét sted</li>
                      <li>• Sikker OAuth 2.0 forbindelse</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="px-8 h-11 bg-blue-600 hover:bg-blue-700">
                    <a href="/api/linkedin/auth">
                      <LinkIcon className="w-4 h-4" />
                      Connect LinkedIn
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-base text-gray-600 mb-4">
                    Din LinkedIn-konto er forbundet og klar til brug! Du kan nu udgive opslag direkte fra dit dashboard.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 className="text-base font-medium text-green-900 mb-2">Du har nu adgang til:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>✅ Udgiv tekst-opslag på LinkedIn</li>
                      <li>✅ Upload og del billeder</li>
                      <li>✅ Administrer dine posts fra ét sted</li>
                      <li>✅ Sikker OAuth 2.0 forbindelse</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="px-8 h-11 bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/new-post">
                      <ArrowRight className="w-4 h-4" />
                      Opret Nyt Opslag
                    </Link>
                  </Button>
                  
                  {!isTokenValid && (
                    <Button asChild variant="outline" className="px-8 h-11">
                      <a href="/api/linkedin/auth">
                        <LinkIcon className="w-4 h-4" />
                        Genopfrisk Forbindelse
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        {isConnected && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Hurtige handlinger</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard/new-post" className="block">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Opret nyt opslag</h4>
                    <p className="text-sm text-gray-600">Udgiv tekst og billeder på LinkedIn</p>
                  </div>
                </Link>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard" className="block">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Se statistikker</h4>
                    <p className="text-sm text-gray-600">Gå tilbage til dashboard oversigt</p>
                  </div>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
