'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  className?: string
}

export default function VoiceRecorder({ onTranscription, className = '' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    setIsInitializing(true)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        })
        
        // Stop alle audio tracks
        stream.getTracks().forEach(track => track.stop())
        
        await processAudio(audioBlob)
      }

      // Vent 1,5 sekund for at sikre mikrofonen er klar og give brugeren tid
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      mediaRecorder.start(1000) // Saml data hvert sekund
      setIsInitializing(false)
      setIsRecording(true)
    } catch (error) {
      console.error('Fejl ved start af optagelse:', error)
      setIsInitializing(false)
      alert('Kunne ikke få adgang til mikrofonen. Tjek dine browser-indstillinger.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onTranscription(result.text)
      } else {
        console.error('Transskription fejlede:', result.error)
        alert('Der opstod en fejl ved transskription. Prøv igen.')
      }
    } catch (error) {
      console.error('Fejl ved upload af lydfil:', error)
      alert('Der opstod en fejl ved upload af lydfilen. Prøv igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else if (!isInitializing && !isProcessing) {
      startRecording()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isProcessing || isInitializing}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-blue-600 hover:bg-blue-700 
        border border-blue-600 hover:border-blue-700
        rounded-lg text-sm font-medium text-white
        shadow-sm hover:shadow-md
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isRecording ? 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700' : ''}
        ${isInitializing ? 'bg-yellow-600 border-yellow-600' : ''}
        ${className}
      `}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Transskriberer...</span>
        </>
      ) : isInitializing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>Vent - starter...</span>
        </>
      ) : isRecording ? (
        <>
          <MicOff className="h-4 w-4 text-white" />
          <span>Stop optagelse</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 text-white" />
          <span>Indtal</span>
        </>
      )}
    </button>
  )
}
