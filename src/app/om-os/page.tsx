import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header Navigation */}
      <Header />
      
      {/* Page Header - Text directly on blue background */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Om BasicPlatform
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Vi bygger simple og kraftfulde løsninger, der hjælper virksomheder med at administrere deres abonnementer og betalinger effektivt.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="space-y-12">
          {/* Mission Section */}
          <Card className="p-8 bg-white rounded-3xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Vores Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Hos BasicPlatform tror vi på, at teknologi skal være tilgængelig og brugervenlig for alle. 
              Vores mission er at levere enkle, men kraftfulde SaaS-løsninger, der hjælper virksomheder 
              med at fokusere på det, de gør bedst - deres kerneforretnng.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Vi specialiserer os i at skabe intuitive platforme til abonnementshåndtering, betalingsprocessering 
              og kundeadministration, så du kan bruge mindre tid på administration og mere tid på vækst.
            </p>
          </Card>

          {/* Values Section */}
          <Card className="p-8 bg-white rounded-3xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Vores Værdier</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Enkelhed</h3>
                <p className="text-gray-700">
                  Vi tror på, at de bedste løsninger er de simpleste. Vores produkter er designet 
                  til at være intuitive og nemme at bruge fra dag ét.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Pålidelighed</h3>
                <p className="text-gray-700">
                  Dine data og betalinger er sikre hos os. Vi bruger industriens bedste 
                  sikkerhedsstandarder og har 99.9% oppetid.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Transparens</h3>
                <p className="text-gray-700">
                  Ingen skjulte gebyrer eller overraskelser. Vi er åbne om vores priser, 
                  funktioner og begrænsninger.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Support</h3>
                <p className="text-gray-700">
                  Vores danske supportteam er klar til at hjælpe dig, når du har brug for det. 
                  Hurtig respons og personlig service.
                </p>
              </div>
            </div>
          </Card>

          {/* Team Section */}
          <Card className="p-8 bg-white rounded-3xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Vores Team</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              BasicPlatform er grundlagt af et team af erfarne udviklere og forretningsfolk, 
              der har arbejdet med SaaS-produkter i over 10 år. Vi forstår udfordringerne ved 
              at drive en digital forretning, fordi vi selv har været der.
            </p>
            <div className="bg-blue-50 rounded-2xl p-6">
              <p className="text-gray-700 italic">
                &quot;Vi startede BasicPlatform, fordi vi så et behov for enkle, pålidelige løsninger 
                til abonnementshåndtering på det danske marked. Vores fokus er altid på brugeren 
                og deres behov.&quot;
              </p>
              <p className="text-blue-800 font-semibold mt-4">- BasicPlatform Team</p>
            </div>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Klar til at komme i gang?
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Prøv BasicPlatform gratis i 7 dage og oplev, hvor nemt det kan være 
              at administrere dine abonnementer og betalinger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button className="w-full sm:w-auto px-8 h-11">
                  Start gratis prøveperiode
                </Button>
              </Link>
              <Link href="/kontakt">
                <Button variant="outline" className="w-full sm:w-auto px-8 h-11">
                  Kontakt os
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
