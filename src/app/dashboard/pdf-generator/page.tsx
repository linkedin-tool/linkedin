'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import VoiceRecorder from '@/components/VoiceRecorder'
import { 
  Download, 
  Loader2, 
  Palette,
  GripVertical,
  Sparkles,
  Edit3,
  Check,
  X
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
  const [fontFamily, setFontFamily] = useState('Helvetica')
  const [textAlign, setTextAlign] = useState('center')
  const [verticalAlign, setVerticalAlign] = useState('center')
  const [fontSize, setFontSize] = useState(0) // -3 to +3, 0 is default
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlides | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
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

  // Function to convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return [h * 360, s * 100, l * 100]
  }

  // Function to convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  // Function to lighten a hex color with reduced saturation
  const lightenColor = (hex: string, percent: number) => {
    const [h, s, l] = hexToHsl(hex)
    const newL = Math.min(100, l + percent)
    const newS = Math.max(0, s - 20) // Reduce saturation by 20%
    return hslToHex(h, newS, newL)
  }

  // Function to darken a hex color with reduced saturation
  const darkenColor = (hex: string, percent: number) => {
    const [h, s, l] = hexToHsl(hex)
    const newL = Math.max(0, l - percent)
    const newS = Math.max(0, s - 20) // Reduce saturation by 20%
    return hslToHex(h, newS, newL)
  }

  // Get dynamic text colors based on background
  const currentBgColor = customColor || backgroundColor
  const lighterTextColor = lightenColor(currentBgColor, 30) // 30% lighter
  const darkerTextColor = darkenColor(currentBgColor, 30) // 30% darker

  // Auto-update text color when background changes (if using dynamic colors)
  const previousBgColor = useRef(currentBgColor)
  const previousLighterColor = useRef(lighterTextColor)
  const previousDarkerColor = useRef(darkerTextColor)

  useEffect(() => {
    // Check if background color changed
    if (previousBgColor.current !== currentBgColor) {
      // If text color was set to previous lighter color, update to new lighter color
      if (textColor === previousLighterColor.current) {
        setTextColor(lighterTextColor)
      }
      // If text color was set to previous darker color, update to new darker color
      else if (textColor === previousDarkerColor.current) {
        setTextColor(darkerTextColor)
      }
      
      // Update refs
      previousBgColor.current = currentBgColor
      previousLighterColor.current = lighterTextColor
      previousDarkerColor.current = darkerTextColor
    }
  }, [currentBgColor, lighterTextColor, darkerTextColor, textColor])

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
        
        // Calculate scale to ensure we capture at 1080x1080 resolution
        const targetSize = 1080
        const scale = targetSize / Math.max(currentWidth, currentHeight)
        
        // Take a screenshot of the slide element scaled to target size
        const canvas = await html2canvas(slideElement, {
          scale: scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: safeBgColor,
          logging: false,
          width: currentWidth, // Use actual width
          height: currentHeight, // Use actual height
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: any) => {
            // Calculate scale factor for font sizing
            const pdfScale = targetSize / Math.max(currentWidth, currentHeight)
            
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

            // Apply PDF-specific positioning corrections
            const textContainers = clonedDoc.querySelectorAll('.pdf-slide > div')
            textContainers.forEach((container: any) => {
              if (container.style && container.style.position === 'absolute') {
                // Get current positioning values
                const originalTop = container.style.top
                const originalLeft = container.style.left
                const originalTransform = container.style.transform
                
                // Apply PDF corrections based on vertical alignment
                let correctedTop = originalTop
                if (originalTop === '10%') {
                  // Øverst: Adjust from 10% to 7% (move up by 3%)
                  correctedTop = '7%'
                } else if (originalTop === '50%') {
                  // Midten: Adjust from 50% to 47% (move up by 3%)
                  correctedTop = '47%'
                } else if (originalTop === '90%') {
                  // Nederst: Adjust from 90% to 87% (move up by 3%)
                  correctedTop = '87%'
                }
                
                // Apply corrected positioning
                container.style.top = correctedTop
                if (originalLeft) container.style.left = originalLeft
                if (originalTransform) container.style.transform = originalTransform
                
                // Ensure flexbox properties are preserved
                container.style.display = 'flex'
                const originalAlignItems = container.style.alignItems
                const originalJustifyContent = container.style.justifyContent
                if (originalAlignItems) container.style.alignItems = originalAlignItems
                if (originalJustifyContent) container.style.justifyContent = originalJustifyContent
              }
            })
          }
        } as any) // Type assertion to bypass TypeScript restrictions
        
        // Ensure canvas is exactly 1080x1080
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = 1080
        finalCanvas.height = 1080
        const ctx = finalCanvas.getContext('2d')!
        
        // Draw the original canvas onto the final canvas, scaling to fit exactly
        ctx.drawImage(canvas, 0, 0, 1080, 1080)
        
        const imgData = finalCanvas.toDataURL('image/jpeg', 0.85) // Use JPEG with 85% quality for smaller file size
        
        // Add page to PDF (except for first slide)
        if (i > 0) {
          pdf.addPage([1080, 1080])
        }
        
        // Add image to PDF page
        pdf.addImage(imgData, 'JPEG', 0, 0, 1080, 1080)
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

  // Inline editing functions
  const startEditingSlide = (slideId: string, currentText: string) => {
    setEditingSlideId(slideId)
    setEditingText(currentText)
  }

  const saveSlideEdit = () => {
    if (!editingSlideId || !generatedSlides) return

    const updatedSlides = generatedSlides.slides.map(slide =>
      slide.id === editingSlideId
        ? { ...slide, content: editingText }
        : slide
    )

    setGeneratedSlides({
      ...generatedSlides,
      slides: updatedSlides
    })

    setEditingSlideId(null)
    setEditingText('')
  }

  const cancelSlideEdit = () => {
    setEditingSlideId(null)
    setEditingText('')
  }


  // Dynamic font size based on user selection
  const getFixedFontSize = () => {
    const baseSize = 1.1 // Reduced from 1.2rem to make it slightly smaller
    const sizeStep = 0.1 // Each step is 0.1rem
    const adjustedSize = baseSize + (fontSize * sizeStep)
    return `${adjustedSize}rem`
  }

  // Ensure we have simple hex colors for PDF generation
  const selectedBgColor = customColor || backgroundColor
  
  // Convert any complex color to simple hex if needed
  const getSimpleColor = (color: string): string => {
    // If it's already a hex color, return as is
    if (color.startsWith('#')) return color
    
    // Handle rgba colors - convert to hex with opacity approximation
    if (color.startsWith('rgba(')) {
      // Extract rgba values
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
      if (match) {
        const [, r, g, b, a] = match
        const alpha = parseFloat(a)
        
        // For semi-transparent colors, blend with white background for approximation
        if (alpha < 1) {
          const blendedR = Math.round(parseInt(r) * alpha + 255 * (1 - alpha))
          const blendedG = Math.round(parseInt(g) * alpha + 255 * (1 - alpha))
          const blendedB = Math.round(parseInt(b) * alpha + 255 * (1 - alpha))
          
          return `#${blendedR.toString(16).padStart(2, '0')}${blendedG.toString(16).padStart(2, '0')}${blendedB.toString(16).padStart(2, '0')}`
        }
        
        // Full opacity rgba - convert to hex
        return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
      }
    }
    
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="idea" className="block text-sm font-medium text-gray-700">
                  Din idé til karussel-opslag
                </label>
                <VoiceRecorder 
                  onTranscription={(transcribedText) => setIdea(transcribedText)}
                />
              </div>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Beskriv din idé til LinkedIn karussel-opslaget. AI'en vil generere indhold til dine slides baseret på denne beskrivelse..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 resize-none text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Slide Count */}
              <div>
                <label htmlFor="slideCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Antal slides
                </label>
                <select
                  id="slideCount"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-sm text-gray-900 appearance-none h-10"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                    outline: 'none',
                    boxShadow: 'none'
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-sm text-gray-900 appearance-none h-10"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Inter">Inter</option>
                  <option value="system-ui">System UI</option>
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="SF Pro Display">SF Pro Display</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              {/* Text Alignment */}
              <div>
                <label htmlFor="textAlign" className="block text-sm font-medium text-gray-700 mb-2">
                  Tekstjustering
                </label>
                <select
                  id="textAlign"
                  value={textAlign}
                  onChange={(e) => setTextAlign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-sm text-gray-900 appearance-none h-10"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option value="left">Venstrestillet</option>
                  <option value="center">Centreret</option>
                  <option value="right">Højrestillet</option>
                </select>
              </div>

              {/* Vertical Alignment */}
              <div>
                <label htmlFor="verticalAlign" className="block text-sm font-medium text-gray-700 mb-2">
                  Vertikal placering
                </label>
                <select
                  id="verticalAlign"
                  value={verticalAlign}
                  onChange={(e) => setVerticalAlign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-sm text-gray-900 appearance-none h-10"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option value="top">Øverst</option>
                  <option value="center">Midten</option>
                  <option value="bottom">Nederst</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Skriftstørrelse
                </label>
                <select
                  id="fontSize"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 bg-white text-sm text-gray-900 appearance-none h-10"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option value={3}>Meget stor</option>
                  <option value={2}>Stor</option>
                  <option value={1}>Lidt stor</option>
                  <option value={0}>Normal</option>
                  <option value={-1}>Lidt lille</option>
                  <option value={-2}>Lille</option>
                  <option value={-3}>Meget lille</option>
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 text-gray-900 placeholder-gray-500"
                        style={{ outline: 'none', boxShadow: 'none' }}
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
                      title="Hvid"
                    />
                    <button
                      onClick={() => setTextColor('#000000')}
                      className={`w-8 h-8 bg-black rounded-full transition-all ${
                        textColor === '#000000'
                          ? 'ring-2 ring-gray-900 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      title="Sort"
                    />
                    <button
                      onClick={() => setTextColor(lighterTextColor)}
                      className={`w-8 h-8 border border-gray-300 rounded-full transition-all ${
                        textColor === lighterTextColor
                          ? 'ring-2 ring-gray-900 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: lighterTextColor }}
                      title="Lysere baggrundstone"
                    />
                    <button
                      onClick={() => setTextColor(darkerTextColor)}
                      className={`w-8 h-8 border border-gray-300 rounded-full transition-all ${
                        textColor === darkerTextColor
                          ? 'ring-2 ring-gray-900 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: darkerTextColor }}
                      title="Mørkere baggrundstone"
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
                      draggable={editingSlideId !== slide.id} // Disable drag when editing
                      onDragStart={() => editingSlideId !== slide.id && handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative group ${editingSlideId === slide.id ? 'cursor-text' : 'cursor-move'}`}
                    >
                      {/* Slide Number */}
                      <div className="absolute -top-2 -left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full z-10">
                        Slide {index + 1}
                      </div>
                      
                      {/* Edit and Drag Controls */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                        {editingSlideId === slide.id ? (
                          <>
                            <button
                              onClick={saveSlideEdit}
                              className="w-6 h-6 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                              title="Gem ændringer"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </button>
                            <button
                              onClick={cancelSlideEdit}
                              className="w-6 h-6 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                              title="Annuller"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditingSlide(slide.id, slide.content)}
                              className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                              title="Rediger tekst"
                            >
                              <Edit3 className="w-3 h-3 text-white" />
                            </button>
                            <div className="w-6 h-6 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center">
                              <GripVertical className="w-3 h-3 text-white" />
                            </div>
                          </>
                        )}
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
                              top: verticalAlign === 'top' ? '10%' : verticalAlign === 'bottom' ? '90%' : '50%',
                              left: textAlign === 'left' ? '10%' : textAlign === 'right' ? '90%' : '50%',
                              transform: `translate(${textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'}, ${verticalAlign === 'top' ? '0' : verticalAlign === 'bottom' ? '-100%' : '-50%'})`,
                              width: '80%', // More balanced padding - 10% on each side
                              height: '80%', // Also limit height to create balanced spacing
                              textAlign: textAlign as 'left' | 'center' | 'right',
                              display: 'flex',
                              alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center',
                              justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'
                            }}
                          >
                          {editingSlideId === slide.id ? (
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full h-full resize-none border-none outline-none bg-transparent"
                              style={{
                                fontSize: getFixedFontSize(),
                                lineHeight: '1.1',
                                fontWeight: '600',
                                fontFamily: fontFamily,
                                color: safeTextColor,
                                textAlign: textAlign as 'left' | 'center' | 'right',
                                padding: '8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                outline: 'none',
                                boxShadow: 'none'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  saveSlideEdit()
                                } else if (e.key === 'Escape') {
                                  cancelSlideEdit()
                                }
                              }}
                            />
                          ) : (
                            <p 
                              style={{
                                fontSize: getFixedFontSize(),
                                lineHeight: '1.1', // Tighter line spacing for better fit
                                wordBreak: 'normal',
                                hyphens: 'none',
                                overflowWrap: 'break-word',
                                fontWeight: '600', // Slightly bolder for better impact
                                fontFamily: fontFamily,
                                width: '100%',
                                margin: '0',
                                padding: '0',
                                textAlign: textAlign as 'left' | 'center' | 'right',
                                display: 'block',
                                overflow: 'visible'
                              }}
                            >
                              {slide.content}
                            </p>
                          )}
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
