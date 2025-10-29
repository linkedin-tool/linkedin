"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Image, PlusCircle, Eye, X } from "lucide-react";
import Link from "next/link";

interface LinkedInPost {
  id: string;
  ugc_post_id: string | null;
  text: string;
  image_asset_urn: string | null;
  image_url: string | null;
  visibility: string;
  created_at: string;
}

export default function MineOpslagPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Ikke logget ind");
          setLoading(false);
          return;
        }

        const { data: postsData, error: postsError } = await supabase
          .from("linkedin_posts" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsError) {
          throw postsError;
        }

        setPosts((postsData as any) || []);
      } catch (err: unknown) {
        console.error("Error fetching posts:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getPostTitle = (text: string) => {
    const firstLine = text.split('\n')[0];
    if (firstLine.length > 40) {
      return firstLine.substring(0, 40) + "...";
    }
    return firstLine;
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

        {posts.length === 0 && !error ? (
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
                      Du har udgivet {posts.length} opslag via platformen
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

            {/* Posts List */}
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="p-3 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                          {post.image_url ? (
                            <img 
                              src={post.image_url} 
                              alt="Opslag billede"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {getPostTitle(post.text)}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(post.created_at)}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              post.visibility === 'PUBLIC' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {post.visibility === 'PUBLIC' ? 'Offentlig' : 'Forbindelser'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                        className="px-4 h-9 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 transition-all duration-200 font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Se Opslag
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More (for future pagination) */}
            {posts.length >= 10 && (
              <div className="text-center pt-6">
                <Button variant="outline" className="px-8 h-11">
                  Indlæs flere opslag
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* LinkedIn-style Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">LinkedIn Opslag</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* LinkedIn-style Post */}
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">R</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ruben Juncher</h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedPost.created_at)} • 
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

              {/* Image Display */}
              {selectedPost.image_url ? (
                <div className="mb-4">
                  <img 
                    src={selectedPost.image_url} 
                    alt="LinkedIn opslag billede"
                    className="w-full rounded-lg shadow-sm border border-gray-200"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
              ) : selectedPost.image_asset_urn && (
                <div className="mb-4 bg-gray-100 rounded-lg p-8 text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Billede blev uploadet til LinkedIn</p>
                  <p className="text-xs text-gray-400 mt-1">Asset: {selectedPost.image_asset_urn}</p>
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
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPost.visibility === 'PUBLIC' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPost.visibility === 'PUBLIC' ? 'Offentlig' : selectedPost.visibility}
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
          </div>
        </div>
      )}
    </div>
  );
}
