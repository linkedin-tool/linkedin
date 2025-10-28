import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header Navigation */}
      <Header />
      
      {/* Page Header - Text directly on blue background */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Handelsbetingelser</h1>
          <p className="text-gray-600">Sidst opdateret: {new Date().toLocaleDateString('da-DK')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <Card className="p-8 bg-white rounded-3xl shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Generelle bestemmelser</h2>
              <p className="text-gray-700 mb-4">
                Disse handelsbetingelser gælder for alle aftaler mellem BasicPlatform ApS (&quot;BasicPlatform&quot;, &quot;vi&quot;, &quot;os&quot;) 
                og kunden (&quot;du&quot;, &quot;bruger&quot;) vedrørende brug af BasicPlatform&apos;s tjenester.
              </p>
              <p className="text-gray-700 mb-4">
                Ved at oprette en konto og bruge vores tjenester accepterer du disse handelsbetingelser fuldt ud. 
                Hvis du ikke accepterer betingelserne, må du ikke bruge vores tjenester.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tjenestebeskrivelse</h2>
              <p className="text-gray-700 mb-4">
                BasicPlatform leverer SaaS-løsninger til abonnementshåndtering, betalingsprocessering og kundeadministration. 
                Vores tjenester omfatter:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Abonnementshåndtering og fakturering</li>
                <li>Betalingsprocessering via Stripe</li>
                <li>Kundeadministration og dashboard</li>
                <li>Rapportering og analytics</li>
                <li>API-adgang og integrationer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Kontooprettelse og adgang</h2>
              <p className="text-gray-700 mb-4">
                For at bruge vores tjenester skal du oprette en konto med korrekte og opdaterede oplysninger. 
                Du er ansvarlig for at holde dine loginoplysninger sikre og for alle aktiviteter på din konto.
              </p>
              <p className="text-gray-700 mb-4">
                Vi forbeholder os retten til at suspendere eller lukke konti, der overtræder disse betingelser 
                eller bruges til ulovlige aktiviteter.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Priser og betaling</h2>
              <p className="text-gray-700 mb-4">
                Vores priser fremgår af vores hjemmeside og kan ændres med 30 dages varsel. 
                Alle priser er angivet ekskl. moms, medmindre andet er angivet.
              </p>
              <p className="text-gray-700 mb-4">
                Betaling sker månedligt eller årligt forud via kreditkort eller andre accepterede betalingsmetoder. 
                Ved manglende betaling kan vi suspendere adgangen til tjenesten.
              </p>
              <p className="text-gray-700 mb-4">
                Vi tilbyder en 14-dages gratis prøveperiode for nye kunder. Efter prøveperioden 
                påbegyndes automatisk fakturering, medmindre abonnementet opsiges.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Opsigelse og refusion</h2>
              <p className="text-gray-700 mb-4">
                Du kan til enhver tid opsige dit abonnement med øjeblikkelig virkning via dit dashboard. 
                Opsigelse træder i kraft ved udgangen af den aktuelle faktureringsperiode.
              </p>
              <p className="text-gray-700 mb-4">
                Vi tilbyder ikke refusion for allerede betalte perioder, medmindre andet er lovpligtigt. 
                Ved opsigelse bevares adgang til tjenesten indtil udløbet af den betalte periode.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Databeskyttelse og sikkerhed</h2>
              <p className="text-gray-700 mb-4">
                Vi behandler dine personoplysninger i overensstemmelse med gældende databeskyttelseslovgivning 
                og vores privatlivspolitik. Vi implementerer passende tekniske og organisatoriske sikkerhedsforanstaltninger 
                for at beskytte dine data.
              </p>
              <p className="text-gray-700 mb-4">
                Du bevarer ejerskabet til dine data og kan til enhver tid eksportere eller slette dem 
                i overensstemmelse med vores privatlivspolitik.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Ansvarsbegrænsning</h2>
              <p className="text-gray-700 mb-4">
                BasicPlatform leveres &quot;som den er&quot; uden garantier af nogen art. Vi garanterer ikke, 
                at tjenesten vil være fejlfri eller altid tilgængelig.
              </p>
              <p className="text-gray-700 mb-4">
                Vores samlede ansvar over for dig kan ikke overstige det beløb, du har betalt os 
                i de seneste 12 måneder. Vi er ikke ansvarlige for indirekte skader eller tab af indtægter.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ændringer af betingelser</h2>
              <p className="text-gray-700 mb-4">
                Vi kan ændre disse handelsbetingelser med 30 dages varsel. Væsentlige ændringer 
                vil blive kommunikeret via email eller gennem vores platform.
              </p>
              <p className="text-gray-700 mb-4">
                Fortsat brug af tjenesten efter ændringerne træder i kraft udgør accept af de nye betingelser.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Lovvalg og værneting</h2>
              <p className="text-gray-700 mb-4">
                Disse handelsbetingelser er underlagt dansk ret. Eventuelle tvister skal afgøres 
                ved de danske domstole med København som værneting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Kontaktoplysninger</h2>
              <p className="text-gray-700 mb-4">
                Hvis du har spørgsmål til disse handelsbetingelser, kan du kontakte os:
              </p>
              <div className="bg-blue-50 rounded-2xl p-6">
                <p className="text-gray-700"><strong>BasicPlatform ApS</strong></p>
                <p className="text-gray-700">Email: support@basicplatform.dk</p>
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
