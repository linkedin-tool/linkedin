"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Lightbulb, Calendar, PlusCircle, Search, Filter, MoreVertical, Edit, Trash2, Mic, Type, Image as ImageIcon, Check, X, BookmarkPlus, Eye, Info, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Swal from 'sweetalert2';

interface AISuggestion {
  title: string;
  description: string;
}

interface Idea {
  id: string;
  title: string | null;
  ai_title: string | null;
  content: string;
  type: 'voice' | 'text' | 'image';
  image_url: string | null;
  original_audio_url: string | null;
  transcribed_text: string | null;
  ai_suggestions: AISuggestion[] | null;
  ai_suggestions_status: 'pending' | 'generating' | 'completed' | 'failed' | null;
  hidden_suggestions: number[] | null;
  saved_notes: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function IdebankPage() {
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [displayedIdeas, setDisplayedIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "voice" | "text" | "image">("all");
  const [displayCount, setDisplayCount] = useState(20);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [shouldStartTitleEdit, setShouldStartTitleEdit] = useState(false);
  const [showAddToIdea, setShowAddToIdea] = useState(false);
  const [additionalThoughts, setAdditionalThoughts] = useState("");
  const [editingContent, setEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [contentSaving, setContentSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'ai'>('content');
  const [hiddenSuggestions, setHiddenSuggestions] = useState<number[]>([]);
  const [generatingNewSuggestions, setGeneratingNewSuggestions] = useState(false);
  const [showNoteTooltip, setShowNoteTooltip] = useState<number | null>(null);
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Array<{id: number, angle: string, title: string, content: string, hooks?: string[]}>>([]);
  const [activeHookIndex, setActiveHookIndex] = useState<{[key: number]: number}>({});
  const [activePostTab, setActivePostTab] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedPosts, setCompletedPosts] = useState<Set<string>>(new Set());
  const [completedHooks, setCompletedHooks] = useState<Set<string>>(new Set());
  const IDEAS_PER_PAGE = 20;
  
  const supabase = createClient();
  const router = useRouter();

  // Få idé titel til listevisning
  const getIdeaTitle = (idea: Idea): string => {
    // Først: Brug AI-genereret titel hvis den findes
    if (idea.ai_title) {
      return idea.ai_title;
    }
    
    // Derefter: Brug manuel titel hvis den findes
    if (idea.title) {
      return idea.title;
    }
    
    // Til sidst: Brug de første 50 tegn af indholdet
    const content = idea.type === 'voice' && idea.transcribed_text 
      ? idea.transcribed_text 
      : idea.content;
    
    if (content.length > 50) {
      return content.substring(0, 50) + "...";
    }
    return content;
  };

  // Få idé ikon baseret på type
  const getIdeaIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return Mic;
      case 'text':
        return Type;
      case 'image':
        return ImageIcon;
      default:
        return Lightbulb;
    }
  };

  // Få idé type tekst
  const getIdeaTypeText = (type: string) => {
    switch (type) {
      case 'voice':
        return 'Indtalt';
      case 'text':
        return 'Tekst';
      case 'image':
        return 'Billede';
      default:
        return type;
    }
  };

  // Få idé type styling
  const getIdeaTypeStyle = (type: string) => {
    switch (type) {
      case 'voice':
        return 'bg-blue-100 text-blue-800';
      case 'text':
        return 'bg-green-100 text-green-800';
      case 'image':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Få AI suggestions status badge
  const getAISuggestionsStatusBadge = (idea: Idea) => {
    const status = idea.ai_suggestions_status;
    
    if (status === 'completed' && idea.ai_suggestions && idea.ai_suggestions.length > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Lightbulb className="w-3 h-3 mr-1" />
          {idea.ai_suggestions.length} optimeringer
        </span>
      );
    }
    
    if (status === 'pending' || status === 'generating') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
          AI optimeringer genereres...
        </span>
      );
    }
    
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Lightbulb className="w-3 h-3 mr-1" />
          Optimeringer fejlede
        </span>
      );
    }
    
    return null;
  };

  // Få noter badge
  const getNotesBadge = (idea: Idea) => {
    if (idea.saved_notes && idea.saved_notes.length > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <BookmarkPlus className="w-3 h-3 mr-1" />
          {idea.saved_notes.length} {idea.saved_notes.length === 1 ? 'note gemt' : 'noter gemt'}
        </span>
      );
    }
    
    return null;
  };

  const fetchAllIdeas = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Ikke logget ind");
        return;
      }

      const { data: ideasData, error: ideasError } = await supabase
        .from("ideas" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ideasError) {
        throw ideasError;
      }

      const ideas = (ideasData as any) || [];
      setAllIdeas(ideas);
      
    } catch (err: unknown) {
      console.error("Error fetching ideas:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllIdeas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling effect for AI status updates
  useEffect(() => {
    // Tjek om der er idéer der venter på AI completion (både i listen og i modal)
    const hasPendingAI = allIdeas.some(idea => 
      idea.ai_suggestions_status === 'pending' || 
      idea.ai_suggestions_status === 'generating'
    );

    const selectedHasPendingAI = selectedIdea && (
      selectedIdea.ai_suggestions_status === 'pending' || 
      selectedIdea.ai_suggestions_status === 'generating'
    );

    if (!hasPendingAI && !selectedHasPendingAI) return;

    // Poll hver 3 sekunder for opdateringer
    const pollInterval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Hent kun idéer der har pending/generating status (både fra listen og modal)
        const pendingIdsFromList = allIdeas
          .filter(idea => 
            idea.ai_suggestions_status === 'pending' || 
            idea.ai_suggestions_status === 'generating'
          )
          .map(idea => idea.id);

        // Tilføj selectedIdea hvis den også har pending status
        const pendingIds = [...pendingIdsFromList];
        if (selectedIdea && 
            (selectedIdea.ai_suggestions_status === 'pending' || 
             selectedIdea.ai_suggestions_status === 'generating') &&
            !pendingIds.includes(selectedIdea.id)) {
          pendingIds.push(selectedIdea.id);
        }

        if (pendingIds.length === 0) return;

        const { data: updatedIdeas, error } = await supabase
          .from("ideas")
          .select("*")
          .eq("user_id", user.id)
          .in("id", pendingIds) as { data: Idea[] | null; error: any };

        if (error) {
          console.error("Error polling for AI updates:", error);
          return;
        }

        // Opdater kun hvis der faktisk er ændringer
        const hasChanges = updatedIdeas?.some(updatedIdea => {
          const currentIdea = allIdeas.find(idea => idea.id === updatedIdea.id);
          return currentIdea && (
            currentIdea.ai_suggestions_status !== updatedIdea.ai_suggestions_status ||
            (!currentIdea.ai_title && updatedIdea.ai_title) ||
            (!currentIdea.ai_suggestions && updatedIdea.ai_suggestions)
          );
        });

        if (hasChanges) {
          // Opdater kun de ændrede idéer i state
          setAllIdeas(prevIdeas => 
            prevIdeas.map(idea => {
              const updatedIdea = updatedIdeas?.find(updated => updated.id === idea.id);
              return updatedIdea ? { ...idea, ...updatedIdea } : idea;
            })
          );

          // Opdater også selectedIdea hvis den er åben og blev ændret
          if (selectedIdea) {
            const updatedSelectedIdea = updatedIdeas?.find(updated => updated.id === selectedIdea.id);
            if (updatedSelectedIdea) {
              setSelectedIdea(prevSelected => 
                prevSelected ? { ...prevSelected, ...updatedSelectedIdea } : null
              );
            }
          }
        }

      } catch (error) {
        console.error("Error during AI status polling:", error);
      }
    }, 3000); // Poll hver 3 sekunder

    return () => clearInterval(pollInterval);
  }, [allIdeas, selectedIdea, supabase]);

  // Effect til at starte titel redigering når modal åbner
  useEffect(() => {
    if (selectedIdea && shouldStartTitleEdit) {
      // Vent lidt for at sikre modal er fuldt renderet
      const timer = setTimeout(() => {
        startTitleEdit();
        setShouldStartTitleEdit(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [selectedIdea, shouldStartTitleEdit]);

  // Effect til at indlæse skjulte forslag når modal åbner
  useEffect(() => {
    if (selectedIdea) {
      setHiddenSuggestions(selectedIdea.hidden_suggestions || []);
    }
  }, [selectedIdea]);

  // Luk action menu når der klikkes udenfor
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionMenu(null);
    };

    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionMenu]);

  // Luk note tooltip når der klikkes udenfor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Tjek om klikket er uden for tooltip og info-knappen
      if (showNoteTooltip !== null && 
          !target.closest('.note-tooltip') && 
          !target.closest('.note-info-button')) {
        setShowNoteTooltip(null);
      }
    };

    if (showNoteTooltip !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNoteTooltip]);

  // Client-side filtering and search
  useEffect(() => {
    let filtered = allIdeas;

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(idea => idea.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(idea => {
        const searchText = idea.type === 'voice' && idea.transcribed_text 
          ? idea.transcribed_text.toLowerCase()
          : idea.content.toLowerCase();
        return searchText.includes(query) || (idea.title && idea.title.toLowerCase().includes(query));
      });
    }

    // Apply display limit
    const displayed = filtered.slice(0, displayCount);
    setDisplayedIdeas(displayed);
  }, [allIdeas, searchQuery, typeFilter, displayCount]);

  const loadMoreIdeas = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + IDEAS_PER_PAGE);
      setLoadingMore(false);
    }, 300);
  };

  const getFilteredIdeasCount = () => {
    let filtered = allIdeas;
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(idea => idea.type === typeFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(idea => {
        const searchText = idea.type === 'voice' && idea.transcribed_text 
          ? idea.transcribed_text.toLowerCase()
          : idea.content.toLowerCase();
        return searchText.includes(query) || (idea.title && idea.title.toLowerCase().includes(query));
      });
    }
    
    return filtered.length;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ingen dato';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateString:', dateString);
      return 'Ugyldig dato';
    }
  };

  const handleDelete = async (idea: Idea) => {
    setShowActionMenu(null);
    
    // Bekræft sletning med SweetAlert2
    const result = await Swal.fire({
      title: 'Slet idé?',
      text: `Er du sikker på, at du vil slette denne idé? Denne handling kan ikke fortrydes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ja, slet idé',
      cancelButtonText: 'Annuller'
    });

    if (!result.isConfirmed) return;

    setActionLoading(idea.id);

    try {
      const supabase = createClient();
      
      // Slet idéen fra databasen
      const { error } = await supabase
        .from("ideas" as any)
        .delete()
        .eq("id", idea.id);

      if (error) throw error;

      // Fjern idéen fra listen
      setAllIdeas(prev => prev.filter(i => i.id !== idea.id));

      // Vis success besked
      await Swal.fire({
        title: 'Idé slettet!',
        text: 'Idéen er blevet slettet fra systemet.',
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

    } catch (error) {
      console.error('Error deleting idea:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved sletning',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Generate AI suggestions for existing idea
  const generateSuggestionsForIdea = async (idea: Idea) => {
    setSuggestionsLoading(idea.id);
    
    try {
      const content = idea.type === 'voice' && idea.transcribed_text 
        ? idea.transcribed_text 
        : idea.content;

      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          content,
          type: idea.type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const result = await response.json();
      
      // Update the idea in the local state
      setAllIdeas(prev => prev.map(i => 
        i.id === idea.id 
          ? { ...i, ai_suggestions: result.suggestions }
          : i
      ));

      // Update selected idea if it's the same one
      if (selectedIdea?.id === idea.id) {
        setSelectedIdea(prev => prev ? { ...prev, ai_suggestions: result.suggestions } : null);
      }

      await Swal.fire({
        title: 'Forslag genereret!',
        text: 'AI-forslag er blevet genereret for denne idé.',
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

    } catch (error) {
      console.error('Error generating suggestions:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved generering',
        text: 'Kunne ikke generere AI-forslag. Prøv igen senere.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setSuggestionsLoading(null);
    }
  };

  // Start titel redigering
  const startTitleEdit = () => {
    if (!selectedIdea) return;
    const currentTitle = selectedIdea.ai_title || selectedIdea.title || "";
    setEditedTitle(currentTitle);
    setEditingTitle(true);
    
    // Sæt cursor i slutningen af teksten efter næste render
    setTimeout(() => {
      const input = document.getElementById('title-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  };

  // Annuller titel redigering
  const cancelTitleEdit = () => {
    setEditingTitle(false);
    setEditedTitle("");
  };

  // Gem titel ændringer
  const saveTitleEdit = async () => {
    if (!selectedIdea || !editedTitle.trim()) return;
    
    try {
      setTitleSaving(true);
      
      const { error } = await supabase
        .from('ideas')
        .update({ 
          ai_title: editedTitle.trim() 
        })
        .eq('id', selectedIdea.id);

      if (error) throw error;

      // Opdater state
      const updatedIdea = { ...selectedIdea, ai_title: editedTitle.trim() };
      
      setAllIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === selectedIdea.id ? updatedIdea : idea
        )
      );
      
      setSelectedIdea(updatedIdea);
      setEditingTitle(false);
      setEditedTitle("");

      await Swal.fire({
        icon: 'success',
        title: 'Titel opdateret!',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error updating title:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl',
        text: 'Kunne ikke opdatere titel. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setTitleSaving(false);
    }
  };

  // Gem tilføjelser til idé
  const saveAdditionsToIdea = async () => {
    if (!selectedIdea || !additionalThoughts.trim()) return;
    
    try {
      // Get the current content
      const currentContent = selectedIdea.type === 'voice' && selectedIdea.transcribed_text 
        ? selectedIdea.transcribed_text 
        : selectedIdea.content;
      
      // Append new thoughts with line breaks
      const updatedContent = currentContent + '\n\n' + additionalThoughts.trim();
      
      // Update the appropriate field based on type
      const updateData = selectedIdea.type === 'voice' && selectedIdea.transcribed_text
        ? { transcribed_text: updatedContent }
        : { content: updatedContent };

      const { error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', selectedIdea.id);

      if (error) throw error;

      // Update state
      const updatedIdea = { ...selectedIdea, ...updateData };
      
      setAllIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === selectedIdea.id ? updatedIdea : idea
        )
      );
      
      setSelectedIdea(updatedIdea);
      setShowAddToIdea(false);
      setAdditionalThoughts("");

      await Swal.fire({
        icon: 'success',
        title: 'Tilføjelser gemt!',
        text: 'Dine tanker er blevet tilføjet til idéen.',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error saving additions:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl',
        text: 'Kunne ikke gemme tilføjelser. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  // Start indhold redigering
  const startContentEdit = () => {
    if (!selectedIdea) return;
    const currentContent = selectedIdea.type === 'voice' && selectedIdea.transcribed_text 
      ? selectedIdea.transcribed_text 
      : selectedIdea.content;
    setEditedContent(currentContent);
    setEditingContent(true);
    // Skift til content tab så brugeren kan se redigeringsfeltet
    setActiveTab('content');
  };

  // Annuller indhold redigering
  const cancelContentEdit = () => {
    setEditingContent(false);
    setEditedContent("");
  };

  // Gem indhold ændringer
  const saveContentEdit = async () => {
    if (!selectedIdea || !editedContent.trim()) return;
    
    try {
      setContentSaving(true);
      
      // Update the appropriate field based on type
      const updateData = selectedIdea.type === 'voice' && selectedIdea.transcribed_text
        ? { transcribed_text: editedContent.trim() }
        : { content: editedContent.trim() };

      const { error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', selectedIdea.id);

      if (error) throw error;

      // Opdater state
      const updatedIdea = { ...selectedIdea, ...updateData };
      
      setAllIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === selectedIdea.id ? updatedIdea : idea
        )
      );
      
      setSelectedIdea(updatedIdea);
      setEditingContent(false);
      setEditedContent("");

      await Swal.fire({
        icon: 'success',
        title: 'Idé opdateret!',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error updating content:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl',
        text: 'Kunne ikke opdatere idé. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setContentSaving(false);
    }
  };

  // Toggle AI forslag (minimér/vis)
  const toggleSuggestion = async (index: number) => {
    if (!selectedIdea) return;
    
    const isHidden = hiddenSuggestions.includes(index);
    const newHiddenSuggestions = isHidden 
      ? hiddenSuggestions.filter(i => i !== index)
      : [...hiddenSuggestions, index];
    
    setHiddenSuggestions(newHiddenSuggestions);
    
    try {
      // Update database
      const { error } = await supabase
        .from('ideas')
        .update({ hidden_suggestions: newHiddenSuggestions } as any)
        .eq('id', selectedIdea.id);

      if (error) throw error;

      // Update local state
      const updatedIdea = { ...selectedIdea, hidden_suggestions: newHiddenSuggestions };
      setAllIdeas(prev => prev.map(idea => 
        idea.id === selectedIdea.id ? updatedIdea : idea
      ));
      setSelectedIdea(updatedIdea);

    } catch (error) {
      console.error('Error toggling suggestion:', error);
      // Revert local state on error
      setHiddenSuggestions(hiddenSuggestions);
    }
  };

  // Generer nye AI forslag
  const generateNewSuggestions = async () => {
    if (!selectedIdea) return;
    
    setGeneratingNewSuggestions(true);
    
    try {
      // Get current content (including any edits)
      const currentContent = selectedIdea.type === 'voice' && selectedIdea.transcribed_text 
        ? selectedIdea.transcribed_text 
        : selectedIdea.content;

      // Get existing suggestions (including hidden ones)
      const existingSuggestions = selectedIdea.ai_suggestions || [];

      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          content: currentContent,
          type: selectedIdea.type,
          existingSuggestions: existingSuggestions,
          generateNew: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate new suggestions');
      }

      const result = await response.json();
      
      // The API already merged the suggestions, so we use the updated suggestions from the response
      // But we need to fetch the updated idea from the database to get the merged suggestions
      const { data: updatedIdeaData, error: fetchError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', selectedIdea.id)
        .single() as { data: Idea | null; error: any };

      if (fetchError) {
        throw fetchError;
      }

      const updatedIdea = updatedIdeaData as Idea;
      
      setAllIdeas(prev => prev.map(i => 
        i.id === selectedIdea.id 
          ? updatedIdea
          : i
      ));

      // Update selected idea
      setSelectedIdea(updatedIdea);

      const newSuggestionNumbers = result.suggestions.map((_: any, i: number) => existingSuggestions.length + i + 1);
      
      await Swal.fire({
        title: 'Nye forslag genereret!',
        text: `Forslag ${newSuggestionNumbers.join(' og ')} er blevet tilføjet.`,
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

    } catch (error) {
      console.error('Error generating new suggestions:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved generering',
        text: 'Kunne ikke generere nye AI-forslag. Prøv igen senere.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setGeneratingNewSuggestions(false);
    }
  };

  // Generer 3 LinkedIn opslag
  const generateLinkedInPosts = async () => {
    if (!selectedIdea) return;
    
    // Luk detalje-modal og vis progress modal
    setSelectedIdea(null);
    setShowProgressModal(true);
    setGeneratingPosts(true);
    setProgressPercentage(0);
    setCompletedPosts(new Set());
    setCompletedHooks(new Set());
    setGeneratedPosts([]);
    
    try {
      // Get current content (including any edits)
      const currentContent = selectedIdea.type === 'voice' && selectedIdea.transcribed_text 
        ? selectedIdea.transcribed_text 
        : selectedIdea.content;

      // Start progress animation (8% per second, targeting faster AI process)
      const progressInterval = setInterval(() => {
        setProgressPercentage(prev => {
          const newProgress = prev + 8;
          return newProgress >= 85 ? 85 : newProgress; // Stop at 85% until all calls complete
        });
      }, 1000);

      // Create 3 parallel API calls with IDs
      const angles: Array<{id: number, angle: 'jordnær' | 'professionel' | 'storytelling'}> = [
        {id: 1, angle: 'jordnær'},
        {id: 2, angle: 'professionel'}, 
        {id: 3, angle: 'storytelling'}
      ];
      

      const postPromises = angles.map(async ({id, angle}) => {
        try {
          console.log(`🚀 Starting post generation for ${angle} (ID: ${id})`);
          
          // Generate the post
          const response = await fetch('/api/generate-single-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: currentContent,
              type: selectedIdea.type,
              angle: angle
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate ${angle} post`);
          }

          const result = await response.json();
          const post = {...result.post, id};
          
          console.log(`✅ Post ${id} (${angle}) generated, now generating hook...`);
          
          // Update completed posts
          setCompletedPosts(prev => new Set([...prev, angle]));
          
          // Immediately generate 3 hooks for this post
          try {
            const hookResponse = await fetch('/api/generate-hook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: post.content,
                angle: angle
              }),
            });

            if (hookResponse.ok) {
              const hookResult = await hookResponse.json();
              post.hooks = hookResult.hooks || [];
              console.log(`🪝 ${post.hooks.length} Hooks generated for post ${id} (${angle})`);
            } else {
              console.warn(`Failed to generate hooks for ${angle}`);
              post.hooks = [];
            }
          } catch (hookError) {
            console.error(`Error generating hooks for ${angle}:`, hookError);
            post.hooks = [];
          }
          
          // Update completed hooks
          setCompletedHooks(prev => new Set([...prev, angle]));
          
          return post;
        } catch (error) {
          console.error(`Error generating ${angle} post:`, error);
          throw error;
        }
      });

      // Wait for all posts and hooks to complete
      const posts = await Promise.all(postPromises);
      
      // Sort by ID to maintain order
      posts.sort((a, b) => a.id - b.id);
      
      // Clear progress interval and set to 100%
      clearInterval(progressInterval);
      setProgressPercentage(100);
      
      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set generated posts and show posts modal
      setGeneratedPosts(posts);
      setActivePostTab(0);
      setActiveHookIndex({});
      setShowProgressModal(false);
      setShowPostsModal(true);

    } catch (error) {
      console.error('Error generating LinkedIn posts:', error);
      setShowProgressModal(false);
      
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved generering',
        text: 'Kunne ikke generere LinkedIn opslag. Prøv igen senere.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setGeneratingPosts(false);
      setProgressPercentage(0);
      setCompletedPosts(new Set());
      setCompletedHooks(new Set());
    }
  };

  // Navigation mellem hooks
  const navigateHook = (direction: 'prev' | 'next') => {
    const currentPost = generatedPosts[activePostTab];
    if (!currentPost?.hooks || currentPost.hooks.length === 0) return;
    
    const currentIndex = activeHookIndex[activePostTab] || 0;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentPost.hooks.length - 1;
    } else {
      newIndex = currentIndex < currentPost.hooks.length - 1 ? currentIndex + 1 : 0;
    }
    
    setActiveHookIndex(prev => ({
      ...prev,
      [activePostTab]: newIndex
    }));
  };

  // Håndter valg af version
  const handleSelectVersion = () => {
    const selectedPost = generatedPosts[activePostTab];
    if (!selectedPost) return;
    
    // Kombiner hook og content hvis hook findes
    let fullContent = selectedPost.content;
    if (selectedPost.hooks && selectedPost.hooks.length > 0) {
      const currentHookIndex = activeHookIndex[activePostTab] || 0;
      const selectedHook = selectedPost.hooks[currentHookIndex];
      if (selectedHook) {
        fullContent = selectedHook + '\n\n' + selectedPost.content;
      }
    }
    
    // Gem den valgte tekst og hooks i localStorage så de kan bruges på new-post siden
    localStorage.setItem('selectedPostContent', fullContent);
    
    // Gem hooks og aktiv hook index
    if (selectedPost.hooks && selectedPost.hooks.length > 0) {
      localStorage.setItem('selectedPostHooks', JSON.stringify(selectedPost.hooks));
      localStorage.setItem('selectedHookIndex', (activeHookIndex[activePostTab] || 0).toString());
    }
    
    // Luk modal og redirect til new-post siden
    setShowPostsModal(false);
    setGeneratedPosts([]);
    setActivePostTab(0);
    setActiveHookIndex({});
    setProgressPercentage(0);
    setCompletedPosts(new Set());
    setCompletedHooks(new Set());
    
    // Redirect til new-post siden
    router.push('/dashboard/new-post');
  };

  // Tjek om et forslag er gemt som note
  const isNoteSaved = (suggestionIndex: number): boolean => {
    if (!selectedIdea || !selectedIdea.ai_suggestions || !selectedIdea.saved_notes) return false;
    
    const suggestion = selectedIdea.ai_suggestions[suggestionIndex];
    const noteText = `${suggestion.title}: ${suggestion.description}`;
    
    return selectedIdea.saved_notes.includes(noteText);
  };

  // Toggle note (gem/fjern)
  const toggleNote = async (suggestionIndex: number) => {
    if (!selectedIdea || !selectedIdea.ai_suggestions) return;
    
    const suggestion = selectedIdea.ai_suggestions[suggestionIndex];
    const noteText = `${suggestion.title}: ${suggestion.description}`;
    const currentNotes = selectedIdea.saved_notes || [];
    const isCurrentlySaved = currentNotes.includes(noteText);
    
    try {
      let updatedNotes: string[];
      let successMessage: string;
      
      if (isCurrentlySaved) {
        // Fjern note
        updatedNotes = currentNotes.filter(note => note !== noteText);
        successMessage = 'Note fjernet!';
      } else {
        // Gem note
        updatedNotes = [...currentNotes, noteText];
        successMessage = 'Note gemt!';
      }
      
      // Update database
      const { error } = await supabase
        .from('ideas')
        .update({ saved_notes: updatedNotes } as any)
        .eq('id', selectedIdea.id);

      if (error) throw error;

      // Update local state
      const updatedIdea = { ...selectedIdea, saved_notes: updatedNotes };
      setAllIdeas(prev => prev.map(idea => 
        idea.id === selectedIdea.id ? updatedIdea : idea
      ));
      setSelectedIdea(updatedIdea);

      await Swal.fire({
        title: successMessage,
        text: isCurrentlySaved ? 'Noten er fjernet fra idéen.' : 'Forslaget er gemt som note til fremtidig brug.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error toggling note:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl',
        text: 'Kunne ikke opdatere note. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Idé Bank</h1>
          <p className="text-lg text-gray-600">Se alle dine gemte idéer og inspiration.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Indlæser dine idéer...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Idé Bank</h1>
        <p className="text-lg text-gray-600">Se alle dine gemte idéer og inspiration.</p>
      </div>

      <div className="max-w-4xl">
        {error && (
          <Card className="p-6 bg-gradient-to-r from-red-50 to-red-50 border-red-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Fejl ved indlæsning</h3>
                <p className="text-gray-700 mt-1">Fejl: {error}</p>
              </div>
            </div>
          </Card>
        )}

        {allIdeas.length === 0 && !loading && !error ? (
          <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen idéer endnu</h3>
            <p className="text-gray-600 mb-6">
              Du har ikke gemt nogen idéer endnu. Opret din første idé for at komme i gang.
            </p>
            <Button asChild className="px-8 h-11 bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/ny-ide">
                <PlusCircle className="w-4 h-4" />
                Opret din første idé
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Search and Filter */}
            <Card className="p-4 bg-white border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Søg i idéer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 text-gray-900 placeholder-gray-500 h-10"
                    disabled={loading}
                  />
                </div>
                
                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400 w-4 h-4" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "all" | "voice" | "text" | "image")}
                    className="appearance-none px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 bg-white text-gray-900 text-base font-medium cursor-pointer hover:bg-gray-50 transition-colors h-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="all">Alle typer</option>
                    <option value="voice">Indtalt</option>
                    <option value="text">Tekst</option>
                    <option value="image">Billede</option>
                  </select>
                </div>
              </div>
              
              {/* Results count */}
              <div className="mt-3 text-sm text-gray-500">
                Viser {displayedIdeas.length} idéer
                {getFilteredIdeasCount() > displayedIdeas.length && <span> (flere tilgængelige)</span>}
                {searchQuery && (
                  <span> • Søger efter &quot;{searchQuery}&quot;</span>
                )}
                {typeFilter !== "all" && (
                  <span> • Filtreret efter {getIdeaTypeText(typeFilter).toLowerCase()}</span>
                )}
              </div>
            </Card>

            {/* Ideas List */}
            <div className="space-y-3">
              {displayedIdeas.length === 0 ? (
                <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen idéer fundet</h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? `Ingen idéer matcher søgningen &quot;${searchQuery}&quot;`
                      : typeFilter !== "all"
                      ? `Ingen ${getIdeaTypeText(typeFilter).toLowerCase()} idéer fundet`
                      : "Ingen idéer at vise"
                    }
                  </p>
                </Card>
              ) : (
                displayedIdeas.map((idea) => {
                  const IdeaIcon = getIdeaIcon(idea.type);
                  return (
                    <Card 
                      key={idea.id} 
                      className="group p-3 sm:p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedIdea(idea)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 relative">
                          {idea.type === 'image' && idea.image_url ? (
                            <img 
                              src={idea.image_url} 
                              alt="Idé billede"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <IdeaIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight mb-2 overflow-hidden" 
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                  }}>
                                {getIdeaTitle(idea)}
                              </h4>
                              
                              {/* Badges */}
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${getIdeaTypeStyle(idea.type)}`}>
                                  <IdeaIcon className="w-3 h-3 mr-1" />
                                  {getIdeaTypeText(idea.type)}
                                </span>
                                {getAISuggestionsStatusBadge(idea)}
                                {getNotesBadge(idea)}
                              </div>

                              {/* Date */}
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                                <span className="truncate">
                                  {formatDate(idea.created_at)}
                                </span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Actions menu */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowActionMenu(showActionMenu === idea.id ? null : idea.id);
                                  }}
                                  className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                  disabled={actionLoading === idea.id}
                                >
                                  {actionLoading === idea.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <MoreVertical className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                                
                                {/* Dropdown menu */}
                                {showActionMenu === idea.id && (
                                  <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                                    {/* Generer AI-forslag (kun hvis der ikke er nogen) */}
                                    {(!idea.ai_suggestions || idea.ai_suggestions.length === 0) && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActionMenu(null);
                                            generateSuggestionsForIdea(idea);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                          disabled={suggestionsLoading === idea.id}
                                        >
                                          {suggestionsLoading === idea.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                          ) : (
                                            <Lightbulb className="w-4 h-4" />
                                          )}
                                          {suggestionsLoading === idea.id ? 'Genererer...' : 'Generer AI-forslag'}
                                        </button>
                                        <hr className="my-1 border-gray-100" />
                                      </>
                                    )}
                                    
                                    {/* Rediger titel */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedIdea(idea);
                                        setShowActionMenu(null);
                                        // Flag at titel redigering skal startes når modal åbner
                                        setShouldStartTitleEdit(true);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      disabled={actionLoading === idea.id}
                                    >
                                      <Edit className="w-4 h-4" />
                                      Rediger titel
                                    </button>
                                    
                                    {/* Slet idé */}
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(idea);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      disabled={actionLoading === idea.id}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Slet idé
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Load More */}
            {getFilteredIdeasCount() > displayedIdeas.length && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  className="px-8 h-11"
                  onClick={loadMoreIdeas}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Indlæser..." : "Vis flere idéer"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Idea Modal */}
      {selectedIdea && (
        <Modal 
          isOpen={!!selectedIdea} 
          onClose={() => {
            setSelectedIdea(null);
            setEditingTitle(false);
            setEditedTitle("");
            setShouldStartTitleEdit(false);
            setShowAddToIdea(false);
            setAdditionalThoughts("");
            setEditingContent(false);
            setEditedContent("");
            setActiveTab('content');
            setHiddenSuggestions([]);
            setGeneratingNewSuggestions(false);
            setShowNoteTooltip(null);
            setGeneratingPosts(false);
            setProgressPercentage(0);
            setCompletedPosts(new Set());
            setCompletedHooks(new Set());
          }}
          title={editingTitle ? (
            <div className="flex items-center gap-2 w-full">
              <input
                id="title-input"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveTitleEdit();
                  } else if (e.key === 'Escape') {
                    cancelTitleEdit();
                  }
                }}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                disabled={titleSaving}
                placeholder="Indtast titel..."
              />
              <button
                onClick={saveTitleEdit}
                disabled={titleSaving || !editedTitle.trim()}
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 flex-shrink-0"
                title="Gem titel"
              >
                {titleSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={cancelTitleEdit}
                disabled={titleSaving}
                className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 flex-shrink-0"
                title="Annuller"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (selectedIdea.ai_title || selectedIdea.title || "Idé")}
          showCreatedDate={!showAddToIdea}
          createdDate={formatDate(selectedIdea.created_at)}
          actions={!showAddToIdea ? [
            // Show generate suggestions button if no suggestions exist or if they failed
            ...((selectedIdea.ai_suggestions_status === 'failed' || 
                (!selectedIdea.ai_suggestions || selectedIdea.ai_suggestions.length === 0)) && 
                selectedIdea.ai_suggestions_status !== 'pending' && 
                selectedIdea.ai_suggestions_status !== 'generating' ? [{
              label: suggestionsLoading === selectedIdea.id ? 'Genererer...' : 'Generer AI-forslag',
              onClick: () => generateSuggestionsForIdea(selectedIdea),
              icon: suggestionsLoading === selectedIdea.id ? 
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> :
                <Lightbulb className="w-4 h-4" />,
              disabled: suggestionsLoading === selectedIdea.id
            }] : []),
            {
              label: 'Rediger titel',
              onClick: () => {
                startTitleEdit();
              },
              icon: <Edit className="w-4 h-4" />,
              disabled: false
            },
            {
              label: 'Rediger idé',
              onClick: () => {
                startContentEdit();
              },
              icon: <Edit className="w-4 h-4" />,
              disabled: false
            },
            {
              label: 'Slet idé',
              onClick: () => handleDelete(selectedIdea),
              icon: <Trash2 className="w-4 h-4" />,
              variant: 'danger' as const,
              disabled: actionLoading === selectedIdea.id
            }
          ] : undefined}
          footerActions={!showAddToIdea ? (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAddToIdea(true)}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-sm">Tilføj til idé</span>
              </button>
              <button 
                onClick={generateLinkedInPosts}
                disabled={generatingPosts}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white border border-blue-600 hover:border-blue-700 disabled:border-blue-400 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
              >
                {generatingPosts ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="text-sm">Genererer...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    <span className="text-sm">Generer 3 opslag</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddToIdea(false);
                  setAdditionalThoughts("");
                }}
                className="px-6 py-2"
              >
                Annuller
              </Button>
              <Button 
                onClick={saveAdditionsToIdea}
                disabled={!additionalThoughts.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Gem tilføjelser
              </Button>
            </div>
          )}
        >
          {!showAddToIdea ? (
            <div className="space-y-6">
              {/* Type badge and tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IdeaIcon = getIdeaIcon(selectedIdea.type);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getIdeaTypeStyle(selectedIdea.type)}`}>
                        <IdeaIcon className="w-4 h-4 mr-2" />
                        {getIdeaTypeText(selectedIdea.type)}
                      </span>
                    );
                  })()}
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'content'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Tekst
                  </button>
                  {selectedIdea.ai_suggestions && selectedIdea.ai_suggestions.length > 0 && (
                    <button
                      onClick={() => setActiveTab('ai')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        activeTab === 'ai'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      AI Optimeringer
                    </button>
                  )}
                </div>
              </div>

            {/* Title */}
            {selectedIdea.title && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedIdea.title}</h3>
              </div>
            )}

            {/* Tab Content */}
            <div className="mb-4">
              {activeTab === 'content' ? (
                /* Content Tab */
                editingContent ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Rediger idé:
                    </h4>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-gray-900 placeholder-gray-500"
                      placeholder="Rediger din idé..."
                      disabled={contentSaving}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={cancelContentEdit}
                        disabled={contentSaving}
                        className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
                        title="Annuller"
                      >
                        <X className="w-3 h-3" />
                        Annuller
                      </button>
                      <button
                        onClick={saveContentEdit}
                        disabled={contentSaving || !editedContent.trim()}
                        className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
                        title="Gem ændringer"
                      >
                        {contentSaving ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Gem
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedIdea.type === 'voice' && selectedIdea.transcribed_text ? (
                      <div className="space-y-3">
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                          {selectedIdea.transcribed_text}
                        </p>
                        {selectedIdea.original_audio_url && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Original optagelse:</h4>
                            <audio controls className="w-full">
                              <source src={selectedIdea.original_audio_url} type="audio/webm" />
                              Din browser understøtter ikke audio afspilning.
                            </audio>
                          </div>
                        )}
                      </div>
                    ) : selectedIdea.type === 'image' && selectedIdea.image_url ? (
                      <div className="space-y-3">
                        <img 
                          src={selectedIdea.image_url} 
                          alt="Idé billede"
                          className="w-full rounded-lg shadow-sm border border-gray-200"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                        {selectedIdea.content && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Beskrivelse:</h4>
                            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {selectedIdea.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {selectedIdea.content}
                      </p>
                    )}
                  </>
                )
              ) : (
                /* AI Optimizations Tab */
                (() => {
                  const status = selectedIdea.ai_suggestions_status;
                  
                  if (status === 'completed' && selectedIdea.ai_suggestions && selectedIdea.ai_suggestions.length > 0) {
                    return (
                      <div className="space-y-3">
                        {selectedIdea.ai_suggestions.map((suggestion, index) => {
                          const isHidden = hiddenSuggestions.includes(index);
                          const suggestionNumber = index + 1;
                          
                          if (isHidden) {
                            // Minimized view
                            const isSaved = isNoteSaved(index);
                            return (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-sm">
                                    Forslag {suggestionNumber} (skjult)
                                  </span>
                                  {isSaved && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                      Gemt som note
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleSuggestion(index)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Vis forslag"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          } else {
                            // Full view
                            const isSaved = isNoteSaved(index);
                            return (
                              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                  <div className="flex items-center gap-1 relative">
                                    <button
                                      onClick={() => setShowNoteTooltip(showNoteTooltip === index ? null : index)}
                                      className="note-info-button p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                    >
                                      <Info className="w-3 h-3" />
                                    </button>
                                    {showNoteTooltip === index && (
                                      <div className="note-tooltip absolute top-6 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                                        <div className="text-sm text-gray-700 leading-relaxed">
                                          <p className="font-medium text-gray-900 mb-1">Hvad er noter?</p>
                                          <p className="mb-2">
                                            Noter er handlingsforslag eller tanker du kan bruge når du poster. 
                                            F.eks. hashtags at bruge, tidspunkter at poste, eller andre aktiviteter der kan supplere dit opslag.
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            Noter bliver vedhæftet dit endelige opslag som reference, men kommer ikke med i selve opslaget.
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => setShowNoteTooltip(null)}
                                          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => toggleNote(index)}
                                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                        isSaved 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      }`}
                                    >
                                      {isSaved ? 'Gemt som note' : 'Gem som note'}
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => toggleSuggestion(index)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                                    title="Minimér forslag"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <h5 className="font-medium text-blue-900 mb-2 pr-32">Forslag {suggestionNumber}</h5>
                                <p className="text-blue-700 text-sm leading-relaxed">{suggestion.description}</p>
                              </div>
                            );
                          }
                        })}
                        
                        {/* Generate new suggestions button */}
                        <div className="pt-3 border-t border-gray-100">
                          <button
                            onClick={generateNewSuggestions}
                            disabled={generatingNewSuggestions}
                            className="w-full px-4 py-2.5 bg-white hover:bg-gray-50 disabled:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                          >
                            {generatingNewSuggestions ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                <span className="text-sm">Genererer nye forslag...</span>
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Generer nye AI-forslag</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  if (status === 'pending' || status === 'generating') {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                          <h4 className="font-medium text-yellow-900">AI Optimeringer genereres...</h4>
                        </div>
                        <p className="text-yellow-800 text-sm">
                          AI&apos;en arbejder på at generere optimeringer til din idé. Dette tager normalt 5-10 sekunder.
                        </p>
                      </div>
                    );
                  }
                  
                  if (status === 'failed') {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Lightbulb className="w-4 h-4 mr-2 text-red-600" />
                          <h4 className="font-medium text-red-900">AI Optimeringer</h4>
                        </div>
                        <p className="text-red-800 text-sm">
                          Der opstod en fejl ved generering af optimeringer. Prøv at generere dem igen.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        Ingen AI optimeringer tilgængelige for denne idé.
                      </p>
                    </div>
                  );
                })()
              )}
            </div>

            </div>
          ) : (
            /* Add to Idea Page */
            <div className="space-y-6">
              {/* AI Suggestions at top */}
              {selectedIdea.ai_suggestions && selectedIdea.ai_suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
                    AI Optimeringer
                  </h4>
                  <div className="space-y-3">
                    {selectedIdea.ai_suggestions
                      .map((suggestion, index) => ({ suggestion, originalIndex: index }))
                      .filter(({ originalIndex }) => !hiddenSuggestions.includes(originalIndex))
                      .map(({ suggestion, originalIndex }) => (
                        <div key={originalIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">Forslag {originalIndex + 1}</h5>
                          <p className="text-blue-800 text-sm leading-relaxed">{suggestion.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Textarea for additional thoughts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="additional-thoughts" className="block text-sm font-medium text-gray-700">
                    Tilføj dine tanker
                  </label>
                  <VoiceRecorder 
                    onTranscription={(text) => {
                      if (additionalThoughts.trim()) {
                        setAdditionalThoughts(additionalThoughts + '\n\n' + text);
                      } else {
                        setAdditionalThoughts(text);
                      }
                    }}
                    className="text-xs px-3 py-1"
                  />
                </div>
                <textarea
                  id="additional-thoughts"
                  value={additionalThoughts}
                  onChange={(e) => setAdditionalThoughts(e.target.value)}
                  placeholder="Tilføj dine tanker eller refleksioner baseret på AI-forslagene, eller bare yderligere idéer og overvejelser til din idé..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300 resize-none text-[15px] text-gray-900 placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dine tilføjelser vil blive tilføjet til den oprindelige idé med linjeskift.
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Progress Modal */}
      <Modal 
        isOpen={showProgressModal} 
        onClose={() => {}} 
        className="max-w-md"
        title="Genererer 3 opslag"
        showCreatedDate={false}
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              AI&apos;en arbejder på at skabe 3 fængende opslag med forskellige vinkler baseret på din idé.
            </p>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{progressPercentage}% færdig</p>
          </div>

          <div className="space-y-2 text-left">
            {['jordnær', 'professionel', 'storytelling'].map((angle) => (
              <div key={angle} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-700">{angle} vinkel:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium w-[80px] flex items-center justify-center ${
                    completedPosts.has(angle) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className="mr-1">Opslag</span>
                    <span className="w-3 text-center">{completedPosts.has(angle) ? '✓' : '...'}</span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-medium w-[68px] flex items-center justify-center ${
                    completedHooks.has(angle) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className="mr-1">Hook</span>
                    <span className="w-3 text-center">{completedHooks.has(angle) ? '✓' : '...'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Generated Posts Modal */}
      <Modal 
        isOpen={showPostsModal} 
        onClose={() => {
          setShowPostsModal(false);
          setGeneratedPosts([]);
          setActivePostTab(0);
          setActiveHookIndex({});
          setProgressPercentage(0);
          setCompletedPosts(new Set());
          setCompletedHooks(new Set());
        }}
        className="max-w-3xl h-[70vh]"
        title="3 Genererede LinkedIn Opslag"
        showCreatedDate={false}
      >
        {generatedPosts.length > 0 && (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex justify-center sm:justify-start border-b border-gray-200">
              {generatedPosts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => setActivePostTab(index)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activePostTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {post.angle === 'jordnær' ? 'Jordnær' : 
                   post.angle === 'professionel' ? 'Professionel' : 'Storytelling'}
                </button>
              ))}
            </div>

            {/* Hook Variant Navigation - Fixed at top */}
            {generatedPosts[activePostTab].hooks && generatedPosts[activePostTab].hooks!.length > 0 && (
              <div className="flex justify-end mb-4 mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600 font-medium">
                    Hook variant {(activeHookIndex[activePostTab] || 0) + 1} ud af {generatedPosts[activePostTab].hooks!.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => navigateHook('prev')}
                      className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                      disabled={generatedPosts[activePostTab].hooks!.length <= 1}
                    >
                      <ChevronLeft className="w-3 h-3 text-blue-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateHook('next')}
                      className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                      disabled={generatedPosts[activePostTab].hooks!.length <= 1}
                    >
                      <ChevronRight className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              {generatedPosts[activePostTab].hooks && generatedPosts[activePostTab].hooks!.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <p className="text-blue-900 font-medium text-sm mb-3">🪝 Scroll-stopping hook:</p>
                  <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-semibold">
                    {generatedPosts[activePostTab].hooks![(activeHookIndex[activePostTab] || 0)]}
                  </p>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {generatedPosts[activePostTab].content}
                </p>
              </div>
            </div>
            
            {/* Fixed CTA at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSelectVersion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Vælg denne version
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
