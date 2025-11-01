'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  User, 
  Target, 
  MessageSquare, 
  FileText, 
  Upload,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
}

interface AITrainingData {
  personal_background?: string
  tone_of_voice?: string[]
  formality_level?: number
  target_audience?: string
  service_offering?: string
  content_preferences?: string[]
  writing_style?: string
  previous_posts?: string
  goals?: string
}

export default function TrainAIPage() {
  const searchParams = useSearchParams()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [trainingData, setTrainingData] = useState<AITrainingData>({
    personal_background: '',
    tone_of_voice: [],
    formality_level: 3,
    target_audience: '',
    service_offering: '',
    content_preferences: [],
    writing_style: '',
    previous_posts: '',
    goals: ''
  })

  const supabase = createClient()

  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams?.get('tab')
    if (tabParam && ['personal', 'tone', 'audience', 'content', 'examples'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setUserProfile(profileData)
      }

      // TODO: Fetch existing AI training data from database when we create the table
      // For now, we'll use local state

      setLoading(false)
    }

    fetchUserProfile()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    // TODO: Save to database when we create the ai_training table
    // For now, we'll just simulate saving
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    setShowSuccess(true)
    setSaving(false)
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleToneToggle = (tone: string) => {
    setTrainingData(prev => ({
      ...prev,
      tone_of_voice: prev.tone_of_voice?.includes(tone)
        ? prev.tone_of_voice.filter(t => t !== tone)
        : [...(prev.tone_of_voice || []), tone]
    }))
  }

  const handleContentPreferenceToggle = (preference: string) => {
    setTrainingData(prev => ({
      ...prev,
      content_preferences: prev.content_preferences?.includes(preference)
        ? prev.content_preferences.filter(p => p !== preference)
        : [...(prev.content_preferences || []), preference]
    }))
  }

  const getFormalityText = (level: number) => {
    switch (level) {
      case 1: return 'Meget afslappet'
      case 2: return 'Afslappet'
      case 3: return 'Balanceret'
      case 4: return 'Formel'
      case 5: return 'Meget formel'
      default: return 'Balanceret'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Om dig', icon: User },
    { id: 'tone', label: 'Tone of Voice', icon: MessageSquare },
    { id: 'audience', label: 'Målgruppe', icon: Target },
    { id: 'content', label: 'Indhold', icon: FileText },
    { id: 'examples', label: 'Eksempler', icon: Upload },
  ]

  const toneOptions = [
    'Professionel', 'Personlig', 'Humoristisk', 'Inspirerende', 
    'Skarp', 'Empatisk', 'Storyteller', 'Analytisk'
  ]

  const contentPreferences = [
    'Historier og cases', 'Tips og råd', 'Analyser og indsigter', 
    'Holdninger og meninger', 'Branche nyheder', 'Personlige refleksioner'
  ]

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccess && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Fedt! Vi går nu i gang med at træne din AI
              </h3>
              <p className="text-gray-700 mt-1">
                Din AI lærer nu din skrivestil og bliver knivskarp på at ramme din tone of voice. 
                Jo mere information du giver, desto bedre bliver den til at skrive som dig.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Træn din AI</h1>
        <p className="text-lg text-gray-600">
          Gør din AI personlig. Jo mere du fortæller, desto bedre bliver den til at skrive som dig.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-base flex items-center gap-2`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="max-w-4xl">
        {/* Personal Background Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Personlig baggrund</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="background" className="block text-base font-medium text-gray-700 mb-2">
                    Fortæl kort om dig selv og din baggrund
                  </label>
                  <textarea
                    id="background"
                    rows={6}
                    value={trainingData.personal_background || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, personal_background: e.target.value }))}
                    placeholder="Fx: Jeg er salgschef med 10 års erfaring inden for B2B software. Jeg hjælper virksomheder med at optimere deres salgsprocesser og øge konverteringsraten..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Beskriv din rolle, erfaring og hvad du specialiserer dig i
                  </p>
                </div>

                <div>
                  <label htmlFor="offering" className="block text-base font-medium text-gray-700 mb-2">
                    Hvad tilbyder du? Hvordan hjælper du din målgruppe?
                  </label>
                  <textarea
                    id="offering"
                    rows={4}
                    value={trainingData.service_offering || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, service_offering: e.target.value }))}
                    placeholder="Fx: Jeg hjælper selvstændige konsulenter med at skabe flere kvalificerede leads via LinkedIn gennem strategisk content marketing og personlig branding..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tone of Voice Tab */}
        {activeTab === 'tone' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Tone of Voice</h3>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-4">
                    Hvordan vil du beskrive din skrivestil? (Vælg 2-3 der passer bedst)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => handleToneToggle(tone)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          trainingData.tone_of_voice?.includes(tone)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-4">
                    Hvor formel er din stil? ({getFormalityText(trainingData.formality_level || 3)})
                  </label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={trainingData.formality_level || 3}
                      onChange={(e) => setTrainingData(prev => ({ ...prev, formality_level: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Afslappet</span>
                      <span>Corporate</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="writing-style" className="block text-base font-medium text-gray-700 mb-2">
                    Beskriv din skrivestil med egne ord
                  </label>
                  <textarea
                    id="writing-style"
                    rows={4}
                    value={trainingData.writing_style || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, writing_style: e.target.value }))}
                    placeholder="Fx: Jeg skriver direkte og til sagen, men med et personligt touch. Jeg bruger ofte konkrete eksempler og undgår for meget jargon..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Target Audience Tab */}
        {activeTab === 'audience' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Målgruppe og formål</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="target-audience" className="block text-base font-medium text-gray-700 mb-2">
                    Hvem henvender dine opslag sig til?
                  </label>
                  <textarea
                    id="target-audience"
                    rows={4}
                    value={trainingData.target_audience || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Fx: Rekrutteringsledere i tech-virksomheder, selvstændige konsulenter, startup founders, HR-direktører i mellemstore virksomheder..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="goals" className="block text-base font-medium text-gray-700 mb-2">
                    Hvad vil du gerne have, at dine opslag opnår?
                  </label>
                  <textarea
                    id="goals"
                    rows={4}
                    value={trainingData.goals || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, goals: e.target.value }))}
                    placeholder="Fx: Flere leads til min konsulentvirksomhed, styrke min personlige branding, skabe dialog og engagement, inspirere andre i branchen..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Content Preferences Tab */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Indholdspræferencer</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-4">
                    Hvilke typer indhold foretrækker du? (Vælg flere)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {contentPreferences.map((preference) => (
                      <button
                        key={preference}
                        onClick={() => handleContentPreferenceToggle(preference)}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                          trainingData.content_preferences?.includes(preference)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Tip til bedre AI-træning</h4>
                      <p className="text-blue-800 text-sm">
                        Vælg de indholdstyper, du oftest skriver om eller gerne vil skrive mere om. 
                        Dette hjælper AI'en med at foreslå relevante emner og strukturere dine opslag korrekt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <Card className="p-8 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Tidligere opslag og eksempler</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="previous-posts" className="block text-base font-medium text-gray-700 mb-2">
                    Indsæt 5-10 af dine bedste LinkedIn opslag
                  </label>
                  <textarea
                    id="previous-posts"
                    rows={12}
                    value={trainingData.previous_posts || ''}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, previous_posts: e.target.value }))}
                    placeholder="Kopier og indsæt dine bedste LinkedIn opslag her. Adskil hvert opslag med en linje med '---'

Eksempel:

Jeg lærte noget vigtigt i dag om kundeservice...
[Dit første opslag]

---

Har du nogensinde oplevet at...
[Dit andet opslag]

---"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none font-mono text-sm text-gray-900 placeholder-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Jo flere eksempler du giver, desto bedre bliver AI'en til at efterligne din stil
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-2">Sådan bruges dine eksempler</h4>
                      <p className="text-yellow-800 text-sm">
                        AI'en analyserer dine opslag for at lære din tone, struktur, ordvalg og emner. 
                        Vælg opslag der repræsenterer din bedste skrivestil og som har fået god engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 h-11 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Gemmer træning...' : 'Gem AI træning'}
          </Button>
        </div>
      </div>
    </div>
  )
}
