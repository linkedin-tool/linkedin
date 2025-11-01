"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Lightbox } from "@/components/ui/lightbox";
import { Calendar, ChevronLeft, ChevronRight, Clock, Image, Send, Edit, Trash2, FileEdit, Eye, Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Swal from 'sweetalert2';

interface LinkedInPost {
  id: string;
  ugc_post_id: string | null;
  text: string;
  visibility: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  is_repost?: boolean;
  original_post_urn?: string | null;
  images?: Array<{
    id: string;
    image_url: string | null;
    linkedin_image_urn: string | null;
    display_order: number;
  }>;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: LinkedInPost[];
}

export default function ContentPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState("");
  const [newScheduledTime, setNewScheduledTime] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<Array<{id: string, url: string, alt?: string}>>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [showDayPostsModal, setShowDayPostsModal] = useState(false);
  const [selectedDayPosts, setSelectedDayPosts] = useState<{date: string, posts: LinkedInPost[]}>({date: '', posts: []});
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostComment, setRepostComment] = useState("");
  const [originalPost, setOriginalPost] = useState<LinkedInPost | null>(null);

  const supabase = createClient();

  // Hent alle opslag fra databasen
  useEffect(() => {
    async function fetchPosts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("linkedin_posts" as any)
          .select(`
            *,
            images:linkedin_post_images(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts((data as any) || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // Generer kalender dage for den aktuelle måned
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Første dag i måneden
    const firstDay = new Date(year, month, 1);
    
    // Start fra mandag i ugen hvor måneden starter
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mandag = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Generer 42 dage (6 uger x 7 dage)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      
      // Find opslag for denne dag
      const dayPosts = posts.filter(post => {
        if (post.scheduled_for) {
          // scheduled_for er nu i UTC format, konverter til lokal tid for sammenligning
          const postDate = new Date(post.scheduled_for);
          return (
            postDate.getDate() === date.getDate() &&
            postDate.getMonth() === date.getMonth() &&
            postDate.getFullYear() === date.getFullYear()
          );
        }
        
        if (post.published_at) {
          const postDate = new Date(post.published_at);
          return (
            postDate.getDate() === date.getDate() &&
            postDate.getMonth() === date.getMonth() &&
            postDate.getFullYear() === date.getFullYear()
          );
        }
        
        return false;
      });
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        posts: dayPosts
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };


  const formatPostDate = (post: LinkedInPost) => {
    if (post.scheduled_for) {
      // scheduled_for er nu i UTC format, konverter til lokal tid
      const date = new Date(post.scheduled_for);
      return date.toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (post.published_at) {
      const date = new Date(post.published_at);
      return date.toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return "";
  };

  // Konverter URN til LinkedIn URL
  const convertUrnToLinkedInUrl = (ugcPostId: string): string => {
    const shareId = ugcPostId.replace('urn:li:share:', '');
    return `https://www.linkedin.com/feed/update/urn:li:activity:${shareId}`;
  };

  // Hent original post for genopslag
  const fetchOriginalPost = async (originalPostUrn: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: originalPostData, error } = await supabase
        .from("linkedin_posts" as any)
        .select(`
          *,
          images:linkedin_post_images(*)
        `)
        .eq("ugc_post_id", originalPostUrn)
        .eq("user_id", user.id)
        .single();

      if (!error && originalPostData) {
        setOriginalPost(originalPostData as any);
      }
    } catch (err) {
      console.error("Error fetching original post:", err);
    }
  };

  // Åbn post modal og hent original post hvis det er et genopslag
  const handleOpenPostModal = async (post: LinkedInPost) => {
    setSelectedPost(post);
    setOriginalPost(null); // Reset original post
    setShowPostModal(true);
    
    if (post.is_repost && post.original_post_urn) {
      await fetchOriginalPost(post.original_post_urn);
    }
  };

  // Standardiserede styling funktioner
  const getVisibilityStyle = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'bg-blue-100 text-blue-800';
      case 'CONNECTIONS':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Offentligt';
      case 'CONNECTIONS':
        return 'Kun forbindelser';
      default:
        return visibility;
    }
  };

  // Formatér dato til visning
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string, isRepost?: boolean) => {
    // Genopslag får altid lilla farve uanset status
    if (isRepost) {
      return 'bg-purple-500';
    }
    
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-600'; // Darker gray for better visibility
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Lightbox funktioner
  const openLightbox = (images: any[], initialIndex: number = 0) => {
    const lightboxImageData = images
      .filter(img => img.image_url)
      .map(img => ({
        id: img.id,
        url: img.image_url,
        alt: `LinkedIn opslag billede`
      }));
    
    setLightboxImages(lightboxImageData);
    setLightboxInitialIndex(initialIndex);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setLightboxImages([]);
    setLightboxInitialIndex(0);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Udgivet';
      case 'scheduled':
        return 'Planlagt';
      case 'draft':
        return 'Kladde';
      case 'failed':
        return 'Fejlet';
      default:
        return 'Ukendt';
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/linkedin/publish-scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Fejl ved udgivelse');
      }

      // Opdater posts listen
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("linkedin_posts" as any)
          .select(`
            *,
            images:linkedin_post_images(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error) {
          setPosts((data as any) || []);
        }
      }
      
      setShowPostModal(false);
      
      // Vis elegant success besked med SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'Opslag udgivet!',
        text: 'Dit opslag er nu live på LinkedIn',
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
      console.error('Error publishing post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved udgivelse',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = (post: LinkedInPost) => {
    setShowPostModal(false);
    
    if (post.status === 'draft' || post.status === 'failed') {
      // For kladder og fejlede opslag: brug schedule modal (ny planlægning)
      // Default til i morgen kl. 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setNewScheduledDate(tomorrow.toISOString().split('T')[0]);
      setNewScheduledTime("10:00");
      setShowScheduleModal(true);
    } else {
      // For planlagte opslag: brug reschedule modal (ændre eksisterende)
      // Pre-fill med eksisterende dato hvis den findes
      if (post.scheduled_for) {
        const existingDate = new Date(post.scheduled_for);
        const dateStr = existingDate.toISOString().split('T')[0];
        const timeStr = existingDate.toTimeString().slice(0, 5);
        setNewScheduledDate(dateStr);
        setNewScheduledTime(timeStr);
      } else {
        // Default til i morgen kl. 10:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        setNewScheduledDate(tomorrow.toISOString().split('T')[0]);
        setNewScheduledTime("10:00");
      }
      setShowRescheduleModal(true);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedPost || !newScheduledDate || !newScheduledTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Manglende information',
        text: 'Vælg venligst både dato og tidspunkt',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // Valider at tidspunktet er i fremtiden
    const newDateTime = new Date(`${newScheduledDate}T${newScheduledTime}`);
    if (newDateTime <= new Date()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ugyldig dato',
        text: 'Planlagt tidspunkt skal være i fremtiden',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      setActionLoading(true);
      
      // Send lokal tid streng (ligesom new-post gør) - backend konverterer til UTC
      const scheduledDateTime = `${newScheduledDate}T${newScheduledTime}:00`;
      
      const response = await fetch('/api/linkedin/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId: selectedPost.id,
          newScheduledFor: scheduledDateTime  // Send lokal tid streng, ikke ISO string
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Fejl ved ændring af dato');
      }

      // Opdater posts listen
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("linkedin_posts" as any)
          .select(`
            *,
            images:linkedin_post_images(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error) {
          setPosts((data as any) || []);
        }
      }
      
      setShowRescheduleModal(false);
      setNewScheduledDate("");
      setNewScheduledTime("");
      
    } catch (error) {
      console.error('Error rescheduling post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved ændring af dato',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!selectedPost || !newScheduledDate || !newScheduledTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Manglende information',
        text: 'Vælg venligst både dato og tidspunkt',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // Valider at tidspunktet er i fremtiden
    const newDateTime = new Date(`${newScheduledDate}T${newScheduledTime}`);
    if (newDateTime <= new Date()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ugyldig dato',
        text: 'Planlagt tidspunkt skal være i fremtiden',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      setActionLoading(true);
      
      // Brug update-post endpoint med newStatus for at ændre kladde til scheduled
      const scheduledDateTime = `${newScheduledDate}T${newScheduledTime}:00`;
      
      const formData = new FormData();
      formData.append('postId', selectedPost.id);
      formData.append('text', selectedPost.text);
      formData.append('visibility', selectedPost.visibility);
      formData.append('scheduledFor', scheduledDateTime);
      formData.append('newStatus', 'scheduled');
      
      const response = await fetch('/api/linkedin/update-post', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fejl ved planlægning af opslag');
      }

      // Opdater opslaget i listen
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, status: 'scheduled', scheduled_for: newDateTime.toISOString() }
          : post
      ));

      // Stop loading øjeblikkeligt efter UI opdatering
      setActionLoading(false);

      // Luk modal og reset
      setShowScheduleModal(false);
      setNewScheduledDate("");
      setNewScheduledTime("");

      await Swal.fire({
        title: 'Opslag planlagt!',
        text: `Dit opslag er nu planlagt til udgivelse ${newDateTime.toLocaleString('da-DK')}`,
        icon: 'success',
        showConfirmButton: false,
        timer: 3000,
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
      console.error('Error scheduling post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved planlægning',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
      // Sæt loading til false kun ved fejl (success case håndteres tidligere)
      setActionLoading(false);
    }
  };

  // Handle repost
  const handleRepost = (post: LinkedInPost) => {
    setSelectedPost(post);
    setRepostComment("");
    setShowRepostModal(true);
  };

  // Handle repost submit
  const handleRepostSubmit = async () => {
    if (!selectedPost || !selectedPost.ugc_post_id) return;

    setActionLoading(true);

    try {
      const response = await fetch('/api/linkedin/repost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPostUrn: selectedPost.ugc_post_id,
          commentary: repostComment.trim() || undefined,
          visibility: selectedPost.visibility
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fejl ved genopslag');
      }

      // Stop loading øjeblikkeligt efter success
      setActionLoading(false);

      // Luk modal og reset
      setShowRepostModal(false);
      setSelectedPost(null);
      setRepostComment("");

      // Refresh posts to show the new repost (it will appear in today's date)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("linkedin_posts" as any)
          .select(`
            *,
            images:linkedin_post_images(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error) {
          setPosts((data as any) || []);
        }
      }

      await Swal.fire({
        title: 'Opslag genopslået!',
        text: 'Dit opslag er nu genopslået på LinkedIn og vil vises i kalenderen',
        icon: 'success',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: false,
        toast: true,
        customClass: {
          popup: 'swal2-toast-custom'
        },
        showClass: {
          popup: 'swal2-toast-fade-in'
        },
        hideClass: {
          popup: 'swal2-toast-fade-out'
        },
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error reposting:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved genopslag',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
      // Sæt loading til false kun ved fejl
      setActionLoading(false);
    }
  };

  const handleEdit = (post: LinkedInPost) => {
    // Opret URL params til at pre-udfylde new-post siden
    const params = new URLSearchParams({
      edit: 'true',
      postId: post.id,
      text: post.text,
      visibility: post.visibility,
      status: post.status,
    });
    
    // Tilføj scheduled info hvis det er et planlagt opslag
    if (post.status === 'scheduled' && post.scheduled_for) {
      const scheduledDate = new Date(post.scheduled_for);
      params.append('scheduledDate', scheduledDate.toISOString().split('T')[0]);
      params.append('scheduledTime', scheduledDate.toTimeString().slice(0, 5));
    }
    
    // Tilføj billede URLs hvis der er billeder
    if (post.images && post.images.length > 0) {
      post.images.forEach((image: any, index: number) => {
        if (image.image_url) {
          params.append(`imageUrl${index}`, image.image_url);
        }
      });
    }
    
    // Tilføj returnTo parameter for at vide hvor vi skal tilbage til
    params.append('returnTo', 'content-plan');
    
    // Naviger til new-post siden med pre-udfyldte data
    window.location.href = `/dashboard/new-post?${params.toString()}`;
  };

  const handleDelete = async (post: LinkedInPost) => {
    // Bekræft sletning med SweetAlert2
    const result = await Swal.fire({
      title: 'Slet opslag?',
      text: `Er du sikker på, at du vil slette dette ${post.status === 'scheduled' ? 'planlagte' : 'udgivne'} opslag? Denne handling kan ikke fortrydes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ja, slet opslag',
      cancelButtonText: 'Annuller'
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);

    try {
      const supabase = createClient();
      
      // Slet opslaget fra databasen (billeder slettes automatisk pga. CASCADE)
      const { error } = await supabase
        .from("linkedin_posts" as any)
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      // Fjern opslaget fra listen
      setPosts(prev => prev.filter(p => p.id !== post.id));
      
      // Luk modal hvis det var det valgte opslag
      if (selectedPost?.id === post.id) {
        setSelectedPost(null);
      }

      // Vis success besked
      await Swal.fire({
        title: 'Opslag slettet!',
        text: 'Opslaget er blevet slettet fra systemet.',
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
      console.error('Error deleting post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved sletning',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToDraft = async (post: LinkedInPost) => {
    setShowPostModal(false);
    
    // Bekræft konvertering med SweetAlert2
    const result = await Swal.fire({
      title: 'Gør til kladde?',
      text: `Er du sikker på, at du vil gøre dette planlagte opslag til en kladde? Opslaget vil ikke længere være planlagt til udgivelse.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6b7280',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ja, gør til kladde',
      cancelButtonText: 'Annuller'
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);

    try {
      const response = await fetch('/api/linkedin/convert-to-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Fejl ved konvertering');
      }

      // Opdater opslaget i listen lokalt (uden at refreshe hele siden)
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, status: 'draft', scheduled_for: null }
          : p
      ));

      // Stop loading øjeblikkeligt efter UI opdatering
      setActionLoading(false);

      // Vis success besked
      await Swal.fire({
        title: 'Gjort til kladde!',
        text: 'Opslaget er nu gemt som en kladde og er ikke længere planlagt.',
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
      console.error('Error converting to draft:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved konvertering',
        text: error instanceof Error ? error.message : 'Noget gik galt. Prøv igen.',
        confirmButtonColor: '#dc2626'
      });
      // Sæt loading til false kun ved fejl (success case håndteres tidligere)
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Content Plan</h1>
          <p className="text-lg text-gray-600">Indlæser din content kalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Content Plan</h1>
        <p className="text-lg text-gray-600">Få overblik over dine planlagte og udgivne LinkedIn-opslag.</p>
      </div>

      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        {/* Kalender header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('da-DK', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200"
            >
              I dag
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ugedage header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Kalender grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {calendarDays.map((day, index) => {
            const visiblePosts = day.posts.slice(0, 2);
            const hiddenPostsCount = day.posts.length - 2;
            
            return (
              <div
                key={index}
                className={`h-[135px] p-2 border-r border-b border-gray-200 last:border-r-0 ${
                  index >= calendarDays.length - 7 ? 'border-b-0' : ''
                } ${
                  day.isCurrentMonth ? 'bg-gray-50' : 'bg-gray-100'
                } ${day.isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1 flex flex-col justify-start h-full pb-1">
                  {visiblePosts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenPostModal(post)}
                      className="cursor-pointer group"
                    >
                      <div className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(post.status, post.is_repost)} group-hover:opacity-80`}>
                        {/* Desktop visning */}
                        <div className="hidden sm:flex items-center gap-1 w-full">
                          <div className="flex-shrink-0 font-medium">
                            {formatPostDate(post)}
                          </div>
                          <div className="truncate flex-1">
                            {post.text.slice(0, 25)}...
                          </div>
                          {post.images && post.images.length > 0 && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Image className="w-3 h-3" />
                              {post.images.length > 1 && (
                                <span className="text-xs">×{post.images.length}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Mobil visning - kun klokkeslæt */}
                        <div className="sm:hidden text-center font-medium">
                          {formatPostDate(post)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {day.posts.length > 2 && (
                    <div 
                      onClick={() => {
                        const dateStr = day.date.toLocaleDateString('da-DK', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        });
                        setSelectedDayPosts({
                          date: dateStr,
                          posts: day.posts
                        });
                        setShowDayPostsModal(true);
                      }}
                      className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded cursor-pointer hover:bg-gray-300 transition-colors"
                    >
                      <span className="hidden sm:inline">+{hiddenPostsCount} flere</span>
                      <span className="sm:hidden">+{hiddenPostsCount}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legende */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Udgivet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Planlagt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-sm text-gray-600">Genopslag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Fejlet</span>
          </div>
        </div>
      </Card>

      {/* Post Modal */}
      {selectedPost && (
        <Modal 
          isOpen={showPostModal} 
          onClose={() => {
            setShowPostModal(false);
            setSelectedPost(null);
            setOriginalPost(null);
          }}
          title="LinkedIn Opslag"
          actions={[
            // Primary actions for scheduled posts
            ...(selectedPost.status === 'scheduled' ? [
              {
                label: 'Udgiv nu',
                onClick: () => handlePublishNow(selectedPost.id),
                icon: <Send className="w-4 h-4" />,
                disabled: actionLoading
              },
              {
                label: 'Ændre dato',
                onClick: () => handleReschedule(selectedPost),
                icon: <Clock className="w-4 h-4" />,
                disabled: actionLoading
              }
            ] : []),
            // Primary actions for draft and failed posts
            ...(selectedPost.status === 'draft' || selectedPost.status === 'failed' ? [
              {
                label: 'Udgiv nu',
                onClick: () => handlePublishNow(selectedPost.id),
                icon: <Send className="w-4 h-4" />,
                disabled: actionLoading
              },
              {
                label: 'Planlæg opslag',
                onClick: () => handleReschedule(selectedPost),
                icon: <Calendar className="w-4 h-4" />,
                disabled: actionLoading
              }
            ] : []),
            // Genopslå for originale udgivne opslag
            ...(selectedPost.status === 'published' && selectedPost.ugc_post_id && !selectedPost.is_repost ? [
              {
                label: 'Genopslå',
                onClick: () => handleRepost(selectedPost),
                icon: <Repeat2 className="w-4 h-4" />,
                disabled: actionLoading
              }
            ] : []),
            // Vis på LinkedIn for alle udgivne opslag
            ...(selectedPost.status === 'published' && selectedPost.ugc_post_id ? [
              {
                label: 'Vis på LinkedIn',
                onClick: () => {
                  const linkedinUrl = convertUrnToLinkedInUrl(selectedPost.ugc_post_id!);
                  window.open(linkedinUrl, '_blank');
                },
                icon: <Eye className="w-4 h-4" />,
                disabled: actionLoading
              }
            ] : []),
            // Secondary actions for all posts
            {
              label: 'Rediger opslag',
              onClick: () => handleEdit(selectedPost),
              icon: <Edit className="w-4 h-4" />,
              disabled: actionLoading
            },
            // Convert to draft for scheduled posts
            ...(selectedPost.status === 'scheduled' ? [
              {
                label: 'Gør til kladde',
                onClick: () => handleConvertToDraft(selectedPost),
                icon: <FileEdit className="w-4 h-4" />,
                disabled: actionLoading
              }
            ] : []),
            {
              label: 'Slet opslag',
              onClick: () => handleDelete(selectedPost),
              icon: <Trash2 className="w-4 h-4" />,
              variant: 'danger' as const,
              disabled: actionLoading
            }
          ]}
        >
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">R</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ruben Juncher</h4>
                  <p className="text-sm text-gray-500">
                    {selectedPost.status === 'scheduled' && selectedPost.scheduled_for
                      ? `Planlagt: ${formatDate(selectedPost.scheduled_for)}`
                      : selectedPost.published_at
                      ? formatDate(selectedPost.published_at)
                      : formatDate(selectedPost.created_at)
                    } • 
                    <span className="ml-1">🌍</span>
                  </p>
                </div>
              </div>

              {/* Genopslag struktur */}
              {selectedPost.is_repost ? (
                <div className="space-y-4">
                  {/* Genopslags kommentar (hvis der er nogen) */}
                  {selectedPost.text && !selectedPost.text.startsWith('Genopslag:') && (
                    <div className="mb-4">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {selectedPost.text}
                      </p>
                    </div>
                  )}
                  
                  {/* Original post kort */}
                  {originalPost && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Repeat2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Genopslag af:</span>
                      </div>
                      
                      {/* Original post header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">R</span>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">Ruben Juncher</h5>
                          <p className="text-xs text-gray-500">
                            {originalPost.published_at ? formatDate(originalPost.published_at) : formatDate(originalPost.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Original post content */}
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">
                        {originalPost.text}
                      </div>
                      
                      {/* Original post images */}
                      {originalPost.images && originalPost.images.length > 0 && (
                        <div className="mt-3">
                          {originalPost.images.length === 1 ? (
                            // Enkelt billede - vis større
                            <div className="w-full">
                              <img 
                                src={originalPost.images[0].image_url!} 
                                alt="Original opslag billede"
                                className="w-full max-h-48 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openLightbox(originalPost.images || [], 0)}
                              />
                            </div>
                          ) : (
                            // Flere billeder - vis i grid
                            <div>
                              <div className={`grid gap-2 ${
                                originalPost.images.length === 2 ? 'grid-cols-2' :
                                originalPost.images.length === 3 ? 'grid-cols-3' :
                                'grid-cols-2'
                              }`}>
                                {originalPost.images.slice(0, 4).map((image, index) => (
                                  <div key={image.id} className="relative">
                                    <img 
                                      src={image.image_url!} 
                                      alt={`Original opslag billede ${index + 1}`}
                                      className={`w-full object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity ${
                                        originalPost.images!.length === 2 ? 'h-24' : 'h-20'
                                      }`}
                                      onClick={() => openLightbox(originalPost.images || [], index)}
                                    />
                                    {/* Vis "+X" overlay hvis der er flere end 4 billeder og dette er det 4. */}
                                    {index === 3 && originalPost.images!.length > 4 && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">+{originalPost.images!.length - 4}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Normal post content */
                <div className="mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {selectedPost.text}
                  </p>
                </div>
              )}

              {/* Images Display - kun for normale posts */}
              {!selectedPost.is_repost && selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mb-4">
                  {selectedPost.images.length === 1 ? (
                    // Enkelt billede - vis stort
                    <div>
                      <img 
                        src={selectedPost.images[0].image_url!} 
                        alt="LinkedIn opslag billede"
                        className="w-full rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        onClick={() => openLightbox(selectedPost.images || [], 0)}
                      />
                    </div>
                  ) : (
                    // Flere billeder - vis i grid
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{selectedPost.images.length} billeder:</p>
                      <div className={`grid gap-2 ${
                        selectedPost.images.length === 2 ? 'grid-cols-2' :
                        selectedPost.images.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2'
                      }`}>
                        {selectedPost.images.slice(0, 4).map((image, index) => (
                          <div key={image.id} className="relative">
                            <img 
                              src={image.image_url!} 
                              alt={`LinkedIn opslag billede ${index + 1}`}
                              className={`w-full object-cover rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity ${
                                (selectedPost.images?.length || 0) === 2 ? 'h-40' : 'h-32'
                              }`}
                              onClick={() => openLightbox(selectedPost.images || [], index)}
                            />
                            {/* Vis "+X" overlay hvis der er flere end 4 billeder og dette er det 4. */}
                            {index === 3 && selectedPost.images!.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-white font-semibold">+{selectedPost.images!.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Post Meta Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPost.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedPost.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : selectedPost.status === 'draft'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedPost.status === 'scheduled' ? 'Planlagt' : selectedPost.status === 'published' ? 'Udgivet' : selectedPost.status === 'draft' ? 'Kladde' : 'Fejlet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Visning:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getVisibilityStyle(selectedPost.visibility)}`}>
                      {getVisibilityText(selectedPost.visibility)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {selectedPost && (
        <Modal 
          isOpen={showRescheduleModal} 
          onClose={() => {
            setShowRescheduleModal(false);
            setNewScheduledDate("");
            setNewScheduledTime("");
          }}
          title="Ændre planlagt dato"
          className="max-w-lg"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Vælg ny dato og tid:</h4>
              <DateTimePicker
                selectedDate={newScheduledDate}
                selectedTime={newScheduledTime}
                onDateChange={setNewScheduledDate}
                onTimeChange={setNewScheduledTime}
                minDate={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRescheduleSubmit}
                disabled={!newScheduledDate || !newScheduledTime || actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gemmer...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Gem ny dato
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setNewScheduledDate("");
                  setNewScheduledTime("");
                }}
                disabled={actionLoading}
                className="px-6"
              >
                Annuller
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Modal (for drafts) */}
      {selectedPost && (
        <Modal 
          isOpen={showScheduleModal} 
          onClose={() => {
            setShowScheduleModal(false);
            setNewScheduledDate("");
            setNewScheduledTime("");
          }}
          title="Planlæg opslag"
          className="max-w-lg"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              Vælg hvornår dit opslag skal udgives på LinkedIn.
            </p>
            
            <DateTimePicker
              selectedDate={newScheduledDate}
              selectedTime={newScheduledTime}
              onDateChange={setNewScheduledDate}
              onTimeChange={setNewScheduledTime}
              minDate={new Date().toISOString().split('T')[0]}
            />
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleScheduleSubmit}
                disabled={!newScheduledDate || !newScheduledTime || actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Planlægger...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Planlæg opslag
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleModal(false);
                  setNewScheduledDate("");
                  setNewScheduledTime("");
                }}
                disabled={actionLoading}
                className="px-6"
              >
                Annuller
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Repost Modal */}
      {selectedPost && (
        <Modal 
          isOpen={showRepostModal} 
          onClose={() => {
            setShowRepostModal(false);
            setSelectedPost(null);
            setRepostComment("");
          }}
          title="Genopslå på LinkedIn"
        >
          <div className="space-y-6">
            {/* Original post preview */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Repeat2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Genopslår dette opslag:</span>
              </div>
              <div className="text-sm text-gray-900 line-clamp-3">
                {selectedPost.text}
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  📷 {selectedPost.images.length} billede{selectedPost.images.length > 1 ? 'r' : ''}
                </div>
              )}
            </div>

            {/* Commentary input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tilføj en kommentar (valgfrit)
              </label>
              <textarea
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
                placeholder="Skriv en kommentar til dit genopslag..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={3000}
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {repostComment.length}/3000 tegn
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleRepostSubmit}
                disabled={actionLoading}
                className="px-6"
              >
                {actionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Genopslår...
                  </div>
                ) : (
                  <>
                    <Repeat2 className="w-4 h-4 mr-2" />
                    Genopslå
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRepostModal(false);
                  setSelectedPost(null);
                  setRepostComment("");
                }}
                disabled={actionLoading}
                className="px-6"
              >
                Annuller
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Day Posts Modal */}
      {showDayPostsModal && (
        <Modal
          isOpen={showDayPostsModal}
          onClose={() => setShowDayPostsModal(false)}
          title={`Opslag for ${selectedDayPosts.date}`}
        >
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {selectedDayPosts.posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => {
                    setShowDayPostsModal(false);
                    handleOpenPostModal(post);
                  }}
                  className="cursor-pointer group p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(post.status, post.is_repost)}`}>
                      {formatPostDate(post)}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-sm text-gray-900 truncate">
                        {post.text.slice(0, 60)}...
                      </div>
                    </div>
                    {post.images && post.images.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Image className="w-4 h-4" />
                        {post.images.length > 1 && (
                          <span className="text-xs">×{post.images.length}</span>
                        )}
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(post.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        isOpen={showLightbox}
        onClose={closeLightbox}
        initialIndex={lightboxInitialIndex}
      />
    </div>
  );
}
