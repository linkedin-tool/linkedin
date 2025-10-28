import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header Navigation */}
      <Header />
      
      {/* Page Header - Text directly on blue background */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Cookiepolitik</h1>
          <p className="text-gray-600">Sidst opdateret: {new Date().toLocaleDateString('da-DK')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <Card className="p-8 bg-white rounded-3xl shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Hvad er cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies er små tekstfiler, som gemmes på din computer, tablet eller smartphone, 
                når du besøger vores hjemmeside. De hjælper os med at genkende dig og huske dine præferencer, 
                så vi kan give dig en bedre brugeroplevelse.
              </p>
              <p className="text-gray-700 mb-4">
                Cookies indeholder ikke personlige oplysninger som dit navn eller adresse, 
                men de kan linke tilbage til andre oplysninger, vi har om dig.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Hvorfor bruger vi cookies?</h2>
              <p className="text-gray-700 mb-4">Vi bruger cookies til følgende formål:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Funktionalitet:</strong> At huske dine indstillinger og præferencer</li>
                <li><strong>Sikkerhed:</strong> At beskytte din konto og forhindre svindel</li>
                <li><strong>Ydeevne:</strong> At analysere, hvordan vores hjemmeside bruges</li>
                <li><strong>Brugeroplevelse:</strong> At tilpasse indhold og funktioner til dig</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Typer af cookies vi bruger</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Strengt nødvendige cookies</h3>
              <p className="text-gray-700 mb-4">
                Disse cookies er essentielle for, at hjemmesiden kan fungere korrekt. 
                De kan ikke slås fra i vores systemer.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Cookie navn</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Formål</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Varighed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">session_token</td>
                      <td className="py-3 px-2 text-gray-700">Holder dig logget ind</td>
                      <td className="py-3 px-2 text-gray-700">Session</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">csrf_token</td>
                      <td className="py-3 px-2 text-gray-700">Sikkerhed mod CSRF-angreb</td>
                      <td className="py-3 px-2 text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">cookie_consent</td>
                      <td className="py-3 px-2 text-gray-700">Husker dine cookie-præferencer</td>
                      <td className="py-3 px-2 text-gray-700">1 år</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Funktionelle cookies</h3>
              <p className="text-gray-700 mb-4">
                Disse cookies gør det muligt for hjemmesiden at huske valg, du træffer, 
                og give forbedrede, mere personlige funktioner.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Cookie navn</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Formål</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Varighed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">user_preferences</td>
                      <td className="py-3 px-2 text-gray-700">Gemmer dine indstillinger</td>
                      <td className="py-3 px-2 text-gray-700">6 måneder</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">language_preference</td>
                      <td className="py-3 px-2 text-gray-700">Husker dit sprogvalg</td>
                      <td className="py-3 px-2 text-gray-700">1 år</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Analytiske cookies</h3>
              <p className="text-gray-700 mb-4">
                Disse cookies hjælper os med at forstå, hvordan besøgende interagerer med hjemmesiden, 
                ved at indsamle og rapportere information anonymt.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Cookie navn</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Formål</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Varighed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">_analytics_session</td>
                      <td className="py-3 px-2 text-gray-700">Sporer brugeradfærd anonymt</td>
                      <td className="py-3 px-2 text-gray-700">30 minutter</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">_page_views</td>
                      <td className="py-3 px-2 text-gray-700">Tæller sidevisninger</td>
                      <td className="py-3 px-2 text-gray-700">2 år</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Marketing cookies</h3>
              <p className="text-gray-700 mb-4">
                Disse cookies bruges til at vise relevante annoncer og måle effektiviteten af vores marketingkampagner. 
                De kræver dit samtykke.
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 mb-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Cookie navn</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Formål</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Varighed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-2 font-mono text-blue-800 bg-blue-50 rounded">marketing_tracking</td>
                      <td className="py-3 px-2 text-gray-700">Sporer marketingeffektivitet</td>
                      <td className="py-3 px-2 text-gray-700">90 dage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Tredjepartscookies</h2>
              <p className="text-gray-700 mb-4">
                Vi bruger også tjenester fra tredjeparter, som kan sætte deres egne cookies:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Stripe (Betalingsprocessering)</h3>
              <p className="text-gray-700 mb-4">
                Stripe sætter cookies for at håndtere betalinger sikkert og forhindre svindel. 
                Læs mere i <a href="https://stripe.com/privacy" className="text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">Stripes privatlivspolitik</a>.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Supabase (Database og hosting)</h3>
              <p className="text-gray-700 mb-4">
                Supabase kan sætte cookies til autentificering og session-håndtering. 
                Læs mere i <a href="https://supabase.com/privacy" className="text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">Supabases privatlivspolitik</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sådan administrerer du cookies</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Cookie-indstillinger på vores hjemmeside</h3>
              <p className="text-gray-700 mb-4">
                Du kan til enhver tid ændre dine cookie-præferencer ved at klikke på &quot;Cookie-indstillinger&quot; 
                i bunden af vores hjemmeside. Her kan du vælge, hvilke typer cookies du vil acceptere.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Browser-indstillinger</h3>
              <p className="text-gray-700 mb-4">
                Du kan også kontrollere cookies gennem din browsers indstillinger:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Chrome:</strong> Indstillinger → Avanceret → Privatliv og sikkerhed → Cookies</li>
                <li><strong>Firefox:</strong> Indstillinger → Privatliv og sikkerhed → Cookies og webstedsdata</li>
                <li><strong>Safari:</strong> Præferencer → Privatliv → Cookies og webstedsdata</li>
                <li><strong>Edge:</strong> Indstillinger → Cookies og webstedsrettigheder</li>
              </ul>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Bemærk:</strong> Hvis du deaktiverer alle cookies, kan nogle funktioner på vores hjemmeside 
                  ikke fungere korrekt, og du kan opleve en forringet brugeroplevelse.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Opdateringer af denne politik</h2>
              <p className="text-gray-700 mb-4">
                Vi kan opdatere denne cookiepolitik fra tid til anden for at afspejle ændringer 
                i vores brug af cookies eller af juridiske årsager. Vi opfordrer dig til at 
                gennemgå denne side regelmæssigt for at holde dig informeret om vores brug af cookies.
              </p>
              <p className="text-gray-700 mb-4">
                Væsentlige ændringer vil blive kommunikeret gennem vores hjemmeside eller via email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kontakt os</h2>
              <p className="text-gray-700 mb-4">
                Hvis du har spørgsmål om vores brug af cookies, kan du kontakte os:
              </p>
              <div className="bg-blue-50 rounded-2xl p-6">
                <p className="text-gray-700"><strong>BasicPlatform ApS</strong></p>
                <p className="text-gray-700">Email: privacy@basicplatform.dk</p>
                <p className="text-gray-700">Telefon: +45 XX XX XX XX</p>
                <p className="text-gray-700">Adresse: [Adresse], Danmark</p>
              </div>
            </section>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-800 hover:text-blue-600 font-medium">
            ← Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  )
}
