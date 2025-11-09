'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { 
  Check,
  ArrowRight,
  Shield,
  Edit3,
  MessageSquare,
  Brain,
  Calendar,
  Mic,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  Target,
  Users,
  RotateCcw
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string
  email: string
  subscription_plan?: string | null
  subscription_status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  scheduled_downgrade_to?: string | null
  scheduled_downgrade_date?: string | null
  team_members_count?: number | null
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingProCheckout, setCreatingProCheckout] = useState(false)
  const [creatingTeamCheckout, setCreatingTeamCheckout] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState(5)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [progressDemo, setProgressDemo] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState<'initial' | 'generating' | 'completed'>('initial')
  const [completedAngles, setCompletedAngles] = useState<Set<string>>(new Set())
  const [activeDemoTab, setActiveDemoTab] = useState(0)
  const [activeDemoHook, setActiveDemoHook] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get user profile to check subscription status
        const { data: profileData } = await supabase
          .from('users')
          .select('id, name, email, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, scheduled_downgrade_to, scheduled_downgrade_date, team_members_count')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profileData)
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase])

  // Update selectedSeats when userProfile changes for Team users
  useEffect(() => {
    if (userProfile?.subscription_plan === 'team' && userProfile?.team_members_count) {
      setSelectedSeats(userProfile.team_members_count)
    }
  }, [userProfile])

  // Demo data
  const demoIdea = "Jeg har længe gået og overvejet noget lidt skørt: At købe en Tesla - men ikke bare for at have en smart bil. Jeg vil lave et eksperiment hvor jeg kun arbejder fra bilen, indtil den har tjent sig selv hjem. Hvad tror I - kan det lade sig gøre?"

  const demoPosts = [
    {
      id: 1,
      angle: 'jordnær',
      title: 'Jordnær',
      content: 'Jeg har tænkt mig at kaste mig ud i noget ret vildt - eller måske bare skørt. 🚗\n\nJeg overvejer seriøst at købe en Tesla og så kun arbejde fra bilen, indtil den har tjent sig selv hjem.\n\nJa, du læste rigtigt. Mit kontor bliver bagsædet, min udsigt skifter hver dag, og hver krone jeg tjener går til at betale bilen af.\n\nHvad tror I? Er det genial eller sindssyg? 🤔',
      hooks: [
        'Jeg tester en bizar arbejdseksperiment: Bagsædet i en Tesla bliver mit eneste kontor - indtil bilen er betalt.',
        'Ville du kunne tjene din næste bil hjem direkte fra bilens bagsæde?',
        'Mit kontor: Kun bagsædet i en Tesla. Hver dag, ny lokation – strand eller parkeringsplads.'
      ]
    },
    {
      id: 2,
      angle: 'professionel',
      title: 'Professionel',
      content: 'Hvordan kan man kombinere innovation, mobilitet og forretning på én og samme tid? 🚗\n\nJeg har sat mig for at teste grænserne for remote work ved at købe en Tesla og udelukkende arbejde derfra, indtil køretøjet har finansieret sig selv.\n\nDette eksperiment vil give indsigt i:\n• Produktivitet i mobile arbejdsmiljøer\n• ROI på innovative arbejdsformer\n• Fremtidens fleksible forretningsmodeller\n\nHvad er jeres tanker om denne tilgang til moderne arbejdsliv?',
      hooks: [
        'Kan du tjene en Tesla hjem - udelukkende fra sædet? Jeg tester grænserne for mobilitet og ROI.',
        'Til dig, der arbejder hybrid eller remote: Hvad sker der, når kontoret flytter ud i bilen?',
        'Jeg satte én regel: Bilen skal finansiere sig selv gennem mit arbejde derfra.'
      ]
    },
    {
      id: 3,
      angle: 'storytelling',
      title: 'Storytelling',
      content: 'Det her bliver måske det vildeste, jeg nogensinde har gjort.\n\nForestil dig at købe en Tesla - og beslutte at dit kontor fra nu af kun er bilens indre. Hver dag en ny udsigt, hver arbejdstime et skridt tættere på at gøre bilen "gratis".\n\nJeg starter Danmarks måske mest ekstreme remote work-eksperiment: At tjene en bil hjem, én arbejdsdag ad gangen, direkte fra førersædet.\n\nFølg med når jeg deler alt - fra de første nervøse dage til (forhåbentlig) den dag, hvor den sidste rate er betalt. 🚗✨',
      hooks: [
        'Jeg bytter mit kontor ud med en Tesla – og mit mål er simpelt: Bilen skal tjene sig selv hjem.',
        'Ville du turde kassere både skrivebord og hjemmekontor? Jeg arbejder kun fra min Tesla.',
        'Fra strand til skov – nu bliver Teslaen mit eneste kontor. Hver dag afslører jeg både indtægter og bump på vejen.'
      ]
    }
  ]

  // Demo animation effect
  useEffect(() => {
    if (showDemo && demoStep === 'generating') {
      const interval = setInterval(() => {
        setProgressDemo(prev => {
          const newProgress = prev + 2
          
          // Simulate completing angles in pairs (post + hook)
          if (newProgress >= 20 && !completedAngles.has('jordnær-post')) {
            setCompletedAngles(prev => new Set([...prev, 'jordnær-post']))
          }
          if (newProgress >= 30 && !completedAngles.has('jordnær-hook')) {
            setCompletedAngles(prev => new Set([...prev, 'jordnær-hook']))
          }
          if (newProgress >= 50 && !completedAngles.has('professionel-post')) {
            setCompletedAngles(prev => new Set([...prev, 'professionel-post']))
          }
          if (newProgress >= 60 && !completedAngles.has('professionel-hook')) {
            setCompletedAngles(prev => new Set([...prev, 'professionel-hook']))
          }
          if (newProgress >= 80 && !completedAngles.has('storytelling-post')) {
            setCompletedAngles(prev => new Set([...prev, 'storytelling-post']))
          }
          if (newProgress >= 90 && !completedAngles.has('storytelling-hook')) {
            setCompletedAngles(prev => new Set([...prev, 'storytelling-hook']))
            setTimeout(() => {
              setDemoStep('completed')
            }, 500)
          }
          
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 150)
      return () => clearInterval(interval)
    }
  }, [showDemo, demoStep, completedAngles])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const startDemo = () => {
    setProgressDemo(0)
    setShowDemo(true)
    setDemoStep('generating')
    setCompletedAngles(new Set())
    setActiveDemoTab(0)
    setActiveDemoHook(0)
  }

  const resetDemo = () => {
    setShowDemo(false)
    setDemoStep('initial')
    setProgressDemo(0)
    setCompletedAngles(new Set())
    setActiveDemoTab(0)
    setActiveDemoHook(0)
  }

  const navigateDemoHook = (direction: 'prev' | 'next') => {
    const currentPost = demoPosts[activeDemoTab]
    if (!currentPost) return
    
    const totalHooks = currentPost.hooks.length
    if (direction === 'next') {
      setActiveDemoHook((prev) => (prev + 1) % totalHooks)
    } else {
      setActiveDemoHook((prev) => (prev - 1 + totalHooks) % totalHooks)
    }
  }

  const handleWorkWithPost = async () => {
    const { default: Swal } = await import('sweetalert2')
    
    // Check if user has active subscription
    if (user && userProfile?.subscription_status === 'active') {
      const result = await Swal.fire({
        title: '✅ Du har allerede adgang!',
        text: 'Du har et aktivt Pro-abonnement og kan bruge alle Nolia\'s funktioner i dit dashboard.',
        icon: undefined,
        confirmButtonText: 'Gå til dashboard',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium'
        },
        buttonsStyling: false
      })
      
      // Only redirect if user clicked the confirm button
      if (result.isConfirmed) {
        window.location.href = '/dashboard'
      }
      return
    }
    
    const result = await Swal.fire({
      title: '🚀 Klar til at teste Nolia?',
      text: 'Opret en gratis profil og få adgang til alle funktioner i 7 dage - ingen kreditkort påkrævet!',
      icon: undefined,
      showCancelButton: true,
      confirmButtonText: 'Prøv gratis i dag',
      cancelButtonText: 'Se priser først',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-lg font-semibold text-gray-900',
        htmlContainer: 'text-gray-700',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mr-3',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium'
      },
      buttonsStyling: false
    })

    if (result.isConfirmed) {
      if (user) {
        // User is logged in but doesn't have active subscription - go to dashboard
        window.location.href = '/dashboard'
      } else {
        // User not logged in - go to signup
        window.location.href = '/auth/signup?plan=free_trial'
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // User clicked "Se priser først" - scroll to pricing
      const section = document.getElementById('pricing');
      if (section) {
        // iOS Safari fix: Use setTimeout and alternative scroll method
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          // For iOS, wait for modal to close completely, then jump directly to position
          setTimeout(() => {
            const elementPosition = section.offsetTop;
            const headerHeight = 80;
            const offsetPosition = elementPosition - headerHeight;
            
            // Direct jump to position - no smooth scrolling to avoid conflicts
            window.scrollTo({
              top: offsetPosition,
              behavior: 'auto'
            });
          }, 500); // Half second delay to ensure modal is completely closed
        } else {
          // For desktop/other browsers, use scrollIntoView
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    // If result.isDismissed (clicked outside or escape), do nothing - just close modal
  }

  const handleProClick = async () => {
    if (!user || !userProfile) {
      // Not logged in - go to signup
      window.location.href = '/auth/signup?plan=pro'
      return
    }

    // User is logged in - check subscription status
    if (userProfile.subscription_status === 'active' && userProfile.subscription_plan === 'pro') {
      alert('Du har allerede et Pro abonnement!')
      return
    }

    setCreatingProCheckout(true)
    
    try {
      let response
      
      if (userProfile.subscription_status === 'active' && userProfile.subscription_plan === 'team') {
        // Downgrade from Team to Pro
        console.log('🔄 Sending downgrade request:', {
          customerId: userProfile.stripe_customer_id ? 'EXISTS' : 'MISSING',
          targetPlan: 'pro',
          upgradeType: 'downgrade',
          userProfile: {
            subscription_status: userProfile.subscription_status,
            subscription_plan: userProfile.subscription_plan,
            stripe_customer_id: userProfile.stripe_customer_id ? 'EXISTS' : 'MISSING'
          }
        })
        
        if (!userProfile.stripe_customer_id) {
          alert('Fejl: Ingen Stripe customer ID fundet. Prøv at logge ud og ind igen.')
          return
        }
        
        response = await fetch('/api/upgrade-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: userProfile.stripe_customer_id,
            targetPlan: 'pro',
            upgradeType: 'downgrade'
          }),
        })
      } else {
        // Create new Pro subscription
        response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userProfile.email,
            name: userProfile.name,
            plan: 'pro'
          }),
        })
      }

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe Checkout or success page
        window.location.href = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`
      } else {
        alert('Fejl ved oprettelse af betaling: ' + data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Der skete en fejl ved oprettelse af betaling')
    } finally {
      setCreatingProCheckout(false)
    }
  }

  const getProButtonText = () => {
    if (loading) return 'Indlæser...'
    if (creatingProCheckout) {
      return 'Opretter betaling...'
    }
    if (!user) return 'Vælg Pro'
    if (userProfile?.subscription_status === 'active' && userProfile?.subscription_plan === 'pro') return 'Dit nuværende plan'
    
    // Team users should not be able to downgrade from pricing page
    if (userProfile?.subscription_status === 'active' && userProfile?.subscription_plan === 'team') {
      return null // Will show custom text instead of button
    }
    
    return 'Vælg Pro'
  }

  const isProButtonDisabled = (): boolean => {
    // Disable if loading, creating checkout, or already has Pro
    return loading || creatingProCheckout || 
           (user !== null && userProfile?.subscription_status === 'active' && userProfile?.subscription_plan === 'pro')
  }

  const handleTeamClick = async () => {
    if (!user || !userProfile) {
      // Not logged in - go to signup
      window.location.href = `/auth/signup?plan=team&quantity=${selectedSeats}`
      return
    }

    // User is logged in - check subscription status
    if (userProfile.subscription_status === 'active' && userProfile.subscription_plan === 'team') {
      // Team users cannot perform actions from pricing page - they should use settings
      return
    }

    setCreatingTeamCheckout(true)
    
    try {
      let response
      
      if (userProfile.subscription_status === 'active' && userProfile.subscription_plan === 'pro') {
        // Upgrade from Pro to Team - go to Stripe for payment
        response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userProfile.email,
            name: userProfile.name,
            plan: 'team',
            quantity: selectedSeats
          }),
        })
      } else {
        // Create new Team subscription
        response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userProfile.email,
            name: userProfile.name,
            plan: 'team',
            quantity: selectedSeats
          }),
        })
      }

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Fejl ved oprettelse af betaling')
      }
    } catch (error) {
      console.error('Error creating Team checkout:', error)
      alert('Der opstod en fejl. Prøv igen.')
    } finally {
      setCreatingTeamCheckout(false)
    }
  }

  const getTeamButtonText = () => {
    if (loading) return 'Indlæser...'
    if (creatingTeamCheckout) {
      return 'Opretter betaling...'
    }
    if (!user) return 'Vælg Team'
    
    // Team users should manage subscriptions in settings
    if (userProfile?.subscription_status === 'active' && userProfile?.subscription_plan === 'team') {
      return 'Dit nuværende plan'
    }
    
    // Pro users can upgrade to Team
    if (userProfile?.subscription_status === 'active' && userProfile?.subscription_plan === 'pro') {
      return 'Opgradér til Team'
    }
    
    return 'Vælg Team'
  }

  const isTeamButtonDisabled = (): boolean => {
    // Only disable for existing Team users (they should manage in settings)
    const hasTeamSubscription = Boolean(user !== null && userProfile?.subscription_status === 'active' && 
      userProfile?.subscription_plan === 'team')
    
    return loading || creatingTeamCheckout || hasTeamSubscription
  }

  const handleFreeTrialClick = async () => {
    if (!user) {
      // Not logged in - go to signup for free trial
      window.location.href = '/auth/signup?plan=free_trial'
      return
    }

    // User is already logged in - they already have access
    if (userProfile) {
      // Redirect to dashboard since they're already signed up
      window.location.href = '/dashboard'
    }
  }

  const getFreeTrialButtonText = () => {
    if (loading) return 'Indlæser...'
    if (!user) return 'Start gratis'
    return 'Allerede bruger'
  }

  return (
    <>
      <div className="flex-1 bg-white">
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-12 md:py-20 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Skab stærke LinkedIn-opslag på få minutter – med din egen <span className="text-blue-600">AI-assistent</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Nolia lærer din stemme, dit sprog og dit publikum.<br />
                  Du får idéer, hooks og færdige opslag, der rammer rigtigt – hver gang.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="px-8 h-12 bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-900 hover:to-blue-800 shadow-lg rounded-full transition-all duration-200 flex items-center justify-center border-2 border-transparent"
                    onClick={handleFreeTrialClick}
                    disabled={loading}
                  >
                    Prøv gratis i 7 dage
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="px-8 h-12 border-2 border-gray-300 hover:border-gray-400 rounded-full transition-all duration-200 flex items-center justify-center bg-white hover:bg-gray-50"
        onClick={() => {
          const section = document.getElementById('demo');
          if (section) {
            const headerHeight = 80; // Header højde i pixels
            const isMobile = window.innerWidth < 768; // Mobile breakpoint
            const mobileReducedOffset = isMobile ? 40 : 0; // 40px mindre offset på mobil
            const elementPosition = section.offsetTop;
            const offsetPosition = elementPosition - headerHeight + mobileReducedOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }}
                  >
                    Se demo nu
                    <Play className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Right Column - Mockup */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{width: '75%'}}></div>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">Genererer 3 versioner...</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="text-xs text-blue-600 font-medium mb-2">🪝 Scroll-stopping hook:</div>
                      <div className="text-blue-800 font-semibold text-sm">
                        Kan du arbejde 100% mobilt – og få bilen til at betale sig selv?
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-800 leading-relaxed">
                        Jeg har længe gået og overvejet noget lidt skørt: At købe en Tesla - men ikke bare for at have en smart bil...
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generer 3 hooks
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <Calendar className="w-4 h-4 mr-1" />
                        Planlæg
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="pt-20 pb-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Fra idé til færdigt LinkedIn-opslag på under 2 minutter
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-2xl font-bold text-blue-600">1</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Indtal eller skriv din idé
                </h3>
                <p className="text-gray-600">
                  Del en tanke, et koncept eller et udkast. Nolia forstår dit sprog og konverterer det til et klart budskab.
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-2xl font-bold text-emerald-600">2</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  AI-forbedring og vinkelvalg
                </h3>
                <p className="text-gray-600">
                  Nolia analyserer og giver dig tre versioner: Jordnær, Professionel og Storytelling. Du kan se forslagene side-om-side.
                </p>
              </Card>
              
              <Card className="p-8 text-center bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-2xl font-bold text-amber-600">3</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Færdiggør og udgiv
                </h3>
                <p className="text-gray-600">
                  Vælg mellem flere hooks, tilpas teksten og planlæg udgivelse direkte til LinkedIn.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Flow Section */}
        <section id="demo" className="pt-20 pb-32 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-[60px] pt-[80px]">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Oplev hvor hurtigt det går
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Fra idé til 3 personlige LinkedIn-udkast med 9 &quot;scroll-stopping&quot; hooks – skrevet i din stil, til dit publikum. Vælg den version du vil arbejde videre med og forfin den til det perfekte opslag.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
              {/* Initial state - show idea */}
              {demoStep === 'initial' && (
                <div className="text-center space-y-6">
                  <div className="bg-gray-100 rounded-2xl p-6 text-left">
                    <div className="text-sm text-gray-600 mb-2">Din idé:</div>
                    <div className="text-gray-800 leading-relaxed">
                      {demoIdea}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startDemo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generer 3 opslag
                  </Button>
                </div>
              )}

              {/* Generating state - show progress */}
              {demoStep === 'generating' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Genererer 3 opslag</h3>
                    <p className="text-gray-600 mb-6">
                      AI&apos;en arbejder på at skabe 3 fængende opslag med forskellige vinkler baseret på din idé.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{width: `${progressDemo}%`}}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">{Math.round(progressDemo)}% færdig</p>
                  </div>

                  <div className="space-y-3">
                    {['jordnær', 'professionel', 'storytelling'].map((angle) => (
                      <div key={angle} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                        <span className="capitalize text-gray-700 font-medium">{angle} vinkel:</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium w-[80px] flex items-center justify-center ${
                            completedAngles.has(`${angle}-post`) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="mr-1">Opslag</span>
                            <span className="w-3 text-center">{completedAngles.has(`${angle}-post`) ? '✓' : '...'}</span>
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium w-[68px] flex items-center justify-center ${
                            completedAngles.has(`${angle}-hook`) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="mr-1">Hook</span>
                            <span className="w-3 text-center">{completedAngles.has(`${angle}-hook`) ? '✓' : '...'}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed state - show results */}
              {demoStep === 'completed' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 text-center sm:text-left">3 Genererede LinkedIn Opslag</h3>
                    <button 
                      onClick={resetDemo}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Start forfra
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex justify-center sm:justify-start border-b border-gray-200">
                    {demoPosts.map((post, index) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          setActiveDemoTab(index)
                          setActiveDemoHook(0)
                        }}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeDemoTab === index
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {post.title}
                      </button>
                    ))}
                  </div>

                  {/* Hook Variant Navigation - Fixed at top */}
                  <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium">
                        Hook variant {activeDemoHook + 1} ud af {demoPosts[activeDemoTab].hooks.length}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => navigateDemoHook('prev')}
                          className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          disabled={demoPosts[activeDemoTab].hooks.length <= 1}
                        >
                          <ChevronLeft className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateDemoHook('next')}
                          className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          disabled={demoPosts[activeDemoTab].hooks.length <= 1}
                        >
                          <ChevronRight className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto pr-2 max-h-96">
                    {/* Hook Section */}
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                      <p className="text-blue-900 font-medium text-sm mb-3">🪝 Scroll-stopping hook:</p>
                      <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-semibold">
                        {demoPosts[activeDemoTab].hooks[activeDemoHook]}
                      </p>
                    </div>
                    
                    {/* Post Content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {demoPosts[activeDemoTab].content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fixed CTA at bottom */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleWorkWithPost}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-medium transition-colors"
                    >
                      Arbejd videre med dette opslag
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="pt-32 pb-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Funktioner, der gør Nolia uundværlig
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  AI-genererede opslag
                </h3>
                <p className="text-gray-600">
                  Skab tre unikke versioner af hvert opslag.
                </p>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Personlige hooks
                </h3>
                <p className="text-gray-600">
                  Vælg mellem tre hooks pr. opslag – direkte i editoren.
                </p>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Din tone – ikke generisk AI
                </h3>
                <p className="text-gray-600">
                  Nolia lærer din skrivestil og målgruppe.
                </p>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Content-plan og kalender
                </h3>
                <p className="text-gray-600">
                  Planlæg opslag direkte til LinkedIn.
                </p>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <Mic className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Tal-til-tekst
                </h3>
                <p className="text-gray-600">
                  Indtal idéer på farten – Nolia omsætter dem automatisk.
                </p>
              </Card>
              
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Klar til at poste
                </h3>
                <p className="text-gray-600">
                  Gem som kladde, planlæg eller udgiv direkte.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Er Nolia noget for dig?
              </h2>
              <p className="text-xl text-gray-600">
                Nolia er skabt til professionelle, der vil styrke deres LinkedIn-tilstedeværelse uden at bruge timer hver uge
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-white border border-gray-100 rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Perfekt til dig, der er:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Soloselvstændig, konsulent eller coach</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Specialist der vil styrke sin synlighed</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Iværksætter med personligt brand</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Leder der deler faglig viden</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 bg-white border border-gray-100 rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Hvis du genkender dig selv:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Får ofte gode idéer, men mangler struktur</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Har svært ved at finde tid til at skrive</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Vil poste med din egen stemme – bare hurtigere</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">Ønsker konsistent LinkedIn-aktivitet</span>
                  </li>
                </ul>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                Nolia hjælper dig med at transformere dine tanker til professionelle LinkedIn-opslag på minutter, ikke timer.
              </p>
              <button
                onClick={() => {
                  const section = document.getElementById('pricing');
                  if (section) {
                    const headerHeight = 80;
                    const elementPosition = section.offsetTop;
                    const offsetPosition = elementPosition - headerHeight;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-medium transition-colors inline-flex items-center gap-2"
              >
                Se priser og kom i gang
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vælg den plan der passer til dig
              </h2>
              <p className="text-xl text-gray-600">
                Prøv gratis i 7 dage - ingen binding eller skjulte omkostninger
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="p-8 bg-white border border-gray-100 rounded-3xl transition-shadow duration-300 relative flex flex-col" style={{boxShadow: '0 -5px 15px -3px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratis prøveperiode</h3>
                  <p className="text-gray-600 mb-6">Prøv det helt gratis i 7 dage</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">0 kr</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Alle Pro funktioner i 7 dage</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Komplet dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Stripe integration</span>
          </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Ingen forpligtelser</span>
          </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  {user ? (
                    <Button 
                      className="w-full px-8 h-11 bg-blue-800 text-white rounded-full font-medium cursor-default"
                      disabled={true}
                    >
                      Allerede bruger
                    </Button>
                  ) : (
                    <Button 
                      className="w-full px-8 h-11 bg-blue-800 hover:bg-blue-900 text-white rounded-full font-semibold  transition-all duration-200" 
                      onClick={handleFreeTrialClick}
                      disabled={loading}
                    >
                      {getFreeTrialButtonText()}
                    </Button>
                  )}
                </div>
              </Card>
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl transition-shadow duration-300 relative flex flex-col" style={{boxShadow: '0 -5px 15px -3px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-6">Fuld adgang til platformen</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">299 kr</span>
                    <span className="text-gray-600">/måned</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Ubegrænset brugere</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Avanceret dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Prioriteret support</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Alle fremtidige features</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  {getProButtonText() === null ? (
                    <Button 
                      className="w-full px-8 h-11 bg-blue-800 text-white rounded-full font-medium cursor-default"
                      disabled={true}
                    >
                      Inkluderet i Team plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full px-8 h-11 bg-gradient-to-r from-blue-800 to-blue-700 hover:from-blue-900 hover:to-blue-800 text-white rounded-full font-semibold shadow-lg  transition-all duration-200" 
                      onClick={handleProClick}
                      disabled={isProButtonDisabled()}
                    >
                      {getProButtonText()}
                    </Button>
                  )}
                </div>
              </Card>
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-3xl transition-shadow duration-300 relative flex flex-col" style={{boxShadow: '0 -5px 15px -3px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
                  <p className="text-gray-600 mb-6">For virksomheder og teams</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{selectedSeats * 199} kr</span>
                    <span className="text-gray-600">/måned</span>
                    <div className="text-sm text-gray-500 mt-1">
                      199 kr per medarbejder
                    </div>
                  </div>
                  
                  {/* Seat Slider */}
                  <div className="mb-8">
                    <div className="flex items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Antal medarbejdere:
                      </label>
                      <div className="ml-2 bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-sm font-semibold">
                        {selectedSeats}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="3"
                        max="50"
                        value={selectedSeats}
                        onChange={(e) => setSelectedSeats(parseInt(e.target.value))}
                        className="w-full appearance-none cursor-pointer slider"
                        style={{
                          '--slider-progress': `${((selectedSeats - 3) / (50 - 3)) * 100}%`
                        } as React.CSSProperties & { '--slider-progress': string }}
                      />
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Alle Pro funktioner</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Team medlemmer</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Tildel opslag til medarbejdere</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                      <span className="text-gray-700">Centraliseret content styring</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <Button 
                    className="w-full px-8 h-11 bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-900 hover:to-purple-800 text-white rounded-full font-semibold shadow-lg transition-all duration-200" 
                    onClick={handleTeamClick}
                    disabled={isTeamButtonDisabled()}
                  >
                    {getTeamButtonText()}
                  </Button>
                </div>
              </Card>
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-600">
                {!user && (
                  <>
                    <Shield className="w-5 h-5 inline mr-2" />
                    Kom i gang på under 2 minutter • Ingen kreditkort påkrævet • Opsig når som helst
                  </>
                )}
              </p>
            </div>
        </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Brugerne siger det bedst
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-8 bg-white border border-gray-100 rounded-3xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mette Holm</div>
                    <div className="text-sm text-gray-600">LinkedIn-coach</div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg italic">
                  &ldquo;Jeg har aldrig skrevet så mange opslag – og det føles stadig som mig.&rdquo;
                </p>
              </Card>
              
              <Card className="p-8 bg-white border border-gray-100 rounded-3xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Jonas Friis</div>
                    <div className="text-sm text-gray-600">Iværksætter</div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg italic">
                  &ldquo;Jeg kan brainstorme, skrive og planlægge hele min måneds content på under en time.&rdquo;
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 pb-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ofte stillede spørgsmål
              </h2>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  question: "Er det virkelig mig, der skriver – eller AI?",
                  answer: "Nolia skriver ud fra dine idéer, din stemme og dit mål. Den hjælper – ikke erstatter."
                },
                {
                  question: "Hvor mange opslag kan jeg lave?",
                  answer: "Ubegrænset i Pro-planen."
                },
                {
                  question: "Kan jeg ændre teksten efter AI'en har skrevet den?",
                  answer: "Selvfølgelig – du kan redigere alt før publicering."
                },
                {
                  question: "Kan jeg teste gratis?",
                  answer: "Ja, du får 7 dages gratis adgang – uden kreditkort."
                }
              ].map((faq, index) => (
                <Card key={index} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-1 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </h3>
                      <div className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : 'rotate-0'}`}>
                        <ChevronDown className="w-6 h-6 text-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-1">
                      <p className="text-gray-600 leading-relaxed text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Klar til at skrive bedre LinkedIn-opslag?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start din gratis prøveperiode i dag, og oplev hvor nemt det er med Nolia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                className="px-8 h-12 bg-white text-blue-800 hover:bg-blue-50 rounded-full font-semibold transition-all duration-200 shadow-lg"
                onClick={handleFreeTrialClick}
                disabled={loading}
              >
                Prøv gratis i 7 dage
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
    </div>

      <Footer />
    </>
  )
}