import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { idea, slideCount } = await request.json()

    if (!idea || !slideCount) {
      return NextResponse.json({ 
        error: 'Idé og antal slides er påkrævet' 
      }, { status: 400 })
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Ikke autoriseret' 
      }, { status: 401 })
    }

    console.log(`🎨 Generating ${slideCount} PDF slides for user:`, user.id)
    console.log('📝 Idea preview:', idea.substring(0, 100) + '...')

    // Generate slides with OpenAI
    const slidesResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en ekspert i at skabe fængende LinkedIn karussel-opslag. Din opgave er at generere indhold til ${slideCount} slides baseret på brugerens idé.

VIGTIGE RETNINGSLINJER:
- Generer præcis ${slideCount} slides
- Hver slide skal have kort, kraftfuldt indhold (max 2-3 korte sætninger)
- Indholdet skal være engagerende og LinkedIn-venligt
- Brug actionable insights og værdifulde takeaways
- Skriv på dansk
- Første slide kan være en titel/intro slide
- Sidste slide kan være en call-to-action eller konklusion
- Slides skal bygge på hinanden og fortælle en sammenhængende historie

SLIDE INDHOLD:
- Hold teksten kort og læsbar
- Brug stærke, handlingsorienterede ord
- Fokuser på værdi for læseren
- Undgå lange sætninger
- Gør det visuelt tiltalende når det læses

OUTPUT FORMAT:
Returner et JSON objekt med:
{
  "title": "Overordnet titel til karussellen",
  "slides": ["Slide 1 indhold", "Slide 2 indhold", ...]
}

Sørg for at slides arrayet indeholder præcis ${slideCount} elementer.`
        },
        {
          role: 'user',
          content: `Lav ${slideCount} slides til en LinkedIn karussel baseret på denne idé:\n\n"${idea}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const aiResponse = slidesResponse.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('Ingen respons fra AI')
    }

    console.log('🤖 AI Response received:', aiResponse.substring(0, 200) + '...')

    // Parse AI response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError)
      console.log('Raw AI response:', aiResponse)
      
      // Fallback: try to extract content manually
      const lines = aiResponse.split('\n').filter(line => line.trim())
      const title = lines[0] || 'LinkedIn Karussel'
      const slides = lines.slice(1, slideCount + 1).map(line => 
        line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim()
      )
      
      parsedResponse = { title, slides }
    }

    const { title, slides } = parsedResponse

    if (!slides || !Array.isArray(slides) || slides.length !== slideCount) {
      throw new Error(`AI returnerede ${slides?.length || 0} slides, forventede ${slideCount}`)
    }

    console.log('✅ Successfully generated slides:', {
      title,
      slideCount: slides.length
    })

    return NextResponse.json({
      success: true,
      title,
      slides
    })

  } catch (error) {
    console.error('❌ Error in generate-pdf-slides:', error)
    
    return NextResponse.json({ 
      error: 'Der opstod en fejl ved generering af slides',
      details: error instanceof Error ? error.message : 'Ukendt fejl'
    }, { status: 500 })
  }
}
