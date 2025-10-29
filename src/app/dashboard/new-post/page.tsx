"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Image, CheckCircle, AlertCircle } from "lucide-react";

export default function NewPostPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("Udgiver...");

    const fd = new FormData();
    fd.append("text", text);
    fd.append("visibility", visibility);
    if (file) fd.append("image", file);

    try {
      const res = await fetch("/api/linkedin/post", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) {
        setStatus(`Fejl: ${body.error || res.statusText}`);
      } else {
        setStatus(`Udgivet! LinkedIn ID: ${body.ugcPostId || "ukendt"}`);
        // Reset form on success
        setText("");
        setFile(null);
      }
    } catch {
      setStatus("Der skete en netværksfejl. Prøv igen.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div className="space-y-8 pt-16">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Nyt Opslag</h1>
        <p className="text-lg text-gray-600">Opret og udgiv indhold på din LinkedIn-profil.</p>
      </div>

      <div className="max-w-4xl">
        {/* Status Messages */}
        {status && (
          <Card className={`p-6 mb-6 ${
            status.includes("Fejl") || status.includes("fejl")
              ? "bg-gradient-to-r from-red-50 to-red-50 border-red-200"
              : status.includes("Udgivet")
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              : "bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200"
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                status.includes("Fejl") || status.includes("fejl")
                  ? "bg-red-600"
                  : status.includes("Udgivet")
                  ? "bg-green-600"
                  : "bg-blue-600"
              }`}>
                {status.includes("Fejl") || status.includes("fejl") ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : status.includes("Udgivet") ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <PlusCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {status.includes("Fejl") || status.includes("fejl")
                    ? "Fejl ved udgivelse"
                    : status.includes("Udgivet")
                    ? "Opslag udgivet! 🎉"
                    : "Udgiver opslag..."
                  }
                </h3>
                <p className="text-gray-700 mt-1">{status}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Post Creation Card */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <PlusCircle className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Opret LinkedIn Opslag</h3>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="text" className="block text-base font-medium text-gray-700 mb-2">
                Opslag tekst
              </label>
              <textarea
                id="text"
                className="w-full border-2 border-gray-200 rounded-2xl p-4 min-h-[120px] text-base text-gray-900 resize-none focus:border-gray-200 focus:outline-none focus:ring-0 focus:shadow-none transition-colors"
                placeholder="Skriv dit opslag her... Del dine tanker, opdateringer eller indsigter med dit LinkedIn-netværk."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Brug hashtags og tag relevante personer for at øge rækkevidden.
              </p>
            </div>

            <div>
              <label htmlFor="image" className="block text-base font-medium text-gray-700 mb-2">
                Billede (valgfrit)
              </label>
              <div className="relative">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={isSubmitting}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Image className="w-4 h-4" />
                    <span>Valgt: {file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      disabled={isSubmitting}
                    >
                      Fjern
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Understøttede formater: JPG, PNG, GIF. Maks størrelse: 10MB.
              </p>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Hvem kan se dit opslag?
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="visibility-public"
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={visibility === "PUBLIC"}
                    onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "CONNECTIONS")}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="visibility-public" className="ml-3 text-sm font-medium text-gray-700">
                    <span className="font-semibold">Offentligt</span>
                    <span className="block text-gray-500">Alle på LinkedIn kan se dit opslag</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="visibility-connections"
                    type="radio"
                    name="visibility"
                    value="CONNECTIONS"
                    checked={visibility === "CONNECTIONS"}
                    onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "CONNECTIONS")}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="visibility-connections" className="ml-3 text-sm font-medium text-gray-700">
                    <span className="font-semibold">Kun forbindelser</span>
                    <span className="block text-gray-500">Kun dine LinkedIn-forbindelser kan se opslaget</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-base font-medium text-blue-900 mb-2">Før du udgiver:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sørg for at dit indhold er professionelt og relevant</li>
                <li>• Tjek stavning og grammatik</li>
                <li>• Overvej at tilføje relevante hashtags</li>
                <li>• Billeder øger engagement betydeligt</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || !text.trim()} 
                className="px-8 h-11 bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                {isSubmitting ? "Udgiver..." : "Udgiv på LinkedIn"}
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </div>
  );
}
