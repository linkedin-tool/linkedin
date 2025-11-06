'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Loader2, 
  Palette,
  GripVertical,
  Sparkles
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Slide {
  id: string
  content: string
  order: number
}

interface GeneratedSlides {
  title: string
  slides: Slide[]
}

export default function PDFGeneratorPage() {
  const [idea, setIdea] = useState('')
  const [slideCount, setSlideCount] = useState(6)
  const [backgroundColor, setBackgroundColor] = useState('#3B82F6') // Default blue
  const [textColor, setTextColor] = useState('#FFFFFF') // Default white
  const [customColor, setCustomColor] = useState('')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlides | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const draggedItem = useRef<number | null>(null)
  const slidesRef = useRef<HTMLDivElement>(null)

  // Predefined colors
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#EC4899', // Pink
  ]

  const handleGenerateSlides = async () => {
    if (!idea.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-pdf-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.trim(),
          slideCount,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedSlides({
          title: data.title,
          slides: data.slides.map((content: string, index: number) => ({
            id: `slide-${index}`,
            content,
            order: index
          }))
        })
      } else {
        console.error('Error generating slides:', data.error)
        const { default: Swal } = await import('sweetalert2')
        await Swal.fire({
          title: '❌ Fejl ved generering',
          text: data.error || 'Der opstod en fejl ved generering af slides',
          confirmButtonColor: '#2563eb',
          customClass: {
            popup: 'text-gray-900',
            title: 'text-gray-900 font-semibold',
            htmlContainer: 'text-gray-700',
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
          }
        })
      }
    } catch (error) {
      console.error('Error generating slides:', error)
      const { default: Swal } = await import('sweetalert2')
      await Swal.fire({
        title: '❌ Netværksfejl',
        text: 'Der opstod en fejl ved forbindelse til serveren. Prøv igen senere.',
        confirmButtonColor: '#2563eb',
        customClass: {
          popup: 'text-gray-900',
          title: 'text-gray-900 font-semibold',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
        }
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!generatedSlides || !slidesRef.current) return

    setIsDownloading(true)
    try {
      const pdf = new jsPDF('p', 'px', [1080, 1080])
      const slideElements = slidesRef.current.querySelectorAll('.pdf-slide')
      
      console.log(`🚀 Starting PDF generation for ${slideElements.length} slides...`)
      
      for (let i = 0; i < slideElements.length; i++) {
        console.log(`📸 Processing slide ${i + 1}/${slideElements.length}...`)
        const slideElement = slideElements[i] as HTMLElement
        
        // Get current slide dimensions
        const slideRect = slideElement.getBoundingClientRect()
        const currentWidth = slideRect.width
        const currentHeight = slideRect.height
        
        // Calculate scale to get to 1080x1080
        const scale = 1080 / Math.max(currentWidth, currentHeight)
        
        // Take a simple screenshot of the slide element as it appears on screen
        const canvas = await html2canvas(slideElement, {
          scale: scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: safeBgColor,
          logging: false,
          width: currentWidth,
          height: currentHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: any) => {
            // Only remove problematic CSS properties that cause oklch errors
            const allElements = clonedDoc.querySelectorAll('*')
            allElements.forEach((el: any) => {
              if (el.style) {
                // Remove CSS custom properties that might contain oklch
                const styleProps = Object.getOwnPropertyNames(el.style)
                styleProps.forEach((prop: string) => {
                  if (prop.startsWith('--tw-')) {
                    el.style.removeProperty(prop)
                  }
                })
                
                // Only for PDF slides: remove border-radius and border for clean edges
                if (el.classList?.contains('pdf-slide')) {
                  el.style.borderRadius = '0'
                  el.style.border = 'none'
                  el.style.boxShadow = 'none'
                  el.style.backgroundColor = safeBgColor
                }
              }
            })

            // Special adjustment for PDF generation: Move text containers up slightly
            const textContainers = clonedDoc.querySelectorAll('.pdf-slide > div')
            textContainers.forEach((container: any) => {
              if (container.style && container.style.position === 'absolute') {
                container.style.top = '47%' // Move up from 50% to 47% for PDF only
              }
            })
          }
        } as any) // Type assertion to bypass TypeScript restrictions
        
        const imgData = canvas.toDataURL('image/png')
        
        // Add page to PDF (except for first slide)
        if (i > 0) {
          pdf.addPage([1080, 1080])
        }
        
        // Add image to PDF page
        pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1080)
      }
      
      // Generate filename - clean and readable
      const cleanTitle = generatedSlides.title
        .replace(/[æÆ]/g, 'ae')
        .replace(/[øØ]/g, 'oe') 
        .replace(/[åÅ]/g, 'aa')
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars but keep spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with single hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .toLowerCase()
      
      const filename = `${cleanTitle}-karussel.pdf`
      
      // Save PDF locally
      pdf.save(filename)
      
      // Save to Supabase storage
      await savePDFToSupabase(pdf.output('blob'), filename)
      
      // Show success message
      const { default: Swal } = await import('sweetalert2')
      await Swal.fire({
        title: '✅ PDF genereret!',
        text: `${generatedSlides.title} er downloadet og gemt i din konto.`,
        confirmButtonColor: '#2563eb',
        customClass: {
          popup: 'text-gray-900',
          title: 'text-gray-900 font-semibold',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
        }
      })
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
      const { default: Swal } = await import('sweetalert2')
      await Swal.fire({
        title: '❌ Fejl ved PDF generering',
        text: 'Der opstod en fejl ved oprettelse af PDF\'en. Prøv igen.',
        confirmButtonColor: '#2563eb',
        customClass: {
          popup: 'text-gray-900',
          title: 'text-gray-900 font-semibold',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
        }
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const savePDFToSupabase = async (pdfBlob: Blob, filename: string) => {
    try {
      const response = await fetch('/api/save-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          title: generatedSlides?.title,
          slideCount: generatedSlides?.slides.length
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Upload PDF to Supabase storage using signed URL
        const uploadResponse = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: pdfBlob,
          headers: {
            'Content-Type': 'application/pdf',
          },
        })
        
        if (uploadResponse.ok) {
          console.log('PDF saved to Supabase:', data.publicUrl)
        }
      }
    } catch (error) {
      console.error('Error saving PDF to Supabase:', error)
    }
  }

  const handleDragStart = (index: number) => {
    draggedItem.current = index
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem.current === null || !generatedSlides) return

    const dragIndex = draggedItem.current
    const newSlides = [...generatedSlides.slides]
    const draggedSlide = newSlides[dragIndex]
    
    // Remove dragged item and insert at new position
    newSlides.splice(dragIndex, 1)
    newSlides.splice(dropIndex, 0, draggedSlide)
    
    // Update order
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index
    }))

    setGeneratedSlides({
      ...generatedSlides,
      slides: updatedSlides
    })
    
    draggedItem.current = null
  }


  const getOptimalFontSize = (content: string) => {
    const length = content.length
    
    // Conservative font sizing to prevent text cutoff while maintaining readability
    if (length < 15) return 28   // Very short text - large font
    if (length < 30) return 24   // Short text - medium-large font
    if (length < 60) return 20   // Medium-short text - medium font
    if (length < 100) return 16  // Medium text - smaller font
    if (length < 150) return 14  // Long text - small font
    if (length < 200) return 12  // Very long text - very small font
    if (length < 250) return 11  // Extremely long text - tiny font
    return 10 // Ultra long text - minimum readable size
  }

  // Ensure we have simple hex colors for PDF generation
  const selectedBgColor = customColor || backgroundColor
  
  // Convert any complex color to simple hex if needed
  const getSimpleColor = (color: string): string => {
    // If it's already a hex color, return as is
    if (color.startsWith('#')) return color
    
    // Convert common color names to hex
    const colorMap: { [key: string]: string } = {
      'white': '#FFFFFF',
      'black': '#000000',
      'blue': '#3B82F6',
      'red': '#EF4444',
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'gray': '#6B7280',
      'grey': '#6B7280'
    }
    
    return colorMap[color.toLowerCase()] || color
  }
  
  const safeBgColor = getSimpleColor(selectedBgColor)
  const safeTextColor = getSimpleColor(textColor)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF Generator</h1>
        <p className="text-lg text-gray-600">
          Skab professionelle LinkedIn karussel-opslag med AI-genererede slides.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Input Section */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="space-y-6">
            <div>
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
                Din idé til karussel-opslag
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Beskriv din idé til LinkedIn karussel-opslaget. AI'en vil generere indhold til dine slides baseret på denne beskrivelse..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 resize-none text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slide Count */}
              <div>
                <label htmlFor="slideCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Antal slides
                </label>
                <select
                  id="slideCount"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 bg-white text-gray-900 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} slides</option>
                  ))}
                </select>
              </div>

              {/* Font Family */}
              <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 mb-2">
                  Skrifttype
                </label>
                <select
                  id="fontFamily"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 bg-white text-gray-900 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
              </div>
            </div>

            {/* Color Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Farveindstillinger
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Baggrundsfarve
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      {presetColors.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setBackgroundColor(color)
                            setCustomColor('')
                          }}
                          className={`w-8 h-8 rounded-full transition-all ${
                            backgroundColor === color && !customColor
                              ? 'ring-2 ring-gray-900 ring-offset-2' 
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <label htmlFor="customColor" className="block text-xs text-gray-500 mb-1">
                        Eller angiv hex-kode:
                      </label>
                      <input
                        id="customColor"
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="#000000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tekstfarve
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTextColor('#FFFFFF')}
                      className={`w-8 h-8 bg-white border border-gray-300 rounded-full transition-all ${
                        textColor === '#FFFFFF'
                          ? 'ring-2 ring-gray-900 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                    />
                    <button
                      onClick={() => setTextColor('#000000')}
                      className={`w-8 h-8 bg-black rounded-full transition-all ${
                        textColor === '#000000'
                          ? 'ring-2 ring-gray-900 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateSlides}
              disabled={!idea.trim() || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium rounded-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Genererer slides...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generer {slideCount} slides
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Slides */}
        {generatedSlides && (
          <Card className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{generatedSlides.title}</h2>
                  <p className="text-gray-600 mt-1">
                    {generatedSlides.slides.length} slides genereret • Træk og slip for at ændre rækkefølge
                  </p>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloader...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>

              {/* Slides Grid */}
              <div ref={slidesRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedSlides.slides
                  .sort((a, b) => a.order - b.order)
                  .map((slide, index) => (
                    <div
                      key={slide.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="relative group cursor-move"
                    >
                      {/* Slide Number */}
                      <div className="absolute -top-2 -left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full z-10">
                        Slide {index + 1}
                      </div>
                      
                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>

                      {/* Slide Content */}
                      <div
                        className="pdf-slide"
                        style={{ 
                          position: 'relative',
                          backgroundColor: safeBgColor,
                          color: safeTextColor,
                          fontFamily: fontFamily,
                          width: '100%',
                          height: '0',
                          paddingBottom: '100%', // This creates a perfect 1:1 square ratio
                          overflow: 'hidden',
                          borderRadius: '8px', // Only for display, will be removed in PDF
                          border: '2px solid #e5e7eb', // Only for display, will be removed in PDF
                          transition: 'all 0.2s',
                          boxShadow: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db'
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                          <div 
                            style={{ 
                              position: 'absolute',
                              top: '50%', // Perfect center for screen display
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '88%', // Account for 6% padding on each side
                              textAlign: 'center'
                            }}
                          >
                          <p 
                            style={{
                              fontSize: `${getOptimalFontSize(slide.content)}px`,
                              lineHeight: '1.2', // Tighter line height for better centering
                              wordBreak: 'normal',
                              hyphens: 'none',
                              overflowWrap: 'break-word',
                              fontWeight: '500',
                              width: '100%',
                              margin: '0',
                              padding: '0',
                              textAlign: 'center', // Keep text centered
                              display: 'block',
                              overflow: 'visible'
                            }}
                          >
                            {slide.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
