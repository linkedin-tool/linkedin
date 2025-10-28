'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Header from '@/components/Header'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header Navigation */}
      <Header />
      
      {/* Page Header - Text directly on blue background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Kontakt os
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Vi er her for at hjælpe dig. Send os en besked, og vi vender tilbage til dig hurtigst muligt.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form - Takes 2 columns */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="p-8 md:p-10 bg-white rounded-3xl shadow-lg h-fit">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Send os en besked</h2>
                <p className="text-gray-600">
                  Udfyld formularen nedenfor, og vi vender tilbage til dig hurtigst muligt
                </p>
              </div>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Tak for din besked!</h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    Vi har modtaget din henvendelse og vender tilbage til dig inden for 24 timer.
                  </p>
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="px-8 h-11"
                  >
                    Send en ny besked
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 ml-4 mb-2">
                        Fulde navn *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-2xl shadow-none h-12 text-base md:text-base text-gray-900 placeholder:text-gray-400"
                        placeholder="Dit fulde navn"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-4 mb-2">
                        Email adresse *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-2xl shadow-none h-12 text-base md:text-base text-gray-900 placeholder:text-gray-400"
                        placeholder="din@email.dk"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 ml-4 mb-2">
                      Emne *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-2xl shadow-none h-12 text-base md:text-base text-gray-900 placeholder:text-gray-400"
                      placeholder="Hvad drejer din henvendelse sig om?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 ml-4 mb-2">
                      Besked *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border border-gray-300 focus:border-gray-300 focus:ring-0 focus:outline-none focus:shadow-none focus:ring-offset-0 rounded-2xl shadow-none px-4 py-3 resize-none text-base md:text-base text-gray-900 placeholder:text-gray-400"
                      placeholder="Beskriv dit spørgsmål eller problem i detaljer..."
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full md:w-auto px-8 h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sender besked...' : 'Send besked'}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Contact Information - Takes 1 column */}
          <div className="space-y-8 order-1 lg:order-2">
            <Card className="p-6 bg-white rounded-3xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Kontaktoplysninger</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Email</p>
                    <p className="text-blue-800 font-medium text-sm truncate">support@basicplatform.dk</p>
                    <p className="text-xs text-gray-600">Vi svarer inden for 24 timer</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Telefon</p>
                    <p className="text-blue-800 font-medium text-sm">+45 XX XX XX XX</p>
                    <p className="text-xs text-gray-600">Hverdage 9:00 - 17:00</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Adresse</p>
                    <div className="text-gray-700 text-sm">
                      <p className="font-medium">BasicPlatform ApS</p>
                      <p>[Gadenavn og nummer]</p>
                      <p>[Postnummer og by], Danmark</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Åbningstider</p>
                    <div className="text-gray-700 text-sm space-y-1">
                      <p><span className="font-medium">Man-Fre:</span> 9:00 - 17:00</p>
                      <p><span className="font-medium">Weekend:</span> Lukket</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* FAQ Section */}
            <Card className="p-6 bg-white rounded-3xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ofte stillede spørgsmål</h2>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">Hvor hurtigt får jeg svar?</h3>
                  <p className="text-gray-600 text-sm">
                    Vi stræber efter at svare på alle henvendelser inden for 24 timer på hverdage.
                  </p>
                </div>
                
                <div className="p-3 bg-gray-100 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">Kan jeg få teknisk support?</h3>
                  <p className="text-gray-600 text-sm">
                    Ja, vores supportteam hjælper gerne med tekniske spørgsmål og problemløsning.
                  </p>
                </div>
                
                <div className="p-3 bg-gray-100 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">Tilbyder I telefonsupport?</h3>
                  <p className="text-gray-600 text-sm">
                    Ja, du kan ringe til os på hverdage mellem 9:00 og 17:00.
                  </p>
                </div>
                
                <div className="p-3 bg-gray-100 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">Kan jeg få hjælp til opsætning?</h3>
                  <p className="text-gray-600 text-sm">
                    Absolut! Vi hjælper gerne med at komme i gang og optimere din opsætning.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-3xl p-8 md:p-12 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Har du ikke fundet det, du leder efter?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Måske kan vores FAQ hjælpe dig videre. 
              Eller prøv vores gratis prøveperiode og oplev BasicPlatform selv.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white text-blue-800 border-2 border-white hover:bg-blue-50 hover:text-blue-900 px-8 h-11 font-semibold"
                >
                  Start gratis prøveperiode
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button 
                  variant="ghost" 
                  className="w-full sm:w-auto text-white hover:bg-white hover:bg-opacity-20 border-2 border-white border-opacity-30 px-8 h-11 font-semibold"
                >
                  Se priser
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
