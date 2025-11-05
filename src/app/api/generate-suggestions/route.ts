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

    const { ideaId, content, type, existingSuggestions, generateNew } = await request.json();
    
    console.log('Received request:', { ideaId, content: content?.substring(0, 100), type });

    if (!ideaId || !content) {
      console.log('Missing required fields:', { ideaId: !!ideaId, content: !!content });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the idea belongs to the user
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, user_id')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // If generating new suggestions, don't update status or generate title
    if (!generateNew) {
      // Update status to generating
      await supabase
        .from('ideas')
        .update({ ai_suggestions_status: 'generating' })
        .eq('id', ideaId);
    }

    // Generate suggestions (and title if initial generation)
    const suggestions = await generateAISuggestions(content, type, existingSuggestions);
    const aiTitle = generateNew ? null : await generateAITitle(content, type);

    // Update the idea with AI suggestions and status
    if (generateNew) {
      // For new suggestions, add them to existing suggestions in database
      const updatedSuggestions = [...existingSuggestions, ...suggestions];
      
      const { error: updateError } = await supabase
        .from('ideas')
        .update({ ai_suggestions: updatedSuggestions })
        .eq('id', ideaId);

      if (updateError) {
        console.error('❌ Error updating idea with new suggestions:', updateError);
        throw updateError;
      }
    } else {
      // For initial generation, update everything
      const { error: updateError } = await supabase
        .from('ideas')
        .update({ 
          ai_suggestions: suggestions,
          ai_title: aiTitle,
          ai_suggestions_status: 'completed'
        })
        .eq('id', ideaId);

      if (updateError) {
        console.error('❌ Error updating idea:', updateError);
        throw updateError;
      }
    }


    return NextResponse.json({ 
      success: true, 
      suggestions,
      aiTitle
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Set status to failed if AI generation fails
    try {
      const supabase = await createClient();
      const { ideaId } = await request.json();
      if (ideaId) {
        await supabase
          .from('ideas')
          .update({ ai_suggestions_status: 'failed' })
          .eq('id', ideaId);
      }
    } catch (statusError) {
      console.error('Error updating status to failed:', statusError);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateAISuggestions(content: string, type: string, existingSuggestions?: Array<{title: string, description: string}>): Promise<Array<{title: string, description: string}>> {
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
          content: existingSuggestions && existingSuggestions.length > 0 
            ? `Analyser denne idé og giv præcis 2 NYE konkrete forbedringsforslag:\n\n"${content}"\n\nVIGTIGT: Undgå disse eksisterende forslag:\n${existingSuggestions.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}\n\nGiv 2 helt nye og anderledes forslag.`
            : `Analyser denne idé og giv præcis 2 konkrete forbedringsforslag:\n\n"${content}"`
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

async function generateAITitle(content: string, type: string): Promise<string> {
  const prompt = `Lav en ultrakort og faktuel overskrift på maks 8 ord,
som beskriver idéens indhold tydeligt.
Brug ikke kreative eller emotionelle vinkler – kun fakta.
Eksempler:
Idétekst
“Jeg vil lave et opslag om dengang jeg tabte min pung og fik idéen til min første virksomhed.”
Forventning til overskrift:
“Tabt pung og virksomhedsstart”

Idétekst:
“Jeg vil skrive om at gå fra ansat til selvstændig.”
Forventet overskrift:
"Skifte fra ansat til selvstændig”

Idétekst:
“Jeg vil lave et opslag om hvorfor jeg begyndte at løbe maraton.”
Forventet overskrift:
“Motivation for at løbe maraton”

Analyser idéen og lav en kort, præcis overskrift der beskriver hvad den handler om.`;

  try {
    console.log('📝 Generating AI title for type:', type);
    console.log('📝 Content preview:', content.substring(0, 100) + '...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use faster model for titles
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Lav en kort overskrift til denne idé:\n\n"${content}"`
        }
      ],
      temperature: 0.5,
      max_tokens: 50
    });

    const aiTitle = response.choices[0]?.message?.content?.trim() || '';
    console.log('✅ AI Title generated:', aiTitle);
    
    // Clean the title - remove quotes and ensure it's not too long
    const cleanTitle = aiTitle.replace(/^["']|["']$/g, '').substring(0, 100);
    
    if (!cleanTitle) {
      throw new Error('AI generated empty title');
    }
    
    return cleanTitle;
  } catch (error) {
    console.error('❌ Error generating AI title:', error);
    throw new Error(`AI title generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

