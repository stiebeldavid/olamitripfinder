import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Trip, TripGender, TripLocation } from "@/types/trip";
import ImagePreview from "@/components/ImagePreview";
import ThumbnailSelector from "@/components/ThumbnailSelector";

const getPublicUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  const {
    data: {
      publicUrl
    }
  } = supabase.storage.from('trip-photos').getPublicUrl(path);
  return publicUrl || "";
};

const EditTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tripId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [brochurePreview, setBrochurePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<{id: string, path: string}[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [newVideoLink, setNewVideoLink] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);

  // Load trip data
  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          gallery:trip_gallery(id, image_path),
          videos:trip_videos(id, video_url)
        `)
        .eq('trip_id', tripId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Trip not found');

      // Parse dates
      if (data.start_date) {
        setStartDate(parseISO(data.start_date));
      }
      if (data.end_date) {
        setEndDate(parseISO(data.end_date));
      }

      // Set gallery images
      if (data.gallery) {
        setExistingGalleryImages(data.gallery.map((g: any) => ({
          id: g.id,
          path: g.image_path
        })));
      }

      // Set video links
      if (data.videos) {
        setVideoLinks(data.videos.map((v: any) => v.video_url));
      }

      // Get brochure image URL
      const brochureUrl = data.brochure_image_path ? getPublicUrl(data.brochure_image_path) : "";
      
      // Get gallery image URLs
      const galleryImages = data.gallery?.map((g: any) => getPublicUrl(g.image_path)) || [];
      
      // Set thumbnail image if it exists
      if (data.thumbnail_image) {
        setThumbnailImage(getPublicUrl(data.thumbnail_image));
      }

      return {
        id: data.id,
        trip_id: data.trip_id,
        name: data.name,
        description: data.description || "",
        startDate: data.start_date,
        endDate: data.end_date,
        websiteUrl: data.website_url || "",
        organizer: {
          name: data.organizer_name,
          contact: data.organizer_contact
        },
        gender: data.gender,
        location: data.location,
        spots: data.spots || "",
        brochureImage: brochureUrl,
        thumbnailImage: data.thumbnail_image ? getPublicUrl(data.thumbnail_image) : null,
        gallery: galleryImages,
        videoLinks: data.videos?.map((v: any) => v.video_url) || [],
        show_trip: data.show_trip
      };
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required");
      }

      let brochureImagePath;
      
      if (brochureFile) {
        const { data: brochureData, error: brochureError } = await supabase.storage
          .from('trip-photos')
          .upload(`brochures/${Date.now()}-${brochureFile.name}`, brochureFile);
        
        if (brochureError) throw brochureError;
        brochureImagePath = brochureData.path;
      }

      // Format dates in YYYY-MM-DD format without timezone issues
      const formattedStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      const spots = formData.get('spots') as string;
      
      // Prepare trip update data
      const updateData: any = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        location: formData.get('location') as TripLocation,
        gender: formData.get('gender') as TripGender,
        spots: spots ? parseInt(spots) : null,
        website_url: formData.get('websiteUrl') as string || null,
        organizer_name: formData.get('organizerName') as string,
        organizer_contact: formData.get('organizerContact') as string,
        show_trip: formData.get('show_trip') as string,
      };

      // Set brochure image if uploaded
      if (brochureImagePath) {
        updateData.brochure_image_path = brochureImagePath;
      }
      
      // Set thumbnail image if selected
      if (rawThumbnailPath) {
        updateData.thumbnail_image = rawThumbnailPath;
      } else {
        // If no thumbnail selected, set to null to use brochure as default
        updateData.thumbnail_image = null;
      }

      // Update trip data
      const { error: tripError } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', trip?.id);

      if (tripError) throw tripError;

      // Upload new gallery images
      if (galleryFiles.length > 0) {
        const galleryPromises = galleryFiles.map(async (file) => {
          const { data: imageData, error: imageError } = await supabase.storage
            .from('trip-photos')
            .upload(`gallery/${Date.now()}-${file.name}`, file);
          
          if (imageError) throw imageError;

          const { error: galleryError } = await supabase
            .from('trip_gallery')
            .insert({
              trip_id: trip?.id,
              image_path: imageData.path,
            });
          
          if (galleryError) throw galleryError;
        });

        await Promise.all(galleryPromises);
      }

      // Update video links
      if (trip) {
        // Delete all existing video links
        await supabase
          .from('trip_videos')
          .delete()
          .eq('trip_id', trip.id);
        
        // Add new video links
        if (videoLinks.length > 0) {
          const videoData = videoLinks.map(url => ({
            trip_id: trip.id,
            video_url: url
          }));
          
          const { error: videoError } = await supabase
            .from('trip_videos')
            .insert(videoData);
          
          if (videoError) throw videoError;
        }
      }

      toast({
        title: "Success",
        description: "Trip updated successfully",
      });
      
      navigate("/admin");
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update trip",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrochureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setBrochureFile(file);
      setBrochurePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryFiles(prevFiles => [...prevFiles, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prevPreviews => [...prevPreviews, ...previews]);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    try {
      // Find the image path
      const image = existingGalleryImages.find(img => img.id === id);
      if (!image) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('trip-photos')
        .remove([image.path]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('trip_gallery')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;

      // Update state
      setExistingGalleryImages(prev => prev.filter(img => img.id !== id));

      // If this was the thumbnail, reset it
      if (thumbnailImage && thumbnailImage.includes(image.path.split('/').pop() || '')) {
        setThumbnailImage(null);
        
        // Also update the trip record to remove the thumbnail reference
        await supabase
          .from('trips')
          .update({ thumbnail_image: null })
          .eq('id', trip?.id);
      }

      toast({
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleAddVideoLink = () => {
    if (newVideoLink && !videoLinks.includes(newVideoLink)) {
      setVideoLinks([...videoLinks, newVideoLink]);
      setNewVideoLink("");
    }
  };

  const handleRemoveVideoLink = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index));
  };

  // Extract raw paths from public URLs for saving to DB
  const getRawPathFromPublicUrl = (publicUrl: string) => {
    if (!publicUrl) return null;
    // Extract just the filename part after the last slash
    const parts = publicUrl.split('/');
    const filename = parts[parts.length - 1];
    
    // Check if it's a brochure or gallery image
    if (trip?.brochureImage && trip.brochureImage.includes(filename)) {
      return `brochures/${filename}`;
    } else {
      return `gallery/${filename}`;
    }
  };

  const rawThumbnailPath = thumbnailImage ? getRawPathFromPublicUrl(thumbnailImage) : null;

  useEffect(() => {
    return () => {
      if (brochurePreview) URL.revokeObjectURL(brochurePreview);
      galleryPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [brochurePreview, galleryPreviews]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Trip not found</h2>
          <p className="mb-4">The trip you're looking for doesn't exist or has been removed.</p>
          <Link to="/admin">
            <Button>Back to Admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display text-gray-900">Edit Trip</h1>
            <Link to="/admin">
              <Button variant="outline">Back to Trips</Button>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Trip Name *</Label>
                  <Input id="name" name="name" defaultValue={trip.name} required />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea id="description" name="description" defaultValue={trip.description} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Destination *</Label>
                    <Select name="location" defaultValue={trip.location}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="united_states">United States</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                        <SelectItem value="israel">Israel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gender">Single-Gender/Co-ed *</Label>
                    <Select name="gender" defaultValue={trip.gender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Co-ed</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="spots">Available Spots (optional)</Label>
                  <Input
                    id="spots"
                    name="spots"
                    type="number"
                    min="1"
                    defaultValue={trip.spots}
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL (optional)</Label>
                  <Input 
                    id="websiteUrl" 
                    name="websiteUrl" 
                    type="url" 
                    defaultValue={trip.websiteUrl} 
                  />
                </div>

                <div>
                  <Label htmlFor="show_trip">Trip Status *</Label>
                  <Select name="show_trip" defaultValue={trip.show_trip || "Hidden"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Show">Show</SelectItem>
                      <SelectItem value="Hidden">Hidden</SelectItem>
                      <SelectItem value="Deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brochureImage">Brochure Image</Label>
                  {trip.brochureImage && !brochurePreview && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-2">Current brochure image:</p>
                      <ImagePreview
                        src={trip.brochureImage}
                        alt="Current brochure"
                        showDelete={false}
                      />
                    </div>
                  )}
                  <Input
                    id="brochureImage"
                    type="file"
                    accept="image/*"
                    onChange={handleBrochureChange}
                  />
                  {brochurePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">New brochure image:</p>
                      <ImagePreview
                        src={brochurePreview}
                        alt="Brochure preview"
                        onDelete={() => {
                          setBrochureFile(null);
                          setBrochurePreview(prev => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                          const input = document.getElementById('brochureImage') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images</Label>
                  {existingGalleryImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Current gallery images:</p>
                      <div className="flex flex-wrap gap-2">
                        {existingGalleryImages.map((image) => (
                          <div key={image.id} className="relative">
                            <ImagePreview
                              src={getPublicUrl(image.path)}
                              alt="Gallery image"
                              onDelete={() => handleDeleteGalleryImage(image.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Input
                    id="gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                  />
                  
                  {galleryPreviews.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">New gallery images:</p>
                      <div className="flex flex-wrap gap-2">
                        {galleryPreviews.map((preview, index) => (
                          <ImagePreview
                            key={preview}
                            src={preview}
                            alt={`Gallery image ${index + 1}`}
                            onDelete={() => {
                              const newFiles = [...galleryFiles];
                              newFiles.splice(index, 1);
                              setGalleryFiles(newFiles);
                              
                              const newPreviews = [...galleryPreviews];
                              URL.revokeObjectURL(preview);
                              newPreviews.splice(index, 1);
                              setGalleryPreviews(newPreviews);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail selection if gallery images exist */}
                {(galleryPreviews.length > 0 || (trip?.gallery && trip.gallery.length > 0)) ? (
                  <div className="space-y-2">
                    <Label>Thumbnail Image</Label>
                    <ThumbnailSelector 
                      images={[
                        ...(trip?.gallery || []),
                        ...galleryPreviews
                      ]}
                      selectedThumbnail={thumbnailImage}
                      onSelect={setThumbnailImage}
                      brochureImage={brochurePreview || trip?.brochureImage || null}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Video Links</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newVideoLink}
                      onChange={(e) => setNewVideoLink(e.target.value)}
                      placeholder="Enter YouTube or Vimeo embed URL"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddVideoLink}>Add</Button>
                  </div>
                  
                  {videoLinks.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {videoLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <div className="flex-1 truncate">{link}</div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveVideoLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="organizerName">Organizer Name *</Label>
                  <Input 
                    id="organizerName" 
                    name="organizerName" 
                    defaultValue={trip.organizer.name} 
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="organizerContact">Organizer Contact *</Label>
                  <Input 
                    id="organizerContact" 
                    name="organizerContact" 
                    defaultValue={trip.organizer.contact} 
                    required 
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">* Required fields</div>

              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Trip...
                    </>
                  ) : "Update Trip"}
                </Button>
                
                <Link to="/admin">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTrip;
