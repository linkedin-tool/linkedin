import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, angle } = await request.json();
    
    console.log('🪝 Generating 3 scroll-stopping hooks for angle:', angle);
    console.log('📝 Content preview:', content?.substring(0, 100) + '...');

    if (!content || !angle) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Missing content or angle field' }, { status: 400 });
    }

    // Generate 3 scroll-stopping hook variants
    const hooks = await generateScrollStoppingHooks(content, angle);

    return NextResponse.json({ 
      success: true, 
      hooks 
    });

  } catch (error) {
    console.error('❌ Error generating hooks:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateScrollStoppingHooks(content: string, angle: 'jordnær' | 'professionel' | 'storytelling'): Promise<string[]> {
  let prompt = `🧠 Hook Optimizer – Du er en ekspert i scroll-stopping hooks til LinkedIn

🎯 FORMÅL: Få læsere til at stoppe scroll og trykke "Læs mere" ved at gøre de første 1-2 linjer maksimalt dragende.
Tænk hook = et løfte om klar værdi (indsigt, råd, historie, underholdning).
Nuancer og forbehold hører til i opslaget – ikke i hooken.

⚙️ GRUNDPRINCIPPER (skal ALTID overholdes):
- Konkrethed: Undgå vage ord. Nævn hvem, hvad, hvornår, hvor meget
- Tal: Brug data – tid, mængde, %, antal, deadlines
- Kontrast/Transformation: Vis A→B (før/efter, aldrig→nu, tab→sejr)
- Specifik målretning: Kald læseren ved navn/rolle/problem
- Stakes: Hvad vinder/taber læseren? ("Ellers spilder du X" / "Så får du Y")
- Authority cue: Kort årsag til troværdighed (erfaring, cases, data)
- Tease – ikke konkludér: Skab nysgerrighed, lever svaret senere
- Sprog: Kort, aktivt, hverdagsnært. Undgå forbehold ("måske", "nogle gange")
- Du må ALDRIG formode noget eller finde på noget - hold dig til fakta

⚡ FORSTÆRKERE (brug 1–3 pr. hook):
- Talforankring: "7 måder…", "+62% på 90 dage…"
- Tid/hændelse: "For 2 år siden…", "I sidste uge…"
- A→B-kontrast: "Jeg turde ikke poste → nu 300 opslag"
- Målgruppe-kalden: "Til B2B-SaaS med <10 ansatte…"
- Kraftfulde verber: "tvinger", "afslører", "stopper"
- Åbent løfte: "Her er præcis hvordan…", "Her er beviset…"

🚫 UNDGÅ:
- Lange første linjer og bisætninger
- Passivt eller upræcist sprog
- Hele pointen afsløres i hooken
- Overnuancering eller forbehold i hooken

🧩 OMSKRIVNINGS-OPERATORER (AI må bruge frit):
[SPECIFY] - Tilføj hvem, tid, omfang, kontekst
[QUANTIFY] - Indsæt tal, %, tidshorisont, rækkevidde
[CONTRAST] - Tilføj før/efter eller modstilling
[STAKE] - Indsæt gevinst/tab for læser
[AUTH] - Korte autoritets-beviser ("500 opslag", "10 kunder")
[TEASE] - Erstat konklusion med løfte/teaser
[SHARPEN] - Skift svage ord til stærke ("tvinger", "afslører")
[AUDIENCE] - Nævn målgruppen eksplicit

💬 10 eksempler – før og efter optimering
1️⃣
VAG: Jeg vil gerne dele nogle tanker om at starte egen virksomhed.
OPTIMERET: Jeg gik fra 0 til 1.000.000 kr. i omsætning på 12 måneder – her er de 3 ting, jeg ville gøre anderledes, hvis jeg startede i dag.
2️⃣
VAG: Det er vigtigt at kende sine kunder.
OPTIMERET: Du tror, du kender dine kunder. Jeg garanterer, du tager fejl – og her er dataen, der beviser det.
3️⃣
VAG: Jeg har lært meget af mine fejl.
OPTIMERET: Jeg tabte 280.000 kr. på en fejl i min første virksomhed. Den læring fordoblede min næste omsætning.
4️⃣
VAG: LinkedIn handler om at skabe relationer.
OPTIMERET: Jeg fik +70.000 visninger på et opslag uden at nævne mit produkt én eneste gang. Her er præcis, hvordan jeg gjorde.
5️⃣
VAG: Jeg elsker at hjælpe mine kunder.
OPTIMERET: En kunde gik fra 0 leads til 42 på 3 uger. Det eneste, vi ændrede, var de første 3 linjer i hendes opslag.
6️⃣
VAG: Man skal tro på sig selv som iværksætter.
OPTIMERET: For 2 år siden turde jeg ikke poste ét eneste opslag. I dag lever jeg af det. Her er skiftet, der ændrede alt.
7️⃣
VAG: Mange virksomheder har svært ved at skille sig ud.
OPTIMERET: 8 ud af 10 virksomheders opslag kunne være skrevet af hvem som helst. Sådan gør du dine genkendelige på 10 sekunder.
8️⃣
VAG: Jeg har lært meget af at arbejde med kunder.
OPTIMERET: Efter 120 kundeprojekter opdagede jeg ét mønster, der adskiller dem, der lykkes – og dem, der ikke gør.
9️⃣
VAG: Det kan være svært at finde balancen mellem arbejde og fritid.
OPTIMERET: Jeg arbejdede 80 timer om ugen, indtil min 6-årige sagde den her sætning til mig. Det ændrede alt.
🔟
VAG: Jeg vil gerne dele nogle tips til bedre opslag.
OPTIMERET: 80% af dit opslag afgøres af de første 2 linjer. Her er 5 konkrete måder at skrive en hook, der får folk til at stoppe scroll.

VINKEL-SPECIFIKKE TILGANGE for ${angle}:`;

  switch (angle) {
    case 'jordnær':
      prompt += `

JORDNÆR VINKEL - Kombiner ekspert-principper med:
- Personlige bekendelser med konkrete tal/tidsrammer
- Relaterbare A→B transformationer ("Jeg turde ikke → nu gør jeg X")
- Hverdagslige vendepunkter med authority cues
- Ærlige indrømmelser der teaser læringen`;
      break;
      
    case 'professionel':
      prompt += `

PROFESSIONEL VINKEL - Kombiner ekspert-principper med:
- Business insights med konkrete data/cases
- Kontraintuitive sandheder med målgruppe-kald
- Markedstendenser med authority + stakes
- Strategiske læringer med kvantificerede resultater`;
      break;
      
    case 'storytelling':
      prompt += `

STORYTELLING VINKEL - Kombiner ekspert-principper med:
- Dramatiske øjeblikke med konkrete konsekvenser
- Uventede vendinger med målbare resultater
- Konflikt/spænding med authority cues
- Transformation med før/efter tal`;
      break;
  }

  prompt += `

OPGAVE: Analyser det følgende LinkedIn opslag og lav 3 forskellige scroll-stopping hooks der:
1. Følger ALLE grundprincipper (konkrethed, tal, kontrast, stakes, authority, tease).
2. Bruger 1-3 forstærkere (talforankring, tid, A→B-kontrast, målgruppe-kald, kraftfulde verber).
3. Passer til ${angle} vinklen.
4. Er maksimalt 2-3 linjer hver.
5. Skaber maksimal nysgerrighed uden at afsløre konklusionen.
6. Du må ALDRIG bruge lang tankestreg (—). Brug bindestreg i stedet (-), hvis det er nødvendigt.
7. Hver hook skal maksimalt være på 1-2 sætninger.
8. VIGTIGT FORMATERING: Hvis en hook har mere end én sætning, skal den anden sætning starte på en ny linje (ikke dobbelt linjeskift, bare enkelt linjeskift for bedre læsbarhed).
9. Hver hook skal have en forskellig tilgang/vinkel på samme indhold.
10. Du må ALDRIG formode eller antage noget. Eks nævne specifikke tal, mængder, perioder mv., som fx '300 km', '10 dage', '5 kg' osv, hvis ikke det står nævnt idéen.

Returner de 3 hooks adskilt af "|||" - intet andet.
Format: Hook1|||Hook2|||Hook3`;

  try {
    console.log('🤖 Calling OpenAI API to generate 3 hooks for angle:', angle);
    
    // Call OpenAI GPT-4 to generate 3 hooks
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Lav 3 forskellige fængende hooks til dette ${angle} opslag:\n\n"${content}"`
        }
      ],
      temperature: 0.9, // Højere kreativitet for hooks
      max_tokens: 400
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('✅ Raw hooks response for', angle, ':', aiResponse);
    
    // Split the response by ||| and clean up each hook
    const hooks = aiResponse.split('|||').map(hook => 
      hook
        .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
        .replace(/^["']|["']$/g, '') // Remove quotes
        .trim()
    ).filter(hook => hook.length > 10); // Filter out too short hooks
    
    // Ensure we have exactly 3 hooks
    if (hooks.length < 3) {
      console.log('⚠️ Only got', hooks.length, 'hooks, padding with variations');
      // If we don't get 3 hooks, pad with variations of the first hook
      while (hooks.length < 3) {
        hooks.push(hooks[0] || 'Hook kunne ikke genereres');
      }
    }
    
    const finalHooks = hooks.slice(0, 3); // Return exactly 3 hooks
    console.log('✅ 3 Hooks generated for', angle, ':', finalHooks);
    
    return finalHooks;
  } catch (error) {
    console.error('❌ Error calling OpenAI API for hooks:', angle, error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If AI fails, throw error
    throw new Error(`Hook generation failed for ${angle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
