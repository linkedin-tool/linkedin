import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LinkedInPost {
  angle: 'jordnær' | 'professionel' | 'storytelling';
  title: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, type, angle } = await request.json();
    
    console.log('🤖 Generating single LinkedIn post for angle:', angle, 'type:', type);
    console.log('📝 Content preview:', content?.substring(0, 100) + '...');

    if (!content || !angle) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Missing content or angle field' }, { status: 400 });
    }

    // Generate single LinkedIn post with specific angle
    const post = await generateSingleLinkedInPost(content, type, angle);

    return NextResponse.json({ 
      success: true, 
      post 
    });

  } catch (error) {
    console.error('❌ Error generating single LinkedIn post:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateSingleLinkedInPost(content: string, type: string, angle: 'jordnær' | 'professionel' | 'storytelling'): Promise<LinkedInPost> {
  let prompt = '';
  
  switch (angle) {
    case 'jordnær':
      prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at skrive ét fængende LinkedIn opslag med en JORDNÆR vinkel baseret på følgende idé.

JORDNÆR VINKEL:
- Personlig, relaterbar, hverdagsagtig tone
- Fokuser på menneskelige aspekter og personlige erfaringer
- Brug "jeg", "min", "mit" og personlige anekdoter
- Gør det nemt at relatere til for almindelige mennesker
- Undgå for meget fagsprog eller business-termer

VIGTIGE REGLER:
- Skriv præcis ét komplet LinkedIn opslag
- 150 ord
- Altid korte afsnit på maksimalt 1 sætning.
- Dobbelt linjeskift (\n\n) mellem afsnit.
- Brug dansk sprog
- Gør opslaget engagerende og værdifuldt
- Tilføj relevante emojis hvor det passer naturligt
- Slut med et spørgsmål der inviterer til diskussion
- Brug ikke hashtags - kun tekst og emojis
- Du må ALDRIG bruge lang tankestreg (—). Brug én almindelig bindestreg i stedet (-). Du må ALDRIG bruge bindestreger til at skabe en lang tankestreg.

Analyser idéen grundigt og skriv ét jordnært LinkedIn opslag.`;
      break;
      
    case 'professionel':
      prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at skrive ét fængende LinkedIn opslag med en PROFESSIONEL vinkel baseret på følgende idé.

PROFESSIONEL VINKEL:
- Forretningsorienteret, faglig, strategisk tone
- Fokuser på læringer, insights og professionel udvikling
- Brug business-termer og faglige koncepter
- Tilføj strategiske perspektiver og markedsindsigt
- Gør det relevant for karriereudvikling og forretning

VIGTIGE REGLER:
- Skriv præcis ét komplet LinkedIn opslag
- 150 ord
- Altid korte afsnit på maksimalt 1 sætning.
- Dobbelt linjeskift (\n\n) mellem afsnit.
- Brug dansk sprog
- Gør opslaget engagerende og værdifuldt
- Tilføj relevante emojis hvor det passer naturligt
- Slut med et spørgsmål der inviterer til diskussion
- Brug ikke hashtags - kun tekst og emojis
- Du må ALDRIG bruge lang tankestreg (—). Brug én almindelig bindestreg i stedet (-). Du må ALDRIG bruge bindestreger til at skabe en lang tankestreg.

Analyser idéen grundigt og skriv ét professionelt LinkedIn opslag.`;
      break;
      
    case 'storytelling':
      prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at skrive ét fængende LinkedIn opslag med en STORYTELLING vinkel baseret på følgende idé.

STORYTELLING VINKEL:
- Narrativ tilgang med en klar historie, konflikt og opløsning
- Fokuser på rejsen og transformationen
- Brug dramatiske elementer og spænding
- Byg op til et klimaks og en læring
- Gør det til en historie folk husker

VIGTIGE REGLER:
- Skriv præcis ét komplet LinkedIn opslag
- 150 ord
- Altid korte afsnit på maksimalt 1 sætning.
- Dobbelt linjeskift (\n\n) mellem afsnit.
- Brug dansk sprog
- Gør opslaget engagerende og værdifuldt
- Tilføj relevante emojis hvor det passer naturligt
- Slut med et spørgsmål der inviterer til diskussion
- Brug ikke hashtags - kun tekst og emojis
- Du må ALDRIG bruge lang tankestreg (—). Brug én almindelig bindestreg i stedet (-). Du må ALDRIG bruge bindestreger til at skabe en lang tankestreg.

Analyser idéen grundigt og skriv ét storytelling LinkedIn opslag.`;
      break;
  }

  try {
    console.log('🤖 Calling OpenAI API to generate single LinkedIn post for angle:', angle);
    console.log('📝 Content preview:', content.substring(0, 100) + '...');
    
    // Call OpenAI GPT-4 to generate the post
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Baseret på denne idé, skriv ét fængende LinkedIn opslag med ${angle} vinkel:\n\n"${content}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('✅ OpenAI Response received for', angle, ':', aiResponse.substring(0, 100) + '...');
    
    // Clean up the response
    const cleanContent = aiResponse
      .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
      .trim();
    
    if (cleanContent.length < 50) {
      throw new Error(`Generated content too short for ${angle}: "${cleanContent}"`);
    }
    
    return {
      angle,
      title: getAngleTitle(angle),
      content: cleanContent
    };
  } catch (error) {
    console.error('❌ Error calling OpenAI API for angle:', angle, error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // If AI fails, throw error
    throw new Error(`LinkedIn post generation failed for ${angle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getAngleTitle(angle: 'jordnær' | 'professionel' | 'storytelling'): string {
  switch (angle) {
    case 'jordnær':
      return 'Jordnær';
    case 'professionel':
      return 'Professionel';
    case 'storytelling':
      return 'Storytelling';
    default:
      return 'Ukendt';
  }
}
