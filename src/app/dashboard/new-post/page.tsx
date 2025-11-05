"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import VoiceRecorder from "@/components/VoiceRecorder";
import { PlusCircle, Image, CheckCircle, AlertCircle, Calendar, Edit, FileEdit, Send, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';

export default function NewPostPage() {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [returnTo, setReturnTo] = useState<string>('mine-opslag');
  const [editPostStatus, setEditPostStatus] = useState<string | null>(null);
  
  // Hook states
  const [hooks, setHooks] = useState<string[]>([]);
  const [activeHookIndex, setActiveHookIndex] = useState(0);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  
  // Posts generation states
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Array<{id: number, angle: string, title: string, content: string, hooks?: string[]}>>([]);
  const [activePostTab, setActivePostTab] = useState(0);
  const [activePostHookIndex, setActivePostHookIndex] = useState<{[key: number]: number}>({});
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedPosts, setCompletedPosts] = useState<Set<string>>(new Set());
  const [completedHooks, setCompletedHooks] = useState<Set<string>>(new Set());

  // Funktion til at få den korrekte return URL
  const getReturnUrl = () => {
    switch (returnTo) {
      case 'content-plan':
        return '/dashboard/content-plan';
      case 'mine-opslag':
        return '/dashboard/mine-opslag';
      default:
        return '/dashboard/mine-opslag';
    }
  };

  // Pre-udfyld formularen hvis vi er i edit mode
  useEffect(() => {
    const isEdit = searchParams.get('edit') === 'true';
    const postId = searchParams.get('postId');
    const postText = searchParams.get('text');
    const postVisibility = searchParams.get('visibility');
    const postScheduledDate = searchParams.get('scheduledDate');
    const postScheduledTime = searchParams.get('scheduledTime');
    const returnToParam = searchParams.get('returnTo');
    const postStatus = searchParams.get('status');

    // Sæt returnTo baseret på parameter eller default
    if (returnToParam) {
      setReturnTo(returnToParam);
    }

    if (isEdit && postId && postText) {
      setIsEditMode(true);
      setEditPostId(postId);
      setText(decodeURIComponent(postText));
      
      if (postVisibility === 'CONNECTIONS' || postVisibility === 'PUBLIC') {
        setVisibility(postVisibility);
      }
      
      if (postStatus) {
        setEditPostStatus(postStatus);
      }
      
      if (postScheduledDate && postScheduledTime) {
        setScheduledDate(postScheduledDate);
        setScheduledTime(postScheduledTime);
      }
      
      // Håndter eksisterende billeder
      const existingImages: string[] = [];
      
      // Læs alle imageUrl parametre (imageUrl0, imageUrl1, osv.)
      for (let i = 0; i < 9; i++) { // Maks 9 billeder
        const imageUrlParam = searchParams.get(`imageUrl${i}`);
        if (imageUrlParam) {
          existingImages.push(decodeURIComponent(imageUrlParam));
        }
      }
      
      // Alle billeder håndteres nu via imageUrl0, imageUrl1, osv. parametre
      
      setExistingImageUrls(existingImages);
    }
  }, [searchParams]);

  // Tjek for valgt post content og hooks fra idebank
  useEffect(() => {
    const selectedContent = localStorage.getItem('selectedPostContent');
    const selectedHooks = localStorage.getItem('selectedPostHooks');
    const selectedHookIndex = localStorage.getItem('selectedHookIndex');
    
    if (selectedContent) {
      // Split hook og content hvis der er en hook
      const parts = selectedContent.split('\n\n');
      if (parts.length > 1 && selectedHooks) {
        // Der er både hook og content
        setText(parts.slice(1).join('\n\n')); // Alt efter første del
      } else {
        // Kun content
        setText(selectedContent);
      }
      localStorage.removeItem('selectedPostContent');
    }
    
    if (selectedHooks) {
      try {
        const hooksArray = JSON.parse(selectedHooks);
        setHooks(hooksArray);
        if (selectedHookIndex) {
          setActiveHookIndex(parseInt(selectedHookIndex));
        }
      } catch (error) {
        console.error('Error parsing selected hooks:', error);
      }
      localStorage.removeItem('selectedPostHooks');
      localStorage.removeItem('selectedHookIndex');
    }
  }, []);

  // Navigation mellem hooks
  const navigateHook = (direction: 'prev' | 'next') => {
    if (hooks.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = activeHookIndex > 0 ? activeHookIndex - 1 : hooks.length - 1;
    } else {
      newIndex = activeHookIndex < hooks.length - 1 ? activeHookIndex + 1 : 0;
    }
    
    setActiveHookIndex(newIndex);
  };

  // Generer hooks baseret på opslag-tekst
  const generateHooks = async () => {
    if (!text.trim()) {
      Swal.fire({
        title: '📝 Ingen tekst',
        text: 'Skriv dit opslag først, så kan jeg generere hooks til det.',
        icon: undefined,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
        },
        buttonsStyling: false
      });
      return;
    }

    setGeneratingHooks(true);
    
    try {
      // Vi bruger 'professionel' som default angle for hooks genereret direkte fra opslag
      const response = await fetch('/api/generate-hook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          angle: 'professionel'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate hooks');
      }

      const result = await response.json();
      if (result.hooks && result.hooks.length > 0) {
        setHooks(result.hooks);
        setActiveHookIndex(0);
        
        Swal.fire({
          title: '🪝 Hooks genereret!',
          text: `Jeg har lavet ${result.hooks.length} forskellige hooks til dit opslag. Du kan navigere mellem dem med pilene.`,
          icon: undefined,
          confirmButtonText: 'Fedt!',
          customClass: {
            popup: 'rounded-xl',
            title: 'text-lg font-semibold text-gray-900',
            htmlContainer: 'text-gray-700',
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
          },
          buttonsStyling: false
        });
      } else {
        throw new Error('No hooks returned');
      }
    } catch (error) {
      console.error('Error generating hooks:', error);
      Swal.fire({
        title: '❌ Fejl',
        text: 'Der skete en fejl ved generering af hooks. Prøv igen.',
        icon: undefined,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium'
        },
        buttonsStyling: false
      });
    } finally {
      setGeneratingHooks(false);
    }
  };

  // Få den komplette tekst (hook + opslag)
  const getCompleteText = () => {
    if (hooks.length > 0 && hooks[activeHookIndex]) {
      return hooks[activeHookIndex] + '\n\n' + text;
    }
    return text;
  };

  // Navigation mellem posts hooks
  const navigatePostHook = (direction: 'prev' | 'next') => {
    const currentPost = generatedPosts[activePostTab];
    if (!currentPost?.hooks || currentPost.hooks.length === 0) return;
    
    const currentIndex = activePostHookIndex[activePostTab] || 0;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentPost.hooks.length - 1;
    } else {
      newIndex = currentIndex < currentPost.hooks.length - 1 ? currentIndex + 1 : 0;
    }
    
    setActivePostHookIndex(prev => ({
      ...prev,
      [activePostTab]: newIndex
    }));
  };

  // Generer 3 LinkedIn opslag baseret på textarea tekst
  const generateLinkedInPosts = async () => {
    if (!text.trim()) {
      Swal.fire({
        title: '📝 Ingen tekst',
        text: 'Skriv dit opslag først, så kan jeg generere 3 versioner til dig.',
        icon: undefined,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium'
        },
        buttonsStyling: false
      });
      return;
    }
    
    // Vis progress modal
    setShowProgressModal(true);
    setGeneratingPosts(true);
    setProgressPercentage(0);
    setCompletedPosts(new Set());
    setCompletedHooks(new Set());
    setGeneratedPosts([]);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgressPercentage(prev => {
          const newProgress = prev + 8;
          return newProgress >= 85 ? 85 : newProgress;
        });
      }, 1000);

      // Create 3 parallel API calls
      const angles: Array<{id: number, angle: 'jordnær' | 'professionel' | 'storytelling'}> = [
        {id: 1, angle: 'jordnær'},
        {id: 2, angle: 'professionel'}, 
        {id: 3, angle: 'storytelling'}
      ];
      
      const shouldGenerateHooks = hooks.length === 0; // Kun generer hooks hvis ingen eksisterer

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
              content: text,
              type: 'text',
              angle: angle
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate ${angle} post`);
          }

          const result = await response.json();
          const post = {...result.post, id};
          
          console.log(`✅ Post ${id} (${angle}) generated`);
          
          // Update completed posts
          setCompletedPosts(prev => new Set([...prev, angle]));
          
          // Generate hooks if needed
          if (shouldGenerateHooks) {
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
          }
          
          return post;
        } catch (error) {
          console.error(`Error generating ${angle} post:`, error);
          throw error;
        }
      });

      // Wait for all posts to complete
      const posts = await Promise.all(postPromises);
      posts.sort((a, b) => a.id - b.id);
      
      clearInterval(progressInterval);
      setProgressPercentage(100);
      
      setTimeout(() => {
        setGeneratedPosts(posts);
        setActivePostTab(0);
        setActivePostHookIndex({});
        setShowProgressModal(false);
        setShowPostsModal(true);
      }, 500);
      
    } catch (error) {
      console.error('Error generating posts:', error);
      setShowProgressModal(false);
      Swal.fire({
        title: '❌ Fejl',
        text: 'Der skete en fejl ved generering af opslag. Prøv igen.',
        icon: undefined,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-gray-700',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium'
        },
        buttonsStyling: false
      });
    } finally {
      setGeneratingPosts(false);
    }
  };

  // Håndter valg af opslag version (erstatter tekst på samme side)
  const handleSelectPostVersion = () => {
    const selectedPost = generatedPosts[activePostTab];
    if (!selectedPost) return;
    
    // Erstatter tekst i textarea
    setText(selectedPost.content);
    
    // Hvis der blev genereret hooks og der ikke var hooks i forvejen
    if (selectedPost.hooks && selectedPost.hooks.length > 0 && hooks.length === 0) {
      setHooks(selectedPost.hooks);
      // Husk den valgte hook index fra modalen
      const selectedHookIndex = activePostHookIndex[activePostTab] || 0;
      setActiveHookIndex(selectedHookIndex);
    }
    
    // Luk modal og reset states
    setShowPostsModal(false);
    setGeneratedPosts([]);
    setActivePostTab(0);
    setActivePostHookIndex({});
    setProgressPercentage(0);
    setCompletedPosts(new Set());
    setCompletedHooks(new Set());
    
    Swal.fire({
      title: '✅ Opslag valgt!',
      text: 'Den valgte opslagsversion er nu indsat i tekstfeltet.',
      icon: undefined,
      confirmButtonText: 'Fedt!',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-lg font-semibold text-gray-900',
        htmlContainer: 'text-gray-700',
        confirmButton: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium'
      },
      buttonsStyling: false
    });
  };

  async function onSubmit(e: React.FormEvent, publishType?: "now" | "schedule" | "draft") {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Forskellige beskeder baseret på edit mode og publish type
    if (isEditMode && !publishType) {
      setStatus("Gemmer ændringer...");
    } else if (publishType === "schedule") {
      setStatus("Gemmer opslag og planlægger udgivelse...");
    } else if (publishType === "draft") {
      setStatus("Gemmer opslag som kladde...");
    } else if (publishType === "now") {
      setStatus("Sender til LinkedIn...");
    } else if (isEditMode) {
      setStatus("Gemmer ændringer...");
    } else {
      setStatus("Sender til LinkedIn...");
    }

    const fd = new FormData();
    fd.append("text", getCompleteText());
    fd.append("visibility", visibility);
    
    // Hvis vi er i edit mode, brug update endpoint
    if (isEditMode && editPostId) {
      fd.append("postId", editPostId);
      
      // Hvis vi eksplicit ændrer status fra draft til published eller scheduled
      if (editPostStatus === 'draft' && publishType) {
        if (publishType === 'now') {
          fd.append("newStatus", "published");
        } else if (publishType === 'schedule') {
          fd.append("newStatus", "scheduled");
        }
        // Hvis publishType === 'draft' eller ikke angivet, ændres status ikke
      }
      
      // Hvis der er en planlagt tid, inkluder den
      if (scheduledDate && scheduledTime) {
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
        fd.append("scheduledFor", scheduledDateTime);
      }
      
      // Håndter billede ændringer - send de billede URLs der skal beholdes
      existingImageUrls.forEach((imageUrl, index) => {
        fd.append(`keepImageUrl${index}`, imageUrl);
      });
      
      // Tilføj nye billeder hvis der er nogle
      if (files.length > 0) {
        files.forEach((file, index) => {
          fd.append(`image${index}`, file);
        });
      }
      
      try {
        const res = await fetch("/api/linkedin/update-post", { method: "POST", body: fd });
        const body = await res.json();
        
        if (!res.ok) {
          setStatus(`Fejl: ${body?.error || res.statusText}`);
        } else {
          const returnUrl = getReturnUrl();
          const returnPageName = returnTo === 'content-plan' ? 'Content Plan' : 'Mine Opslag';
          setStatus(`Ændringer gemt! Sender dig tilbage til ${returnPageName}...`);
          
          // Naviger tilbage til den korrekte side efter 2 sekunder
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 2000);
        }
      } catch (error) {
        console.error('Network error:', error);
        setStatus("Der skete en netværksfejl. Prøv igen.");
      } finally {
        setIsSubmitting(false);
        setTimeout(() => setStatus(null), 5000);
      }
      return;
    }
    
    // Normal oprettelse af nyt opslag
    fd.append("publishType", publishType || "now");
    
    if (publishType === "schedule" && scheduledDate && scheduledTime) {
      // Send den lokale tid direkte uden timezone konvertering
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      fd.append("scheduledFor", scheduledDateTime);
    }
    
    if (files.length > 0) {
      // Send alle billeder - backend kan håndtere flere
      files.forEach((file, index) => {
        fd.append(`image${index}`, file);
      });
    }

    try {
      const res = await fetch("/api/linkedin/post", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) {
        setStatus(`Fejl: ${body?.error || res.statusText}`);
      } else {
        if (publishType === "draft") {
          // Kladde gemt
          await Swal.fire({
            title: 'Kladde gemt!',
            text: 'Dit opslag er gemt som en kladde. Du kan redigere og udgive det senere.',
            icon: 'success',
            timer: 3000,
            timerProgressBar: false,
            toast: true,
            showClass: {
              popup: 'swal2-toast-fade-in'
            },
            hideClass: {
              popup: 'swal2-toast-fade-out'
            },
            position: 'top-end',
            showConfirmButton: false
          });
          
          // Naviger tilbage til Mine Opslag efter kort pause
          setTimeout(() => {
            window.location.href = "/dashboard/mine-opslag";
          }, 1000);
        } else if (publishType === "schedule") {
          let statusMessage = "";
          
          // Vis information om billede upload status
          if (body?.imageCount > 0) {
            const uploadedCount = body?.imageUploadResults?.filter((r: any) => r.uploadStatus === 'uploaded').length || 0;
            const failedCount = body?.imageUploadResults?.filter((r: any) => r.uploadStatus === 'failed').length || 0;
            
            if (uploadedCount > 0) {
              statusMessage += `📸 ${uploadedCount} billede${uploadedCount > 1 ? 'r' : ''} uploadet til LinkedIn. `;
            }
            if (failedCount > 0) {
              statusMessage += `⚠️ ${failedCount} billede${failedCount > 1 ? 'r' : ''} upload fejlede. `;
            }
          }
          
          if (body?.scheduledFor) {
            try {
              // body.scheduledFor er nu UTC tid, konverter til lokal tid for visning
              const scheduledDate = new Date(body.scheduledFor);
              if (isNaN(scheduledDate.getTime())) {
                throw new Error('Invalid date');
              }
              const localDateStr = scheduledDate.toLocaleDateString('da-DK');
              const localTimeStr = scheduledDate.toLocaleTimeString('da-DK', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              statusMessage += `Planlagt til udgivelse: ${localDateStr} kl. ${localTimeStr}`;
            } catch (dateError) {
              console.error('Error parsing scheduled date:', dateError);
              statusMessage += `Opslag planlagt! 📅`;
            }
          } else {
            statusMessage += `Opslag planlagt! 📅`;
          }
          
          setStatus(statusMessage);
        } else {
          // Øjeblikkelig udgivelse
          let successText = 'Dit LinkedIn opslag er blevet udgivet med det samme.';
          
          // Tilføj information om billeder hvis der er nogle
          if (body?.imageCount > 0) {
            const uploadedCount = body?.imageUploadResults?.filter((r: any) => r.uploadStatus === 'uploaded').length || 0;
            if (uploadedCount > 0) {
              successText += ` Inkluderer ${uploadedCount} billede${uploadedCount > 1 ? 'r' : ''}.`;
            }
          }
          
          await Swal.fire({
            title: 'Opslag udgivet!',
            text: successText,
            icon: 'success',
            timer: 3000,
            timerProgressBar: false,
            toast: true,
            showClass: {
              popup: 'swal2-toast-fade-in'
            },
            hideClass: {
              popup: 'swal2-toast-fade-out'
            },
            position: 'top-end',
            showConfirmButton: false
          });
          
          // Naviger tilbage til den korrekte side efter kort pause
          setTimeout(() => {
            // Hvis vi er i edit mode, brug returnTo, ellers gå til mine-opslag
            const targetUrl = isEditMode ? getReturnUrl() : "/dashboard/mine-opslag";
            window.location.href = targetUrl;
          }, 1000);
        }
        // Reset form on success
        setText("");
        setFiles([]);
        setScheduledDate("");
        setScheduledTime("");
        setShowScheduleModal(false);
      }
    } catch (error) {
      console.error('Network error:', error);
      setStatus("Der skete en netværksfejl. Prøv igen.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  async function handleScheduleSubmit() {
    if (!scheduledDate || !scheduledTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Manglende information',
        text: 'Vælg venligst både dato og tidspunkt',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
    
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ugyldig dato',
        text: 'Planlagt tidspunkt skal være i fremtiden',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
    
    onSubmit(new Event('submit') as any, "schedule");
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles).filter(file => {
      return file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // 10MB limit
    });
    
    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      const maxNewFiles = 9 - existingImageUrls.length; // Tager højde for eksisterende billeder
      return combined.slice(0, maxNewFiles);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Rediger Opslag' : 'Nyt Opslag'}
        </h1>
        <p className="text-lg text-gray-600">
          {isEditMode 
            ? 'Rediger dit LinkedIn-opslag og gem ændringerne.' 
            : 'Opret og udgiv indhold på din LinkedIn-profil.'
          }
        </p>
      </div>

      <div className="max-w-4xl">
        {/* Status Messages */}
        {status && (
          <Card className={`p-6 mb-6 ${
            status.includes("Fejl") || status.includes("fejl")
              ? "bg-gradient-to-r from-red-50 to-red-50 border-red-200"
              : status.includes("Udgivet")
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              : status.includes("planlagt") || status.includes("Planlagt")
              ? "bg-gradient-to-r from-purple-50 to-purple-50 border-purple-200"
              : status.includes("kladde") || status.includes("Kladde")
              ? "bg-gradient-to-r from-gray-50 to-gray-50 border-gray-200"
              : "bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200"
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                status.includes("Fejl") || status.includes("fejl")
                  ? "bg-red-600"
                  : status.includes("Udgivet")
                  ? "bg-green-600"
                  : status.includes("planlagt") || status.includes("Planlagt")
                  ? "bg-purple-600"
                  : status.includes("kladde") || status.includes("Kladde")
                  ? "bg-gray-600"
                  : "bg-blue-600"
              }`}>
                {status.includes("Fejl") || status.includes("fejl") ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : status.includes("Udgivet") ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : status.includes("planlagt") || status.includes("Planlagt") ? (
                  <Calendar className="w-6 h-6 text-white" />
                ) : status.includes("kladde") || status.includes("Kladde") ? (
                  <FileEdit className="w-6 h-6 text-white" />
                ) : (
                  <PlusCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {status.includes("Fejl") || status.includes("fejl")
                    ? "Fejl ved udgivelse"
                    : status.includes("Udgivet")
                    ? "Opslag udgivet! 🎉"
                    : status.includes("planlagt") || status.includes("Planlagt")
                    ? "Opslag planlagt! 📅"
                    : status.includes("kladde") || status.includes("Kladde")
                    ? "Kladde gemt! 📝"
                    : status.includes("Gemmer") || status.includes("planlægger")
                    ? "Planlægger opslag..."
                    : status.includes("Ændringer gemt") || status.includes("ændringer")
                    ? "Ændringer gemt! ✅"
                    : isEditMode
                    ? "Gemmer ændringer..."
                    : "Udgiver opslag..."
                  }
                </h3>
                <p className="text-gray-700 mt-1">{status}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Post Creation Card */}
        <Card className="p-8 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            {isEditMode ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <PlusCircle className="h-6 w-6 text-blue-600" />
            )}
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Rediger LinkedIn Opslag' : 'Opret LinkedIn Opslag'}
            </h3>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Hook Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-base font-medium text-gray-700">
                  🪝 Scroll-stopping hook (valgfrit)
                </label>
                <button
                  type="button"
                  onClick={generateHooks}
                  disabled={generatingHooks || !text.trim()}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingHooks ? 'Genererer...' : 'Generer 3 hooks'}
                </button>
              </div>
              
              {hooks.length > 0 ? (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-blue-900 font-medium text-sm">🪝 Scroll-stopping hook:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium">
                        Hook variant {activeHookIndex + 1} ud af {hooks.length}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => navigateHook('prev')}
                          className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          disabled={hooks.length <= 1}
                        >
                          <ChevronLeft className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateHook('next')}
                          className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          disabled={hooks.length <= 1}
                        >
                          <ChevronRight className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-semibold">
                    {hooks[activeHookIndex]}
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 text-sm">
                    Skriv dit opslag nedenfor, så kan du efterfølgende generere 3 fængende hooks til det. 
                    En hook er de første 1-2 linjer, der får folk til at stoppe scroll og læse videre.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2">
                {/* Mobile layout - vertical stacking */}
                <div className="sm:hidden">
                  <label htmlFor="text" className="block text-base font-medium text-gray-700 mb-2">
                    Opslag tekst
                  </label>
                  <div className="flex justify-end mb-2">
                    <VoiceRecorder 
                      onTranscription={(transcribedText) => setText(transcribedText)}
                    />
                  </div>
                </div>

                {/* Desktop layout - side by side */}
                <div className="hidden sm:flex sm:items-center sm:justify-between mb-2">
                  <label htmlFor="text" className="block text-base font-medium text-gray-700">
                    Opslag tekst
                  </label>
                  <VoiceRecorder 
                    onTranscription={(transcribedText) => setText(transcribedText)}
                  />
                </div>
              </div>
              <textarea
                id="text"
                className="w-full border-2 border-gray-200 rounded-2xl p-4 min-h-[240px] text-base text-gray-900 resize-y focus:border-gray-200 focus:outline-none focus:ring-0 focus:shadow-none transition-colors"
                placeholder="Skriv dit opslag her... Del dine tanker, opdateringer eller indsigter med dit LinkedIn-netværk."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  Tip: Brug hashtags og tag relevante personer for at øge rækkevidden.
                </p>
                <button
                  type="button"
                  onClick={generateLinkedInPosts}
                  disabled={generatingPosts || !text.trim()}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingPosts ? 'Genererer...' : 'Generer 3 opslag'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Billeder (valgfrit - maks 9)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : files.length > 0
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={isSubmitting || (files.length + existingImageUrls.length) >= 9}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
{(files.length === 0 && existingImageUrls.length === 0) ? (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Træk billeder hertil eller klik for at vælge
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, GIF op til 10MB hver. Maks 9 billeder.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {/* Vis eksisterende billeder først */}
                      {existingImageUrls.map((imageUrl, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square">
                          <img
                            src={imageUrl}
                            alt={`Eksisterende billede ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Nuværende
                          </div>
                        </div>
                      ))}
                      
                      {/* Vis nye billeder */}
                      {files.map((file, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Nyt billede ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Nyt
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Vis info om billeder */}
                    <div className="text-sm text-gray-500 text-center">
                      {existingImageUrls.length > 0 && files.length === 0 && (
                        <p>{existingImageUrls.length} nuværende billede{existingImageUrls.length > 1 ? 'r' : ''} - klik × for at fjerne eller tilføj nye billeder</p>
                      )}
                      {existingImageUrls.length > 0 && files.length > 0 && (
                        <p>{existingImageUrls.length} nuværende + {files.length} nye billeder</p>
                      )}
                      {existingImageUrls.length === 0 && files.length > 0 && (
                        <p>Klik eller træk flere billeder for at tilføje ({files.length}/9)</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Hvem kan se dit opslag?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility("PUBLIC")}
                  disabled={isSubmitting}
                  className={`p-4 border-2 rounded-2xl text-left transition-colors ${
                    visibility === "PUBLIC"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Offentligt</div>
                  <div className="text-sm text-gray-500 mt-1">Alle på LinkedIn kan se dit opslag</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setVisibility("CONNECTIONS")}
                  disabled={isSubmitting}
                  className={`p-4 border-2 rounded-2xl text-left transition-colors ${
                    visibility === "CONNECTIONS"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Kun forbindelser</div>
                  <div className="text-sm text-gray-500 mt-1">Kun dine LinkedIn-forbindelser kan se opslaget</div>
                </button>
              </div>
            </div>


            <div className="pt-4 flex flex-wrap gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || !text.trim()} 
                className="px-8 h-11 bg-blue-600 hover:bg-blue-700"
              >
                {isEditMode ? (
                  <Edit className="w-4 h-4" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                {isSubmitting 
                  ? (isEditMode ? "Gemmer..." : "Udgiver...") 
                  : (isEditMode ? "Gem ændringer" : "Udgiv nu")
                }
              </Button>
              
              {!isEditMode && (
                <>
                  <Button 
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    disabled={isSubmitting || !text.trim()} 
                    variant="outline"
                    className="px-8 h-11 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Calendar className="w-4 h-4" />
                    Planlæg
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={(e) => onSubmit(e, "draft")}
                    disabled={isSubmitting || !text.trim()} 
                    variant="outline"
                    className="px-8 h-11 border-gray-600 text-gray-600 hover:bg-gray-50"
                  >
                    <FileEdit className="w-4 h-4" />
                    Gem som kladde
                  </Button>
                </>
              )}
              
              {isEditMode && scheduledDate && scheduledTime && (
                <Button 
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  disabled={isSubmitting || !text.trim()} 
                  variant="outline"
                  className="px-8 h-11 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Calendar className="w-4 h-4" />
                  Ændre planlagt tid
                </Button>
              )}
              
              {/* Ekstra muligheder for kladder i edit mode */}
              {isEditMode && editPostStatus === 'draft' && (
                <>
                  <Button 
                    type="button"
                    onClick={(e) => onSubmit(e, "now")}
                    disabled={isSubmitting || !text.trim()} 
                    variant="outline"
                    className="px-8 h-11 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Send className="w-4 h-4" />
                    Udgiv nu
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    disabled={isSubmitting || !text.trim()} 
                    variant="outline"
                    className="px-8 h-11 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Calendar className="w-4 h-4" />
                    Planlæg opslag
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>

      </div>

      {/* Schedule Modal */}
      <Modal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)}
        title="Planlæg opslag"
        className="max-w-lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Vælg hvornår dit opslag skal udgives på LinkedIn.
          </p>
          
          <DateTimePicker
            selectedDate={scheduledDate}
            selectedTime={scheduledTime}
            onDateChange={setScheduledDate}
            onTimeChange={setScheduledTime}
            minDate={new Date().toISOString().split('T')[0]}
          />
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleScheduleSubmit}
              disabled={!scheduledDate || !scheduledTime || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="w-4 h-4" />
              {isSubmitting ? "Planlægger..." : "Planlæg opslag"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
              disabled={isSubmitting}
              className="px-6"
            >
              Annuller
            </Button>
          </div>
        </div>
      </Modal>

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
              AI&apos;en arbejder på at skabe 3 fængende opslag med forskellige vinkler baseret på din tekst.
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
                  <span className={`text-xs px-2 py-1 rounded ${
                    completedPosts.has(angle) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    Opslag {completedPosts.has(angle) ? '✓' : '...'}
                  </span>
                  {hooks.length === 0 && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      completedHooks.has(angle) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Hook {completedHooks.has(angle) ? '✓' : '...'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Posts Modal */}
      <Modal 
        isOpen={showPostsModal} 
        onClose={() => {
          setShowPostsModal(false);
          setGeneratedPosts([]);
          setActivePostTab(0);
          setActivePostHookIndex({});
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
            <div className="flex border-b border-gray-200 -mx-6 px-6">
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

            {/* Content */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex-1 min-h-0 overflow-hidden flex flex-col mt-6 -mx-6 mx-0">
                <div className="flex-1 overflow-y-auto pr-2 min-h-[200px]">
                  <div className="prose prose-sm max-w-none">
                    {generatedPosts[activePostTab].hooks && generatedPosts[activePostTab].hooks!.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-blue-900 font-medium text-sm">🪝 Scroll-stopping hook:</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-medium">
                              Hook variant {(activePostHookIndex[activePostTab] || 0) + 1} ud af {generatedPosts[activePostTab].hooks!.length}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => navigatePostHook('prev')}
                                className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                disabled={generatedPosts[activePostTab].hooks!.length <= 1}
                              >
                                <ChevronLeft className="w-3 h-3 text-blue-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigatePostHook('next')}
                                className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                disabled={generatedPosts[activePostTab].hooks!.length <= 1}
                              >
                                <ChevronRight className="w-3 h-3 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-semibold">
                          {generatedPosts[activePostTab].hooks![(activePostHookIndex[activePostTab] || 0)]}
                        </p>
                      </div>
                    )}
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {generatedPosts[activePostTab].content}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSelectPostVersion}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Vælg denne version
                  </button>
                </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
