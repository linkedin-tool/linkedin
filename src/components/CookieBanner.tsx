'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Settings } from 'lucide-react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      setShowBanner(true)
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(cookieConsent)
        setPreferences(savedPreferences)
      } catch {
        setShowBanner(true)
      }
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    setPreferences(prefs)
    setShowBanner(false)
    setShowModal(false)
    
    // Here you would typically initialize your analytics/marketing scripts
    // based on the user's preferences
    console.log('Cookie preferences saved:', prefs)
  }

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    savePreferences(allAccepted)
  }

  const acceptNecessaryOnly = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
    savePreferences(necessaryOnly)
  }

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const saveCustomPreferences = () => {
    savePreferences(preferences)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vi bruger cookies</h3>
              <p className="text-sm text-gray-600">
                BasicPlatform bruger cookies til at forbedre din oplevelse på vores hjemmeside, analysere trafik og personalisere indhold. 
                Ved at klikke &quot;Acceptér alle&quot; samtykker du til vores brug af cookies.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={acceptNecessaryOnly}
                variant="ghost"
                className="px-6 h-11 whitespace-nowrap border border-gray-300"
              >
                Kun nødvendige
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                variant="ghost"
                className="px-6 h-11 whitespace-nowrap border border-gray-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Indstillinger
              </Button>
              <Button
                onClick={acceptAll}
                className="px-6 h-11 whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                Acceptér alle
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-black/10 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-lg border border-gray-200">
            <div className="px-8 py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cookie indstillinger</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Vi bruger cookies til at forbedre din oplevelse på vores hjemmeside. Du kan vælge hvilke typer cookies du vil acceptere nedenfor.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Læs mere om vores brug af cookies og behandling af persondata:</p>
                  <div className="flex gap-4 mt-2">
                    <a href="/cookiepolitik" className="text-blue-600 hover:text-blue-500 underline">
                      Cookie Politik
                    </a>
                    <a href="/privatlivspolitik" className="text-blue-600 hover:text-blue-500 underline">
                      Privatlivspolitik
                    </a>
                  </div>
                </div>
              </div>

              {/* Cookie Categories */}
              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Nødvendige cookies</h3>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="sr-only"
                      />
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt. De kan ikke slås fra.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Altid aktiv</p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Analyse cookies</h3>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Hjælper os med at forstå hvordan besøgende bruger hjemmesiden ved at indsamle og rapportere information anonymt.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Marketing cookies</h3>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.marketing ? 'right-1' : 'left-1'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Bruges til at vise relevante annoncer og måle effektiviteten af vores markedsføringskampagner.
                  </p>
                </div>

                {/* Preference Cookies */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Præference cookies</h3>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => handlePreferenceChange('preferences', e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          preferences.preferences ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        onClick={() => handlePreferenceChange('preferences', !preferences.preferences)}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.preferences ? 'right-1' : 'left-1'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Husker dine indstillinger og præferencer for at give dig en bedre brugeroplevelse.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="px-8 h-11"
                >
                  Tilbage
                </Button>
                <Button
                  onClick={saveCustomPreferences}
                  className="px-8 h-11 bg-blue-600 hover:bg-blue-700"
                >
                  Gem indstillinger
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
