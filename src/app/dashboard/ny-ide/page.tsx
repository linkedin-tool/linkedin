"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Mic, Type, Image as ImageIcon, Upload, FileText, Lightbulb, Loader2, Square } from "lucide-react";
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
  
  // Matching modal states
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [cleanedText, setCleanedText] = useState("");
  const [matchedIdeas, setMatchedIdeas] = useState<Array<{id: string, title: string | null, ai_title: string | null, resume: string | null, score: number}>>([]);
  const [allExistingIdeas, setAllExistingIdeas] = useState<Array<{id: string, title: string | null, ai_title: string | null, resume: string | null}>>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [addingToExisting, setAddingToExisting] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  
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

      if (!response.ok) {
        const text = await response.text();
        console.error('Transcribe API fejl:', response.status, text);
        throw new Error(`Server fejl ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Call intelligent matching API
        const matchResponse = await fetch('/api/match-ideas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcribedText: result.text
          }),
        });

        const matchResult = await matchResponse.json();

        if (matchResult.success) {
          await handleVoiceTranscriptionWithMatches(matchResult.cleanedText, matchResult.matches, matchResult.allIdeas);
        } else {
          console.error('Matching fejlede:', matchResult.error);
          // Fallback to original flow if matching fails
          await handleVoiceTranscription(result.text);
        }
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

  // Handle voice transcription with intelligent matching
  const handleVoiceTranscriptionWithMatches = async (
    cleanedText: string, 
    matches: Array<{id: string, title: string | null, ai_title: string | null, resume: string | null, score: number}>,
    allIdeas: Array<{id: string, title: string | null, ai_title: string | null, resume: string | null}>
  ) => {
    if (!cleanedText.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ingen tekst',
        text: 'Der blev ikke registreret nogen tekst fra optagelsen.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setCleanedText(cleanedText);
    setMatchedIdeas(matches);
    setAllExistingIdeas(allIdeas);

    // Always show the matching modal (even if no matches)
    if (matches.length > 0) {
      setSelectedIdeaId(matches[0].id); // Default to highest scoring match
    } else {
      setSelectedIdeaId(null); // No default selection if no matches
    }
    setShowMatchingModal(true);
  };

  // Create new idea (extracted from handleVoiceTranscription)
  const createNewIdea = async (content: string) => {
    try {
      setCreatingNew(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Ikke logget ind");
      }

      // Opret idé i databasen
      const { data: ideaData, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          content: content,
          type: 'voice',
          transcribed_text: content,
          ai_suggestions_status: 'pending'
        })
        .select('id')
        .single() as { data: { id: string } | null; error: any };

      if (error) throw error;

      // Generer AI-forslag i baggrunden
      if (ideaData?.id) {
        generateAISuggestionsInBackground(ideaData.id, content, 'voice');
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
        title: 'Fejl',
        text: 'Der opstod en fejl ved gemning af idéen. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setCreatingNew(false);
    }
  };

  // Add to existing idea
  const addToExistingIdea = async () => {
    if (!selectedIdeaId || !cleanedText.trim()) return;

    try {
      setAddingToExisting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Ikke logget ind");
      }

      // Get the existing idea
      const { data: existingIdea, error: fetchError } = await supabase
        .from('ideas')
        .select('content, transcribed_text, type')
        .eq('id', selectedIdeaId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Determine which field to update based on type
      const currentContent = existingIdea.type === 'voice' && existingIdea.transcribed_text 
        ? existingIdea.transcribed_text 
        : existingIdea.content;

      // Append new content with double line break
      const updatedContent = currentContent + '\n\n' + cleanedText;

      // Update the appropriate field and set updated_at timestamp
      const updateData = existingIdea.type === 'voice' && existingIdea.transcribed_text
        ? { transcribed_text: updatedContent, updated_at: new Date().toISOString() }
        : { content: updatedContent, updated_at: new Date().toISOString() };

      const { error: updateError } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', selectedIdeaId);

      if (updateError) throw updateError;

      // Close modal and show success
      setShowMatchingModal(false);
      
      await Swal.fire({
        title: 'Tilføjet til idé!',
        text: 'Din nye tekst er blevet tilføjet til den eksisterende idé.',
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
      console.error('Error adding to existing idea:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl',
        text: 'Der opstod en fejl ved tilføjelse til idéen. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setAddingToExisting(false);
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
      description: 'Indtal dine tanker og idéer'
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Opret ny idé</h1>
        <p className="text-lg text-gray-600">Fang dine tanker, mens de er friske.</p>
        <p className="text-lg text-gray-600">Skriv eller indtal på farten – og byg videre senere.</p>
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


        {/* Tab Content */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
          {activeTab === 'voice' && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Indtal din idé</h3>
                <p className="text-gray-600 mb-2">
                  Sig, hvad du tænker – hurtigt og spontant.
                </p>
                <p className="text-gray-600 mb-8">
                  Vil du tilføje til en eksisterende idé? Sig f.eks. &quot;Tilføj til min refleksion om ledelse...&quot;
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
                  <span>Klik for at starte optagelse</span>
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

      {/* Matching Modal */}
      {showMatchingModal && (
        <Modal
          isOpen={showMatchingModal}
          onClose={() => setShowMatchingModal(false)}
          title="Hvordan vil du gemme idéen?"
        >
          <div className="space-y-6">
            {/* Preview of cleaned text */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Din rensede tekst:</h4>
              <p className="text-gray-900 text-sm whitespace-pre-wrap">{cleanedText}</p>
            </div>

            {/* Dropdown for selecting idea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vælg eksisterende idé eller opret ny:
              </label>
              <select
                value={selectedIdeaId || ""}
                onChange={(e) => setSelectedIdeaId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white text-gray-900 appearance-none"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {/* Default option when no selection */}
                <option value="">Vælg en idé</option>
                
                {/* Matched ideas first (with score) */}
                {matchedIdeas.length > 0 && (
                  <optgroup label="🎯 Foreslåede matches">
                    {matchedIdeas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.ai_title || idea.title || 'Ingen titel'} 
                        {` (${Math.round(idea.score * 100)}% match)`}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {/* All other existing ideas */}
                {allExistingIdeas.length > 0 && (
                  <optgroup label="📝 Alle eksisterende idéer">
                    {allExistingIdeas
                      .filter(idea => !matchedIdeas.some(match => match.id === idea.id)) // Exclude already matched ideas
                      .map((idea) => (
                        <option key={idea.id} value={idea.id}>
                          {idea.ai_title || idea.title || 'Ingen titel'}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              
              {/* Show resume for selected idea */}
              {selectedIdeaId && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Resumé:</span>{' '}
                    {(() => {
                      // First check in matched ideas, then in all ideas
                      const matchedIdea = matchedIdeas.find(idea => idea.id === selectedIdeaId);
                      const allIdea = allExistingIdeas.find(idea => idea.id === selectedIdeaId);
                      return matchedIdea?.resume || allIdea?.resume || 'Intet resumé';
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={addToExistingIdea}
                disabled={!selectedIdeaId || addingToExisting || creatingNew}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center justify-center w-full">
                  {addingToExisting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                      <span>Tilføjer...</span>
                    </>
                  ) : (
                    <span>Tilføj til valgte idé</span>
                  )}
                </div>
              </Button>
              
              <Button
                onClick={() => createNewIdea(cleanedText)}
                disabled={addingToExisting || creatingNew}
                variant="outline"
                className="flex-1 min-w-0"
              >
                <div className="flex items-center justify-center w-full">
                  {creatingNew ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                      <span>Opretter...</span>
                    </>
                  ) : (
                    <span>Opret som ny idé</span>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
