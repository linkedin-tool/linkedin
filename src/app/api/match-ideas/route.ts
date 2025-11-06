import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IdeaMatch {
  id: string;
  title: string | null;
  ai_title: string | null;
  resume: string | null;
  score: number;
}


export async function POST(request: NextRequest) {
  let transcribedText = '';
  let existingIdeas: any[] = [];
  
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    transcribedText = requestBody.transcribedText;
    
    if (!transcribedText) {
      return NextResponse.json({ error: 'Missing transcribed text' }, { status: 400 });
    }

    // Get the 50 most recent ideas for this user
    const { data: fetchedIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('id, title, ai_title, resume')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ideasError) {
      console.error('Error fetching existing ideas:', ideasError);
      throw ideasError;
    }

    existingIdeas = fetchedIdeas || [];

    // If no existing ideas, just clean the text and return no matches
    if (!existingIdeas || existingIdeas.length === 0) {
      const cleanedText = await cleanupTranscription(transcribedText);
      return NextResponse.json({
        success: true,
        cleanedText,
        matches: [],
        allIdeas: []
      });
    }

    // Prepare ideas list for AI matching
    const ideasForMatching = existingIdeas.map(idea => ({
      id: idea.id,
      title: idea.ai_title || idea.title || 'Ingen titel',
      resume: idea.resume || 'Intet resumé'
    }));

  // Call AI functions in parallel for better performance
  console.log('🔍 Matching input:', {
    transcribedText: transcribedText.substring(0, 100) + '...',
    existingIdeasCount: ideasForMatching.length,
    existingIdeas: ideasForMatching.map(idea => ({ id: idea.id, title: idea.title, resume: idea.resume }))
  });
  
  const [matchResult, cleanedText] = await Promise.all([
    findMatches(transcribedText, ideasForMatching),
    cleanupTranscription(transcribedText)
  ]);

    return NextResponse.json({
      success: true,
      cleanedText: cleanedText, // Use cleaned text from separate call
      matches: matchResult.matches,
      allIdeas: matchResult.allIdeas
    });

  } catch (error) {
    console.error('Error in match-ideas:', error);
    
    // Fallback: just clean the text if everything fails
    try {
      const fallbackCleanedText = await cleanupTranscription(transcribedText);
      return NextResponse.json({
        success: true,
        cleanedText: fallbackCleanedText,
        matches: [],
        allIdeas: existingIdeas?.map(idea => ({
          id: idea.id,
          title: idea.ai_title || idea.title,
          ai_title: idea.ai_title || idea.title,
          resume: idea.resume
        })) || []
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}

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

VIGTIGT - FJERN KOMMANDOER:
- Fjern kommandoer i STARTEN af teksten hvor brugeren beder om at tilføje til en anden idé
- Eksempler: "tilføj til min vægtrejse", "læg det her til Barcelona-noten", "skriv det under min tidligere idé"
- Fjern KUN selve kommandoen - bevar resten af teksten fuldt ud
- Hvis "tilføj/læg til/føj til" bruges midt i teksten om noget andet, må det IKKE fjernes

AFSNITSFORMATERING:
- Altid korte afsnit på maksimalt 1 sætning.`
        },
        {
          role: 'user',
          content: `Rens denne transskriberede tekst:\n\n"${rawText}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const cleanedContent = response.choices[0]?.message?.content || rawText;
    return cleanedContent.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('Fejl ved tekstoprensning:', error);
    return rawText;
  }
}

async function findMatches(transcribedText: string, existingIdeas: Array<{id: string, title: string, resume: string}>): Promise<{matches: IdeaMatch[], allIdeas: Array<{id: string, title: string | null, ai_title: string | null, resume: string | null}>}> {
  try {
    // Focused matching call using original unprocessed text
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en intelligent matching-assistent der finder semantiske matches mellem tekst og eksisterende idéer.

OPGAVE - INTELLIGENT MATCHING:
- Sammenlign den ORIGINALE urensede tekst med eksisterende idéer (titel + resumé)
- Brug HELE teksten inkl. kommandoer som "tilføj til min vægtrejse" til matching
- Find idéer der matcher semantisk (samme emne, lignende indhold, relaterede koncepter)
- Giv hver match en score mellem 0.0 og 1.0 (hvor 1.0 = perfekt match)
- Returner kun matches med score >= 0.5
- Kommandoer som "tilføj til [emne]" giver STÆRK indikation af match med det emne

SCORING GUIDE:
- 0.9-1.0: Næsten identisk emne/indhold eller eksplicit kommando ("tilføj til X")
- 0.8-0.9: Meget lignende emne med overlap
- 0.7-0.8: Relateret emne med fælles elementer  
- 0.6-0.7: Samme kategori/branche men forskellige vinkler
- 0.5-0.6: Svag relation, men stadig relevant

RETURNER ALTID JSON FORMAT:
{
  "matches": [
    {
      "id": "idea-id-1",
      "score": 0.95,
      "reason": "Eksplicit kommando 'tilføj til vægtrejse' matcher vægtrejse-idé perfekt"
    },
    {
      "id": "idea-id-2", 
      "score": 0.75,
      "reason": "Semantisk match med relateret emne"
    }
  ]
}

Hvis ingen matches har score >= 0.5, returner tom matches array.`
        },
        {
          role: 'user',
          content: `FIND MATCHES FOR DENNE TEKST:

RAW TEKST (urensede):
"${transcribedText}"

EKSISTERENDE IDÉER (til matching):
${existingIdeas.map((idea, index) => `${index + 1}. ID: ${idea.id}
Titel: ${idea.title}
Resumé: ${idea.resume}`).join('\n\n')}

EKSEMPLER PÅ STÆRKE MATCHES:
- "Tilføj til min vægtrejse, jeg vil lave daglige opslag om mad" 
  → Høj score (95%+) hvis vægtrejse-idé findes (eksplicit kommando)

- "Læg det her til Barcelona-noten, hotellet var fantastisk"
  → Høj score (95%+) hvis Barcelona-idé findes (eksplicit kommando)

- "Jeg vil skrive om min træning i dag"
  → Moderat score (70-80%) hvis trænings-idé findes (semantisk match)

VIGTIGT: Brug den ORIGINALE urensede tekst til matching. Kommandoer som "tilføj til [emne]" skal give meget høje scores (90%+).

Find ALLE matches med score >= 0.5 og returner som JSON. Returner IKKE kun den bedste match - returner ALLE relevante matches!`
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    const aiResponse = response.choices[0]?.message?.content || '{"matches": []}';
    
    console.log('🤖 AI Matching Response:', aiResponse);
    
    try {
      const matchData = JSON.parse(aiResponse);
      const matches: IdeaMatch[] = [];

      if (matchData.matches && Array.isArray(matchData.matches)) {
        for (const match of matchData.matches) {
          if (match.score >= 0.5) {
            const existingIdea = existingIdeas.find(idea => idea.id === match.id);
            if (existingIdea) {
              matches.push({
                id: match.id,
                title: existingIdea.title,
                ai_title: existingIdea.title,
                resume: existingIdea.resume,
                score: match.score
              });
            }
          }
        }
      }

      // Sort by score (highest first)
      matches.sort((a, b) => b.score - a.score);

      return {
        matches: matches.slice(0, 3), // Max 3 matches
        allIdeas: existingIdeas.map(idea => ({
          id: idea.id,
          title: idea.title,
          ai_title: idea.title,
          resume: idea.resume
        }))
      };

    } catch (parseError) {
      console.error('Error parsing AI matching response:', parseError);
      console.log('AI Response was:', aiResponse);
      
      return {
        matches: [],
        allIdeas: existingIdeas.map(idea => ({
          id: idea.id,
          title: idea.title,
          ai_title: idea.title,
          resume: idea.resume
        }))
      };
    }

  } catch (error) {
    console.error('Error finding matches:', error);
    
    return {
      matches: [],
      allIdeas: existingIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        ai_title: idea.title,
        resume: idea.resume
      }))
    };
  }
}
