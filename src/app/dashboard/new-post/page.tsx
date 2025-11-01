"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PlusCircle, Image, CheckCircle, AlertCircle, Calendar, Edit, FileEdit, Send } from "lucide-react";
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
    fd.append("text", text);
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
    <div className="space-y-8 pt-16">
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
            <div>
              <label htmlFor="text" className="block text-base font-medium text-gray-700 mb-2">
                Opslag tekst
              </label>
              <textarea
                id="text"
                className="w-full border-2 border-gray-200 rounded-2xl p-4 min-h-[240px] text-base text-gray-900 resize-y focus:border-gray-200 focus:outline-none focus:ring-0 focus:shadow-none transition-colors"
                placeholder="Skriv dit opslag her... Del dine tanker, opdateringer eller indsigter med dit LinkedIn-netværk."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Brug hashtags og tag relevante personer for at øge rækkevidden.
              </p>
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
    </div>
  );
}
