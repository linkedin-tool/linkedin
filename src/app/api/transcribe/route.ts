import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function cleanupTranscription(rawText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en professionel tekstredigerings-assistent. Din opgave er at rense og perfektionere transskriberet tekst fra tale-til-tekst.

VIGTIGE REGLER:
- Bevar den ORIGINALE tone og stil 100%
- Fjern kun fyldord som "øh", "ehm", "altså", "ligesom", "ikke også", "sådan"
- Fjern afbrydelser som "ej glem det", "vent", "scratch that", "øh nej"
- RET ALLE stavefejl og grammatiske fejl grundigt
- Sørg for korrekt dansk retskrivning og tegnsætning
- Tilføj passende kommaer, punktummer og linjeskift
- Bevar ALLE meningsfulde ord og sætninger
- Ændrer IKKE ordvalg eller omformulerer - kun korrektion
- Gør teksten perfekt læsbar og professionel
- ALDRIG brug gåseøjne eller anførselstegn omkring output
- Returner kun ren, korrekt dansk tekst

AFSNITSFORMATERING:
- Altid korte afsnit på maksimalt 1 sætning.

STAVEKORREKTION:
- Ret alle fejlstavede ord til korrekt dansk
- Sørg for korrekt bøjning af navneord og tillægsord
- Kontroller verbernes bøjning og tid
- Ret sammensatte ord der er skrevet forkert

Eksempel 1:
Input: "Øh, jeg er, altså, salgschef med, ehm, 10 års erfaring inden for bee-to-bee software. Ej vent, glem det. Jeg mener, jeg har arbejdet med, øh, virksomheder i mange år og hjælper dem med at optimere deres salgs processer. Og så tænkte jeg, at jeg kunne lave et opslag om, hvordan man kan øge sit salg ved at bruge AI tools. Det er nemlig noget jeg har meget erfaring med."
Output: Jeg er salgschef med 10 års erfaring inden for B2B software. Jeg har arbejdet med virksomheder i mange år og hjælper dem med at optimere deres salgsprocesser.

Jeg tænkte, at jeg kunne lave et opslag om, hvordan man kan øge sit salg ved at bruge AI tools. Det er nemlig noget jeg har meget erfaring med.

Eksempel 2 (personlig baggrund):
Input: "Jeg hedder Lars, jeg er 42 år gammel og bor i København. Jeg har arbejdet som marketingchef i 8 år. Jeg startede min karriere som grafisk designer, men skiftede til marketing fordi jeg elskede at arbejde med strategi og analyse."
Output: Jeg hedder Lars, jeg er 42 år gammel og bor i København. Jeg har arbejdet som marketingchef i 8 år.

Jeg startede min karriere som grafisk designer, men skiftede til marketing fordi jeg elskede at arbejde med strategi og analyse.`
        },
        {
          role: 'user',
          content: `Rens denne transskriberede tekst:\n\n"${rawText}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const cleanedContent = response.choices[0]?.message?.content || rawText
    
    // Fjern gåseøjne hvis AI'en har tilføjet dem
    return cleanedContent.replace(/^["']|["']$/g, '').trim()
  } catch (error) {
    console.error('Fejl ved tekstoprensning:', error)
    // Hvis cleanup fejler, returner original tekst
    return rawText
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Ingen lydfil blev uploadet' },
        { status: 400 }
      )
    }

    // Konverter File til Buffer for OpenAI API
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    
    // Opret en ny File-lignende objekt som OpenAI forventer
    const file = new File([buffer], audioFile.name, {
      type: audioFile.type,
    })

    // Kald OpenAI Whisper API for transskription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'da', // Dansk sprog
      response_format: 'text',
    })

    // Rens og formater teksten med GPT
    const cleanedText = await cleanupTranscription(transcription)

    return NextResponse.json({
      success: true,
      text: cleanedText,
    })
  } catch (error) {
    console.error('Fejl ved transskription:', error)
    return NextResponse.json(
      { error: 'Der opstod en fejl ved transskription af lydfilen' },
      { status: 500 }
    )
  }
}
