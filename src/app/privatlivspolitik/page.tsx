import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Header from '@/components/Header'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header Navigation */}
      <Header />
      
      {/* Page Header - Text directly on blue background */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privatlivspolitik</h1>
          <p className="text-gray-600">Sidst opdateret: {new Date().toLocaleDateString('da-DK')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <Card className="p-8 bg-white rounded-3xl shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Indledning</h2>
              <p className="text-gray-700 mb-4">
                BasicPlatform ApS (&quot;vi&quot;, &quot;os&quot;, &quot;vores&quot;) respekterer dit privatliv og er forpligtet til at beskytte 
                dine personoplysninger. Denne privatlivspolitik forklarer, hvordan vi indsamler, bruger og beskytter 
                dine oplysninger, når du bruger vores tjenester.
              </p>
              <p className="text-gray-700 mb-4">
                Denne politik gælder for alle brugere af BasicPlatform og er i overensstemmelse med 
                EU&apos;s Generelle Databeskyttelsesforordning (GDPR) og dansk databeskyttelseslovgivning.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dataansvarlig</h2>
              <div className="bg-blue-50 rounded-2xl p-6 mb-4">
                <p className="text-gray-700"><strong>BasicPlatform ApS</strong></p>
                <p className="text-gray-700">CVR-nr: [CVR-nummer]</p>
                <p className="text-gray-700">Adresse: [Adresse], Danmark</p>
                <p className="text-gray-700">Email: privacy@basicplatform.dk</p>
                <p className="text-gray-700">Telefon: +45 XX XX XX XX</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hvilke oplysninger indsamler vi?</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Oplysninger du giver os</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Kontooplysninger:</strong> Navn, email, telefonnummer, virksomhedsoplysninger</li>
                <li><strong>Betalingsoplysninger:</strong> Faktureringsadresse, betalingsmetode (behandles af Stripe)</li>
                <li><strong>Profiloplysninger:</strong> Præferencer, indstillinger, profilbillede</li>
                <li><strong>Kommunikation:</strong> Beskeder, support-henvendelser, feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Oplysninger vi indsamler automatisk</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Brugsdata:</strong> Hvordan du bruger vores tjenester, funktioner du tilgår</li>
                <li><strong>Tekniske data:</strong> IP-adresse, browsertype, enhedsoplysninger, operativsystem</li>
                <li><strong>Cookies og lignende teknologier:</strong> Se vores cookiepolitik for detaljer</li>
                <li><strong>Log-data:</strong> Tidsstempler, fejlrapporter, ydeevnedata</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Hvordan bruger vi dine oplysninger?</h2>
              <p className="text-gray-700 mb-4">Vi bruger dine personoplysninger til følgende formål:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Tjenesteudbydelse</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Levere og vedligeholde vores tjenester</li>
                <li>Behandle betalinger og administrere abonnementer</li>
                <li>Yde kundesupport og teknisk assistance</li>
                <li>Sende vigtige meddelelser om din konto eller tjenesten</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Forbedring og udvikling</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Analysere brugsmønstre for at forbedre vores tjenester</li>
                <li>Udvikle nye funktioner og produkter</li>
                <li>Foretage fejlfinding og optimering</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Kommunikation og marketing</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Sende produktopdateringer og nyhedsbreve (med dit samtykke)</li>
                <li>Informere om nye funktioner eller tjenester</li>
                <li>Gennemføre kundetilfredshedsundersøgelser</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retsgrundlag for behandling</h2>
              <p className="text-gray-700 mb-4">Vi behandler dine personoplysninger baseret på følgende retsgrundlag:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Kontraktopfyldelse:</strong> For at levere vores tjenester og opfylde vores aftale med dig</li>
                <li><strong>Berettiget interesse:</strong> For at forbedre vores tjenester og sikkerhed</li>
                <li><strong>Samtykke:</strong> For marketing og ikke-essentielle cookies</li>
                <li><strong>Lovpligt:</strong> For at overholde juridiske forpligtelser</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Deling af oplysninger</h2>
              <p className="text-gray-700 mb-4">Vi deler ikke dine personoplysninger med tredjeparter, undtagen:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Tjenesteudbydere</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Stripe:</strong> Betalingsprocessering (underlagt Stripes privatlivspolitik)</li>
                <li><strong>Supabase:</strong> Database og hosting (underlagt Supabases privatlivspolitik)</li>
                <li><strong>Email-tjenester:</strong> For at sende transaktionelle emails</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Juridiske krav</h3>
              <p className="text-gray-700 mb-4">
                Vi kan dele oplysninger, hvis det kræves af loven, for at beskytte vores rettigheder, 
                eller i forbindelse med juridiske procedurer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Datasikkerhed</h2>
              <p className="text-gray-700 mb-4">
                Vi implementerer passende tekniske og organisatoriske sikkerhedsforanstaltninger for at beskytte 
                dine personoplysninger mod uautoriseret adgang, ændring, videregivelse eller ødelæggelse.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Kryptering af data under transport og i hvile</li>
                <li>Regelmæssige sikkerhedsopdateringer og patches</li>
                <li>Adgangskontrol og autentificering</li>
                <li>Regelmæssige sikkerhedsaudits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Opbevaring af data</h2>
              <p className="text-gray-700 mb-4">
                Vi opbevarer dine personoplysninger kun så længe, det er nødvendigt for de formål, 
                de blev indsamlet til, eller som krævet af loven.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Kontodata:</strong> Så længe din konto er aktiv + 3 år efter lukning</li>
                <li><strong>Betalingsdata:</strong> 5 år efter sidste transaktion (bogføringskrav)</li>
                <li><strong>Log-data:</strong> Maksimalt 12 måneder</li>
                <li><strong>Marketing-samtykke:</strong> Indtil du trækker samtykket tilbage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Dine rettigheder</h2>
              <p className="text-gray-700 mb-4">Under GDPR har du følgende rettigheder:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Ret til indsigt:</strong> Du kan anmode om en kopi af dine personoplysninger</li>
                <li><strong>Ret til berigtigelse:</strong> Du kan få rettet forkerte eller ufuldstændige oplysninger</li>
                <li><strong>Ret til sletning:</strong> Du kan anmode om sletning af dine personoplysninger</li>
                <li><strong>Ret til begrænsning:</strong> Du kan begrænse behandlingen af dine oplysninger</li>
                <li><strong>Ret til dataportabilitet:</strong> Du kan få dine data i et struktureret format</li>
                <li><strong>Ret til indsigelse:</strong> Du kan gøre indsigelse mod behandlingen</li>
                <li><strong>Ret til at trække samtykke tilbage:</strong> Hvor behandlingen er baseret på samtykke</li>
              </ul>
              <p className="text-gray-700 mb-4">
                For at udøve dine rettigheder, kontakt os på privacy@basicplatform.dk. 
                Vi vil svare inden for 30 dage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Internationale overførsler</h2>
              <p className="text-gray-700 mb-4">
                Dine personoplysninger kan blive overført til og behandlet i lande uden for EU/EØS. 
                Vi sikrer, at sådanne overførsler sker i overensstemmelse med GDPR gennem 
                passende sikkerhedsforanstaltninger som EU&apos;s standardkontraktbestemmelser.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ændringer af denne politik</h2>
              <p className="text-gray-700 mb-4">
                Vi kan opdatere denne privatlivspolitik fra tid til anden. Væsentlige ændringer 
                vil blive kommunikeret via email eller gennem vores platform. Den opdaterede 
                politik træder i kraft, når den offentliggøres på vores hjemmeside.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Kontakt os</h2>
              <p className="text-gray-700 mb-4">
                Hvis du har spørgsmål til denne privatlivspolitik eller ønsker at udøve dine rettigheder, 
                kan du kontakte os:
              </p>
              <div className="bg-blue-50 rounded-2xl p-6">
                <p className="text-gray-700"><strong>BasicPlatform ApS</strong></p>
                <p className="text-gray-700">Email: privacy@basicplatform.dk</p>
                <p className="text-gray-700">Telefon: +45 XX XX XX XX</p>
                <p className="text-gray-700">Adresse: [Adresse], Danmark</p>
              </div>
              <p className="text-gray-700 mt-4">
                Du har også ret til at indgive en klage til Datatilsynet, hvis du mener, 
                at vi ikke overholder databeskyttelsesreglerne.
              </p>
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
