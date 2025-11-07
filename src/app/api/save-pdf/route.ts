import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { filename, title, slideCount } = await request.json()

    if (!filename || !title) {
      return NextResponse.json({ 
        error: 'Filnavn og titel er påkrævet' 
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

    console.log('📁 Creating PDF storage entry for authenticated user')
    console.log('📄 PDF details:', { filename, title, slideCount })

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const uniqueFilename = `${user.id}/${timestamp}_${filename}`

    // Create signed URL for upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdf-carousels')
      .createSignedUploadUrl(uniqueFilename)

    if (uploadError) {
      console.error('❌ Error creating signed upload URL:', uploadError)
      return NextResponse.json({ 
        error: 'Kunne ikke oprette upload URL' 
      }, { status: 500 })
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('pdf-carousels')
      .getPublicUrl(uniqueFilename)

    // Store PDF metadata in database (optional - for future features)
    const { error: dbError } = await supabase
      .from('pdf_carousels')
      .insert({
        user_id: user.id,
        title,
        filename: uniqueFilename,
        slide_count: slideCount,
        public_url: publicUrlData.publicUrl,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('⚠️ Warning: Could not save PDF metadata to database:', dbError)
      // Continue anyway - the file upload is more important
    }

    console.log('✅ PDF storage setup successful:', {
      uploadUrl: uploadData.signedUrl,
      publicUrl: publicUrlData.publicUrl
    })

    return NextResponse.json({
      success: true,
      uploadUrl: uploadData.signedUrl,
      publicUrl: publicUrlData.publicUrl,
      filename: uniqueFilename
    })

  } catch (error) {
    console.error('❌ Error in save-pdf:', error)
    
    return NextResponse.json({ 
      error: 'Der opstod en fejl ved gemning af PDF',
      details: error instanceof Error ? error.message : 'Ukendt fejl'
    }, { status: 500 })
  }
}
