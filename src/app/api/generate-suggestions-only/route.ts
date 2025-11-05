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

    const { content, type } = await request.json();
    
    console.log('🤖 Generating suggestions only for type:', type);
    console.log('📝 Content preview:', content?.substring(0, 100) + '...');

    if (!content) {
      console.log('Missing content field');
      return NextResponse.json({ error: 'Missing content field' }, { status: 400 });
    }

    // Generate AI suggestions based on content type
    const suggestions = await generateAISuggestions(content, type);

    return NextResponse.json({ 
      success: true, 
      suggestions 
    });

  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateAISuggestions(content: string, type: string): Promise<Array<{title: string, description: string}>> {
  // Create a prompt based on the content type
  let prompt = '';
  
  if (type === 'voice') {
    prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at analysere en idé til et LinkedIn opslag og komme med præcis 2 konkrete forbedringsforslag.

VIGTIGE REGLER:
- Giv præcis 2 forslag - ikke mere, ikke mindre
- Hvert forslag skal være 1-2 sætninger der forklarer konkret hvad brugeren kan gøre
- Fokuser på actionable, specifikke forbedringer
- Tænk på hvad der skaber engagement på LinkedIn

FORMAT - Svar kun med dette format:
1. [1-2 sætninger med konkret forbedringsforslag]
2. [1-2 sætninger med konkret forbedringsforslag]

EKSEMPLER på gode forslag:
- "Tilføj konkrete tal og resultater fra din oplevelse for at gøre historien mere troværdig og relaterbar."
- "Stil et reflekterende spørgsmål til læserne om deres egne erfaringer med lignende situationer."
- "Del en specifik fejl eller læring fra processen så andre kan undgå samme faldgruber."
- "Inkluder 2-3 actionable tips som andre kan implementere i deres egen situation."

Fokuser på forslag der:
- Gør indholdet mere personligt og relaterbart
- Tilføjer målbar værdi for læserne
- Skaber engagement og diskussion
- Gør historien mere konkret og actionable

Analyser idéen grundigt og kom med de 2 mest effektive forbedringsforslag.`;
  } else if (type === 'text') {
    prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at analysere en tekst-idé til et LinkedIn opslag og komme med præcis 2 konkrete forbedringsforslag.

VIGTIGE REGLER:
- Giv præcis 2 forslag - ikke mere, ikke mindre
- Hvert forslag skal være 1-2 sætninger der forklarer konkret hvad brugeren kan gøre
- Fokuser på actionable, specifikke forbedringer
- Tænk på hvad der skaber engagement på LinkedIn

FORMAT - Svar kun med dette format:
1. [1-2 sætninger med konkret forbedringsforslag]
2. [1-2 sætninger med konkret forbedringsforslag]

EKSEMPLER på gode forslag:
- "Tilføj konkrete tal og resultater fra din oplevelse for at gøre historien mere troværdig og relaterbar."
- "Stil et reflekterende spørgsmål til læserne om deres egne erfaringer med lignende situationer."
- "Del en specifik fejl eller læring fra processen så andre kan undgå samme faldgruber."
- "Inkluder 2-3 actionable tips som andre kan implementere i deres egen situation."

Fokuser på forslag der:
- Gør indholdet mere personligt og relaterbart
- Tilføjer målbar værdi for læserne
- Skaber engagement og diskussion
- Gør teksten mere konkret og actionable

Analyser idéen grundigt og kom med de 2 mest effektive forbedringsforslag.`;
  } else {
    prompt = `Du er en ekspert i LinkedIn content creation. Din opgave er at analysere en billede-idé til et LinkedIn opslag og komme med præcis 2 konkrete forbedringsforslag.

VIGTIGE REGLER:
- Giv præcis 2 forslag - ikke mere, ikke mindre
- Hvert forslag skal være 1-2 sætninger der forklarer konkret hvad brugeren kan gøre
- Fokuser på actionable, specifikke forbedringer
- Tænk på hvad der skaber engagement på LinkedIn

FORMAT - Svar kun med dette format:
1. [1-2 sætninger med konkret forbedringsforslag]
2. [1-2 sætninger med konkret forbedringsforslag]

EKSEMPLER på gode forslag:
- "Tilføj en personlig historie der forklarer konteksten bag billedet og hvad det betyder for dig."
- "Stil et reflekterende spørgsmål til læserne om deres egne erfaringer med det som billedet viser."
- "Forklar den konkrete proces eller de skridt der førte til det øjeblik som billedet fanger."
- "Del 2-3 konkrete læringer fra denne oplevelse som andre kan drage nytte af."

Fokuser på forslag der:
- Udnytter billedets potentiale bedst muligt
- Skaber sammenhæng mellem billede og tekst
- Tilføjer målbar værdi for læserne
- Skaber engagement og diskussion

Analyser idéen grundigt og kom med de 2 mest effektive forbedringsforslag.`;
  }

  try {
    console.log('🤖 Calling OpenAI API with prompt for type:', type);
    console.log('📝 Content preview:', content.substring(0, 100) + '...');
    
    // Call OpenAI GPT-4 to generate real suggestions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Analyser denne idé og giv præcis 2 konkrete forbedringsforslag:\n\n"${content}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = response.choices[0]?.message?.content || '';
    console.log('✅ OpenAI Response received:', aiResponse);
    
    // Parse AI response to extract suggestions
    const suggestions = parseAISuggestions(aiResponse);
    console.log('📋 Parsed suggestions:', suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('🔑 API Key issue detected');
    }
    
    // If AI fails, throw error instead of using fallback
    throw new Error(`AI suggestion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseAISuggestions(aiResponse: string): Array<{title: string, description: string}> {
  try {
    console.log('🔍 Parsing AI response:', aiResponse);
    
    // Split response into lines and clean them
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const suggestions: Array<{title: string, description: string}> = [];
    
    // Look for numbered suggestions (1. or 2.)
    for (const line of lines) {
      const match = line.match(/^[12]\.\s*(.+)$/);
      if (match && suggestions.length < 2) {
        const aiSuggestion = match[1].trim();
        // Remove quotes if present
        const cleanSuggestion = aiSuggestion.replace(/^["']|["']$/g, '');
        
        suggestions.push({
          title: `Forslag ${suggestions.length + 1}`,
          description: cleanSuggestion
        });
      }
    }
    
    // If we couldn't parse numbered format, try to extract any meaningful content
    if (suggestions.length === 0) {
      const meaningfulLines = lines.filter(line => 
        line.length > 10 && 
        !line.toLowerCase().includes('her er') &&
        !line.toLowerCase().includes('forslag:')
      ).slice(0, 2);
      
      meaningfulLines.forEach((line, index) => {
        const cleanLine = line.trim().replace(/^["']|["']$/g, '');
        suggestions.push({
          title: `Forslag ${index + 1}`,
          description: cleanLine
        });
      });
    }
    
    // If we don't have exactly 2 suggestions, throw error
    if (suggestions.length !== 2) {
      throw new Error(`Expected 2 suggestions but got ${suggestions.length}. AI response: "${aiResponse}"`);
    }
    
    console.log('✅ Successfully parsed suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error parsing AI suggestions:', error);
    throw new Error(`Failed to parse AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
