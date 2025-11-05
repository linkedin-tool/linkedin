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

    const { content, type } = await request.json();
    
    console.log('🤖 Generating 3 LinkedIn posts for type:', type);
    console.log('📝 Content preview:', content?.substring(0, 100) + '...');

    if (!content) {
      console.log('Missing content field');
      return NextResponse.json({ error: 'Missing content field' }, { status: 400 });
    }

    // Generate 3 LinkedIn posts with different angles
    const posts = await generateLinkedInPosts(content);

    return NextResponse.json({ 
      success: true, 
      posts 
    });

  } catch (error) {
    console.error('❌ Error generating LinkedIn posts:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateLinkedInPosts(content: string): Promise<LinkedInPost[]> {
  const basePrompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at skrive 3 fængende LinkedIn opslag baseret på følgende idé, hver med en forskellig vinkel og tilgang.

VIGTIGE REGLER:
- Skriv præcis 3 komplette LinkedIn opslag
- Hvert opslag skal være 150-300 ord
- Brug dansk sprog
- Gør opslagene engagerende og værdifulde
- Tilføj relevante emojis hvor det passer naturligt
- Slut hvert opslag med et spørgsmål der inviterer til diskussion
- Brug ikke hashtags - kun tekst og emojis

VINKLER:
1. JORDNÆR: Personlig, relaterbar, hverdagsagtig tone. Fokuser på menneskelige aspekter og personlige erfaringer.
2. PROFESSIONEL: Forretningsorienteret, faglig, strategisk tone. Fokuser på læringer, insights og professionel udvikling.
3. STORYTELLING: Narrativ tilgang med en klar historie, konflikt og opløsning. Fokuser på rejsen og transformationen.

FORMAT - Svar kun med dette format:
JORDNÆR:
[Komplet LinkedIn opslag med jordnær vinkel]

PROFESSIONEL:
[Komplet LinkedIn opslag med professionel vinkel]

STORYTELLING:
[Komplet LinkedIn opslag med storytelling vinkel]

Analyser idéen grundigt og skriv 3 forskellige, fængende LinkedIn opslag.`;

  try {
    console.log('🤖 Calling OpenAI API to generate 3 LinkedIn posts');
    console.log('📝 Content preview:', content.substring(0, 100) + '...');
    
    // Call OpenAI GPT-4 to generate the posts
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: basePrompt
        },
        {
          role: 'user',
          content: `Baseret på denne idé, skriv 3 fængende LinkedIn opslag med forskellige vinkler:\n\n"${content}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('✅ OpenAI Response received:', aiResponse.substring(0, 200) + '...');
    
    // Parse AI response to extract the 3 posts
    const posts = parseLinkedInPosts(aiResponse);
    console.log('📋 Parsed posts:', posts.map(p => ({ angle: p.angle, title: p.title, contentLength: p.content.length })));
    
    return posts;
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('🔑 API Key issue detected');
    }
    
    // If AI fails, throw error
    throw new Error(`LinkedIn posts generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseLinkedInPosts(aiResponse: string): LinkedInPost[] {
  try {
    console.log('🔍 Parsing AI response for LinkedIn posts');
    
    const posts: LinkedInPost[] = [];
    
    // Split by the angle headers
    const sections = aiResponse.split(/(?:^|\n)(JORDNÆR:|PROFESSIONEL:|STORYTELLING:)/);
    
    // Process each section
    for (let i = 1; i < sections.length; i += 2) {
      const angleHeader = sections[i].replace(':', '').toLowerCase().trim();
      const content = sections[i + 1]?.trim();
      
      if (content && (angleHeader === 'jordnær' || angleHeader === 'professionel' || angleHeader === 'storytelling')) {
        // Clean up the content
        const cleanContent = content
          .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
          .trim();
        
        if (cleanContent.length > 50) { // Ensure it's not empty
          posts.push({
            angle: angleHeader as 'jordnær' | 'professionel' | 'storytelling',
            title: getAngleTitle(angleHeader as 'jordnær' | 'professionel' | 'storytelling'),
            content: cleanContent
          });
        }
      }
    }
    
    // If parsing failed, try alternative approach
    if (posts.length === 0) {
      // Look for patterns like "1.", "2.", "3." or similar
      const lines = aiResponse.split('\n');
      let currentPost = '';
      let currentAngle: 'jordnær' | 'professionel' | 'storytelling' | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this line indicates a new angle
        if (trimmedLine.toLowerCase().includes('jordnær') && !currentAngle) {
          currentAngle = 'jordnær';
          continue;
        } else if (trimmedLine.toLowerCase().includes('professionel') && posts.length < 2) {
          if (currentPost && currentAngle) {
            posts.push({
              angle: currentAngle,
              title: getAngleTitle(currentAngle),
              content: currentPost.trim()
            });
          }
          currentPost = '';
          currentAngle = 'professionel';
          continue;
        } else if (trimmedLine.toLowerCase().includes('storytelling') && posts.length < 3) {
          if (currentPost && currentAngle) {
            posts.push({
              angle: currentAngle,
              title: getAngleTitle(currentAngle),
              content: currentPost.trim()
            });
          }
          currentPost = '';
          currentAngle = 'storytelling';
          continue;
        }
        
        // Add content to current post
        if (currentAngle && trimmedLine) {
          currentPost += (currentPost ? '\n' : '') + trimmedLine;
        }
      }
      
      // Add the last post
      if (currentPost && currentAngle) {
        posts.push({
          angle: currentAngle,
          title: getAngleTitle(currentAngle),
          content: currentPost.trim()
        });
      }
    }
    
    // Validate we have exactly 3 posts
    if (posts.length !== 3) {
      throw new Error(`Expected 3 posts but got ${posts.length}. AI response: "${aiResponse.substring(0, 500)}..."`);
    }
    
    console.log('✅ Successfully parsed 3 LinkedIn posts');
    return posts;
  } catch (error) {
    console.error('Error parsing LinkedIn posts:', error);
    throw new Error(`Failed to parse LinkedIn posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
