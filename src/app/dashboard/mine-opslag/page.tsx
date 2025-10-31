"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Lightbox } from "@/components/ui/lightbox";
import { FileText, Calendar, PlusCircle, Eye, X, Search, Filter, MoreVertical, Clock, Send, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
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
  images?: Array<{
    id: string;
    image_url: string | null;
    linkedin_image_urn: string | null;
    display_order: number;
  }>;
}

export default function MineOpslagPage() {
  const [allPosts, setAllPosts] = useState<LinkedInPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "scheduled">("all");
  const [displayCount, setDisplayCount] = useState(20);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulePost, setReschedulePost] = useState<LinkedInPost | null>(null);
  const [newScheduledDate, setNewScheduledDate] = useState("");
  const [newScheduledTime, setNewScheduledTime] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<Array<{id: string, url: string, alt?: string}>>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const POSTS_PER_PAGE = 20;
  
  const supabase = createClient();

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

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Ikke logget ind");
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from("linkedin_posts" as any)
        .select(`
          *,
          images:linkedin_post_images(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postsError) {
        throw postsError;
      }

      const posts = (postsData as any) || [];
      setAllPosts(posts);
      
    } catch (err: unknown) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Client-side filtering and search
  useEffect(() => {
    let filtered = allPosts;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.text.toLowerCase().includes(query)
      );
    }

    // Apply display limit
    const displayed = filtered.slice(0, displayCount);
    setDisplayedPosts(displayed);
  }, [allPosts, searchQuery, statusFilter, displayCount]);

  const loadMorePosts = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + POSTS_PER_PAGE);
      setLoadingMore(false);
    }, 300); // Simuler loading for bedre UX
  };

  const getFilteredPostsCount = () => {
    let filtered = allPosts;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(post => post.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.text.toLowerCase().includes(query)
      );
    }
    
    return filtered.length;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ingen dato';
    
    try {
      // Alle timestamps er nu i UTC format, så vi kan bruge standard Date parsing
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


  const getPostTitle = (text: string) => {
    const firstLine = text.split('\n')[0];
    if (firstLine.length > 40) {
      return firstLine.substring(0, 40) + "...";
    }
    return firstLine;
  };

  const handlePublishNow = async (postId: string) => {
    try {
      setActionLoading(postId);
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
      await fetchAllPosts();
      setShowActionMenu(null);
      
      // Vis elegant success besked med SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'Opslag udgivet!',
        text: 'Dit opslag er nu live på LinkedIn',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
      
    } catch (error) {
      console.error('Error publishing post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved udgivelse',
        text: error instanceof Error ? error.message : 'Ukendt fejl',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = (post: LinkedInPost) => {
    setReschedulePost(post);
    setShowActionMenu(null);
    
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
  };

  const handleEdit = (post: LinkedInPost) => {
    setShowActionMenu(null);
    
    // Opret URL params til at pre-udfylde new-post siden
    const params = new URLSearchParams({
      edit: 'true',
      postId: post.id,
      text: post.text,
      visibility: post.visibility,
    });
    
    // Tilføj scheduled info hvis det er et planlagt opslag
    if (post.status === 'scheduled' && post.scheduled_for) {
      const scheduledDate = new Date(post.scheduled_for);
      params.append('scheduledDate', scheduledDate.toISOString().split('T')[0]);
      params.append('scheduledTime', scheduledDate.toTimeString().slice(0, 5));
    }
    
    // Tilføj billede URLs hvis der er billeder
    // Først tjek den nye images array
    if (post.images && post.images.length > 0) {
      post.images.forEach((image: any, index: number) => {
        if (image.image_url) {
          params.append(`imageUrl${index}`, image.image_url);
        }
      });
    }
    // Alle billeder håndteres nu via den nye images array
    
    // Tilføj returnTo parameter for at vide hvor vi skal tilbage til
    params.append('returnTo', 'mine-opslag');
    
    // Naviger til new-post siden med pre-udfyldte data
    window.location.href = `/dashboard/new-post?${params.toString()}`;
  };

  const handleDelete = async (post: LinkedInPost) => {
    setShowActionMenu(null);
    
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

    setActionLoading(post.id);

    try {
      const supabase = createClient();
      
      // Slet opslaget fra databasen (billeder slettes automatisk pga. CASCADE)
      const { error } = await supabase
        .from("linkedin_posts" as any)
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      // Fjern opslaget fra listen
      setAllPosts(prev => prev.filter(p => p.id !== post.id));

      // Vis success besked
      await Swal.fire({
        title: 'Opslag slettet!',
        text: 'Opslaget er blevet slettet fra systemet.',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error deleting post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved sletning',
        text: error instanceof Error ? error.message : 'Ukendt fejl',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulePost || !newScheduledDate || !newScheduledTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Manglende information',
        text: 'Vælg venligst både dato og tidspunkt',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

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
      setActionLoading(reschedulePost.id);
      
      const response = await fetch('/api/linkedin/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId: reschedulePost.id,
          newScheduledFor: newDateTime.toISOString()
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Fejl ved ændring af dato');
      }

      // Opdater posts listen
      await fetchAllPosts();
      setShowRescheduleModal(false);
      setReschedulePost(null);
      setNewScheduledDate("");
      setNewScheduledTime("");
      
    } catch (error) {
      console.error('Error rescheduling post:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Fejl ved ændring af dato',
        text: error instanceof Error ? error.message : 'Ukendt fejl',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pt-16">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mine Opslag</h1>
          <p className="text-lg text-gray-600">Se alle dine LinkedIn opslag udgivet via platformen.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Indlæser dine opslag...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-16">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mine Opslag</h1>
        <p className="text-lg text-gray-600">Se alle dine LinkedIn opslag udgivet via platformen.</p>
      </div>

      <div className="max-w-4xl">
        {error && (
          <Card className="p-6 bg-gradient-to-r from-red-50 to-red-50 border-red-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Fejl ved indlæsning</h3>
                <p className="text-gray-700 mt-1">Fejl: {error}</p>
              </div>
            </div>
          </Card>
        )}

        {allPosts.length === 0 && !loading && !error ? (
          <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen opslag endnu</h3>
            <p className="text-gray-600 mb-6">
              Du har ikke udgivet nogen LinkedIn opslag via platformen endnu.
            </p>
            <Button asChild className="px-8 h-11 bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/new-post">
                <PlusCircle className="w-4 h-4" />
                Opret dit første opslag
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Dine LinkedIn Opslag</h3>
                    <p className="text-gray-700 mt-1">
                      Du har udgivet {allPosts.length} opslag via platformen
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="px-6 h-10">
                  <Link href="/dashboard/new-post">
                    <PlusCircle className="w-4 h-4" />
                    Nyt Opslag
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Search and Filter */}
            <Card className="p-4 bg-white border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Søg i opslag tekst..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 text-gray-900 placeholder-gray-500 h-10"
                    disabled={loading}
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "scheduled")}
                    className="appearance-none px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 bg-white text-gray-900 text-base font-medium cursor-pointer hover:bg-gray-50 transition-colors h-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="all">Alle opslag</option>
                    <option value="published">Udgivne</option>
                    <option value="scheduled">Planlagte</option>
                  </select>
                </div>
              </div>
              
              {/* Results count */}
              <div className="mt-3 text-sm text-gray-500">
                Viser {displayedPosts.length} opslag
                {getFilteredPostsCount() > displayedPosts.length && <span> (flere tilgængelige)</span>}
                {searchQuery && (
                  <span> • Søger efter &quot;{searchQuery}&quot;</span>
                )}
                {statusFilter !== "all" && (
                  <span> • Filtreret efter {statusFilter === "published" ? "udgivne" : "planlagte"}</span>
                )}
              </div>
            </Card>

            {/* Posts List */}
            <div className="space-y-3">
              {displayedPosts.length === 0 ? (
                <Card className="p-8 bg-white border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen opslag fundet</h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? `Ingen opslag matcher søgningen &quot;${searchQuery}&quot;`
                      : statusFilter !== "all"
                      ? `Ingen ${statusFilter === "published" ? "udgivne" : "planlagte"} opslag fundet`
                      : "Ingen opslag at vise"
                    }
                  </p>
                </Card>
              ) : (
                displayedPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="group p-3 sm:p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 relative">
                      {post.images && post.images.length > 0 && post.images[0].image_url ? (
                        <>
                          <img 
                            src={post.images[0].image_url} 
                            alt="Opslag billede"
                            className="w-full h-full object-cover"
                          />
                          {/* Vis antal billeder hvis der er flere end 1 */}
                          {post.images.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                              +{post.images.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                          <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
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
                            {getPostTitle(post.text)}
                          </h4>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                              post.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : post.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {post.status === 'scheduled' ? 'Planlagt' : post.status === 'published' ? 'Udgivet' : 'Fejlet'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${getVisibilityStyle(post.visibility)}`}>
                              {getVisibilityText(post.visibility)}
                            </span>
                          </div>

                          {/* Date */}
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                            <span className="truncate">
                              {post.status === 'scheduled' && post.scheduled_for
                                ? `Planlagt: ${formatDate(post.scheduled_for)}`
                                : post.published_at
                                ? formatDate(post.published_at)
                                : formatDate(post.created_at)
                              }
                            </span>
                          </div>
                        </div>

                        {/* Action buttons - tre prikker permanent, øje ved hover */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* View icon for all posts - kun ved hover */}
                          <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          
                          {/* Actions menu - tre prikker permanent for alle opslag */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionMenu(showActionMenu === post.id ? null : post.id);
                              }}
                              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                              disabled={actionLoading === post.id}
                            >
                              {actionLoading === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              ) : (
                                <MoreVertical className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                            
                            {/* Dropdown menu - forskellige muligheder baseret på status */}
                            {showActionMenu === post.id && (
                              <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                {/* Rediger opslag - for alle opslag */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(post);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  disabled={actionLoading === post.id}
                                >
                                  <Edit className="w-4 h-4" />
                                  Rediger opslag
                                </button>
                                
                                {/* Ekstra muligheder for planlagte opslag */}
                                {post.status === 'scheduled' && (
                                  <>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePublishNow(post.id);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      disabled={actionLoading === post.id}
                                    >
                                      <Send className="w-4 h-4" />
                                      Udgiv nu
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReschedule(post);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      disabled={actionLoading === post.id}
                                    >
                                      <Clock className="w-4 h-4" />
                                      Ændre dato
                                    </button>
                                  </>
                                )}
                                
                                {/* Slet opslag - for alle opslag */}
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(post);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  disabled={actionLoading === post.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Slet opslag
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                ))
              )}
            </div>

            {/* Load More */}
            {getFilteredPostsCount() > displayedPosts.length && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  className="px-8 h-11"
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Indlæser..." : "Vis flere opslag"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <Modal 
          isOpen={!!selectedPost} 
          onClose={() => setSelectedPost(null)}
          title="LinkedIn Opslag"
          actions={[
            // Primary actions for scheduled posts
            ...(selectedPost.status === 'scheduled' ? [
              {
                label: 'Udgiv nu',
                onClick: () => handlePublishNow(selectedPost.id),
                icon: <Send className="w-4 h-4" />,
                disabled: actionLoading === selectedPost.id
              },
              {
                label: 'Ændre dato',
                onClick: () => handleReschedule(selectedPost),
                icon: <Clock className="w-4 h-4" />,
                disabled: actionLoading === selectedPost.id,
                separator: true
              }
            ] : []),
            // Secondary actions for all posts
            {
              label: 'Rediger opslag',
              onClick: () => handleEdit(selectedPost),
              icon: <Edit className="w-4 h-4" />,
              disabled: actionLoading === selectedPost.id,
              separator: true
            },
            {
              label: 'Slet opslag',
              onClick: () => handleDelete(selectedPost),
              icon: <Trash2 className="w-4 h-4" />,
              variant: 'danger' as const,
              disabled: actionLoading === selectedPost.id
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

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.text}
                </p>
              </div>

              {/* Images Display */}
              {selectedPost.images && selectedPost.images.length > 0 && (
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

              {/* LinkedIn-style Engagement Bar */}
              <div className="border-t border-gray-200 pt-3 mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-4">
                    <span>👍 Se reaktioner på LinkedIn</span>
                  </div>
                  <span>Se kommentarer på LinkedIn</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <span>👍</span>
                      <span className="text-sm font-medium">Synes godt om</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <span>💬</span>
                      <span className="text-sm font-medium">Kommentér</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <span>🔄</span>
                      <span className="text-sm font-medium">Del</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <span>📤</span>
                      <span className="text-sm font-medium">Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Post Meta Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getVisibilityStyle(selectedPost.visibility)}`}>
                      {getVisibilityText(selectedPost.visibility)}
                    </span>
                  </div>
                  {selectedPost.ugc_post_id && (
                    <div>
                      <span className="text-gray-500">LinkedIn ID:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPost.ugc_post_id!);
                        }}
                        className="ml-2 text-blue-600 hover:underline text-xs"
                      >
                        {selectedPost.ugc_post_id}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {reschedulePost && (
        <Modal 
          isOpen={showRescheduleModal} 
          onClose={() => {
            setShowRescheduleModal(false);
            setReschedulePost(null);
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
                disabled={!newScheduledDate || !newScheduledTime || actionLoading === reschedulePost.id}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading === reschedulePost.id ? (
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
                  setReschedulePost(null);
                  setNewScheduledDate("");
                  setNewScheduledTime("");
                }}
                disabled={actionLoading === reschedulePost?.id}
                className="px-6"
              >
                Annuller
              </Button>
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
