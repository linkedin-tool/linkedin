"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Type, Image as ImageIcon, Upload, FileText, Lightbulb, Loader2, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

type TabType = 'voice' | 'text' | 'image';

export default function NyIdePage() {
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [textContent, setTextContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const router = useRouter();
  const supabase = createClient();

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Først bed om tilladelse - ingen UI ændring endnu
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Nu er tilladelse givet - skift til "forbereder" tilstand
      setIsInitializing(true);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Stop alle audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        await processAudio(audioBlob);
      };

      // Vent 1,2 sekund for at sikre mikrofonen er klar og give brugeren tid
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      mediaRecorder.start(1000); // Saml data hvert sekund
      setIsInitializing(false);
      setIsRecording(true);
    } catch (error) {
      console.error('Fejl ved start af optagelse:', error);
      setIsInitializing(false);
      await Swal.fire({
        icon: 'error',
        title: 'Mikrofon adgang nægtet',
        text: 'Kunne ikke få adgang til mikrofonen. Tjek dine browser-indstillinger og prøv igen.',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        await handleVoiceTranscription(result.text);
      } else {
        console.error('Transskription fejlede:', result.error);
        await Swal.fire({
          icon: 'error',
          title: 'Transskription fejlede',
          text: 'Der opstod en fejl ved transskription. Prøv igen.',
          confirmButtonColor: '#dc2626'
        });
      }
    } catch (error) {
      console.error('Fejl ved upload af lydfil:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Upload fejlede',
        text: 'Der opstod en fejl ved upload af lydfilen. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isInitializing && !isProcessing) {
      startRecording();
    }
  };

  // Generate AI suggestions for an idea in background (after saving to database)
  const generateAISuggestionsInBackground = async (ideaId: string, content: string, type: string) => {
    try {
      // Call the original API that updates the database
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId,
          content,
          type
        }),
      });

      if (!response.ok) {
        console.error('Failed to generate suggestions in background');
        return;
      }

      const result = await response.json();
      console.log('✅ AI suggestions generated in background:', result.suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions in background:', error);
      // Don't throw error - this is background operation
    }
  };

  // Handle voice transcription
  const handleVoiceTranscription = async (transcribedText: string) => {
    if (!transcribedText.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ingen tekst',
        text: 'Der blev ikke registreret nogen tekst fra optagelsen.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Ikke logget ind");
      }

      // Først: Opret idé i databasen med det samme (uden AI-forslag)
      const { data: ideaData, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          content: transcribedText,
          type: 'voice',
          transcribed_text: transcribedText,
          ai_suggestions_status: 'pending'
        })
        .select('id')
        .single() as { data: { id: string } | null; error: any };

      if (error) throw error;

      // Derefter: Generer AI-forslag i baggrunden (fejler ikke hvis det ikke virker)
      if (ideaData?.id) {
        generateAISuggestionsInBackground(ideaData.id, transcribedText, 'voice');
      }

      // Vis success besked
      await Swal.fire({
        title: 'Idé gemt!',
        text: 'Din indtale idé er blevet gemt i idébanken. AI-forslag genereres i baggrunden.',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: false,
        toast: true,
        showClass: {
          popup: 'swal2-toast-fade-in'
        },
        hideClass: {
          popup: 'swal2-toast-fade-out'
        },
        position: 'top-end'
      });

      // Naviger til idébank
      router.push('/dashboard/idebank');

    } catch (error) {
      console.error('Error saving voice idea:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved gemning',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle text submission
  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ingen tekst',
        text: 'Skriv venligst din idé før du gemmer.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Ikke logget ind");
      }

      // Først: Opret idé i databasen med det samme (uden AI-forslag)
      const { data: ideaData, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          content: textContent.trim(),
          type: 'text',
          ai_suggestions_status: 'pending'
        })
        .select('id')
        .single() as { data: { id: string } | null; error: any };

      if (error) throw error;

      // Derefter: Generer AI-forslag i baggrunden (fejler ikke hvis det ikke virker)
      if (ideaData?.id) {
        generateAISuggestionsInBackground(ideaData.id, textContent.trim(), 'text');
      }

      // Vis success besked
      await Swal.fire({
        title: 'Idé gemt!',
        text: 'Din tekst idé er blevet gemt i idébanken. AI-forslag genereres i baggrunden.',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: false,
        toast: true,
        showClass: {
          popup: 'swal2-toast-fade-in'
        },
        hideClass: {
          popup: 'swal2-toast-fade-out'
        },
        position: 'top-end'
      });

      // Naviger til idébank
      router.push('/dashboard/idebank');

    } catch (error) {
      console.error('Error saving text idea:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved gemning',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Ugyldig filtype',
          text: 'Vælg venligst en billedfil (JPG, PNG, GIF, etc.)',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Ugyldig filtype',
          text: 'Vælg venligst en billedfil (JPG, PNG, GIF, etc.)',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  // Handle image submission (placeholder for now)
  const handleImageSubmit = async () => {
    // TODO: Implementer billede upload funktionalitet senere
    await Swal.fire({
      icon: 'info',
      title: 'Kommer snart',
      text: 'Billede funktionaliteten implementeres senere.',
      confirmButtonColor: '#2563eb'
    });
  };

  const tabs = [
    {
      id: 'voice' as TabType,
      name: 'Indtal',
      icon: Mic,
      description: 'Indtal din idé med mikrofonen'
    },
    {
      id: 'text' as TabType,
      name: 'Skriv',
      icon: Type,
      description: 'Skriv din idé som tekst'
    },
    {
      id: 'image' as TabType,
      name: 'Billede',
      icon: ImageIcon,
      description: 'Upload et billede med din idé'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ny Idé</h1>
        <p className="text-lg text-gray-600">Gem dine idéer hurtigt og nemt - enten ved at indtale, skrive eller uploade et billede.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center px-6 py-3 rounded-full font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-400'
                    }`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Description */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm">
          {activeTab === 'voice' && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Indtal din idé</h3>
                <p className="text-gray-600 mb-8">
                  Klik på mikrofon-knappen for at starte optagelsen. Tal naturligt og din tale vil automatisk blive transskriberet og gemt som en idé.
                </p>
              </div>

              {/* Voice Recording Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleVoiceButtonClick}
                  disabled={isProcessing || isSubmitting}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
                    ${isProcessing ? 'bg-blue-600' : 
                      isInitializing ? 'bg-yellow-500' : 
                      isRecording ? 'bg-red-600 hover:bg-red-700' : 
                      'bg-blue-600 hover:bg-blue-700'
                    }
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : isInitializing ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              {/* Status Text */}
              <div className="text-sm text-gray-600">
                {isProcessing ? (
                  <span className="text-blue-600 font-medium">Transskriberer og gemmer...</span>
                ) : isInitializing ? (
                  <span className="text-yellow-600 font-medium">Forbereder mikrofon...</span>
                ) : isRecording ? (
                  <span className="text-red-600 font-medium">Optager - klik for at stoppe</span>
                ) : (
                  <span>Klik på mikrofonen for at starte</span>
                )}
              </div>

              {isSubmitting && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Gemmer idé...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Type className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Skriv din idé</h3>
                  <p className="text-gray-600">Beskriv din idé i detaljer</p>
                </div>
              </div>

              <div>
                <label htmlFor="idea-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Din idé
                </label>
                <textarea
                  id="idea-text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Skriv din idé her..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                  rows={8}
                  maxLength={5000}
                />
                <div className="mt-2 text-xs text-gray-500 text-right">
                  {textContent.length}/5000 tegn
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textContent.trim() || isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gemmer...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Gem Idé
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Upload billede</h3>
                  <p className="text-gray-600">Upload et billede med din idé eller inspiration</p>
                </div>
              </div>

              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : imagePreview
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setImageDescription("");
                        }}
                        className="px-4 py-2"
                      >
                        Fjern billede
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Træk og slip dit billede her
                      </p>
                      <p className="text-gray-600">eller</p>
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Vælg billede
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileInput}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Understøttede formater: JPG, PNG, GIF (maks. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Image Description */}
              {imagePreview && (
                <div>
                  <label htmlFor="image-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivelse (valgfrit)
                  </label>
                  <textarea
                    id="image-description"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Beskriv hvad billedet viser eller din idé bag det..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-right">
                    {imageDescription.length}/1000 tegn
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleImageSubmit}
                  disabled={!imageFile}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Gem Idé
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
