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
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Trip, TripGender, TripLocation } from "@/types/trip";
import { Skeleton } from "@/components/ui/skeleton";
import ImagePreview from "@/components/ImagePreview";

const EditTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [brochurePreview, setBrochurePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error("Trip ID is required");
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          gallery:trip_gallery(image_path),
          videos:trip_videos(video_url)
        `)
        .eq('trip_id', parseInt(tripId))
        .single();

      if (error) {
        console.error("Error fetching trip:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Trip not found");
      }

      // Process gallery images to get public URLs
      if (data.gallery) {
        data.gallery = await Promise.all(data.gallery.map(async (image: { image_path: string }) => {
          const { data: publicUrl } = supabase.storage
            .from('trip-photos')
            .getPublicUrl(image.image_path);
          return { ...image, publicUrl: publicUrl.publicUrl };
        }));
      }

      return data;
    },
  });

  useEffect(() => {
    if (trip) {
      setStartDate(new Date(trip.start_date));
      setEndDate(new Date(trip.end_date));
    }
  }, [trip]);

  useEffect(() => {
    return () => {
      if (brochurePreview) URL.revokeObjectURL(brochurePreview);
      galleryPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [brochurePreview, galleryPreviews]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      let brochureImagePath = trip?.brochure_image_path;
      if (brochureFile) {
        const { data: brochureData, error: brochureError } = await supabase.storage
          .from('trip-photos')
          .upload(`brochures/${Date.now()}-${brochureFile.name}`, brochureFile);
        
        if (brochureError) throw brochureError;
        brochureImagePath = brochureData.path;
      }

      if (!tripId) {
        throw new Error("Trip ID is required");
      }

      const { error: tripError } = await supabase
        .from('trips')
        .update({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          location: formData.get('location') as TripLocation,
          gender: formData.get('gender') as TripGender,
          spots: parseInt(formData.get('spots') as string) || null,
          website_url: formData.get('websiteUrl') as string || null,
          brochure_image_path: brochureImagePath,
          organizer_name: formData.get('organizerName') as string,
          organizer_contact: formData.get('organizerContact') as string,
        })
        .eq('trip_id', parseInt(tripId));

      if (tripError) throw tripError;

      if (galleryFiles.length > 0) {
        const galleryPromises = galleryFiles.map(async (file) => {
          const { data: imageData, error: imageError } = await supabase.storage
            .from('trip-photos')
            .upload(`gallery/${Date.now()}-${file.name}`, file);
          
          if (imageError) throw imageError;

          const { error: galleryError } = await supabase
            .from('trip_gallery')
            .insert({
              trip_id: trip.id,
              image_path: imageData.path,
            });
          
          if (galleryError) throw galleryError;
        });

        await Promise.all(galleryPromises);
      }

      toast({
        title: "Success",
        description: "Trip updated successfully",
      });

      navigate('/');
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "Failed to update trip. Please try again.",
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
      setGalleryFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(previews);
    }
  };

  const handleDeleteGalleryImage = async (imagePath: string) => {
    try {
      const { error: deleteDbError } = await supabase
        .from('trip_gallery')
        .delete()
        .eq('image_path', imagePath);
      
      if (deleteDbError) throw deleteDbError;
      
      const { error: deleteStorageError } = await supabase.storage
        .from('trip-photos')
        .remove([imagePath]);
      
      if (deleteStorageError) throw deleteStorageError;

      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      
      toast({
        title: "Success",
        description: "Gallery image removed successfully",
      });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Error",
        description: "Failed to remove gallery image",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBrochure = async () => {
    if (!trip?.brochure_image_path) return;

    try {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ brochure_image_path: null })
        .eq('trip_id', parseInt(tripId as string));
      
      if (updateError) throw updateError;
      
      const { error: deleteError } = await supabase.storage
        .from('trip-photos')
        .remove([trip.brochure_image_path]);
      
      if (deleteError) throw deleteError;
      
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      
      toast({
        title: "Success",
        description: "Brochure image removed successfully",
      });
    } catch (error) {
      console.error('Error deleting brochure:', error);
      toast({
        title: "Error",
        description: "Failed to remove brochure image",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Error Loading Trip</h1>
            <p className="text-gray-600 mb-4">Unable to load trip details. Please try again later.</p>
            <p className="text-gray-600 mb-4 text-sm">{error instanceof Error ? error.message : "Unknown error"}</p>
            <Link to="/">
              <Button>Back to Trips</Button>
            </Link>
          </div>
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
            <Link to="/">
              <Button variant="outline">Back to Trips</Button>
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Trip Name</Label>
                  <Input id="name" name="name" defaultValue={trip.name} required />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={trip.description || ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
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
                    <Label>End Date</Label>
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
                    <Label htmlFor="location">Location</Label>
                    <Select name="location" defaultValue={trip.location}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="israel">Israel</SelectItem>
                        <SelectItem value="united_states">United States</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" defaultValue={trip.gender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="male">Male Only</SelectItem>
                        <SelectItem value="female">Female Only</SelectItem>
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
                    defaultValue={trip.website_url || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brochureImage">
                    Update Brochure Image (current: {trip.brochure_image_path || "none"})
                  </Label>
                  <Input
                    id="brochureImage"
                    type="file"
                    accept="image/*"
                    onChange={handleBrochureChange}
                  />
                  {(brochurePreview || trip.brochure_image_path) && (
                    <div className="mt-2">
                      <ImagePreview
                        src={brochurePreview || supabase.storage
                          .from('trip-photos')
                          .getPublicUrl(trip.brochure_image_path || '').data.publicUrl}
                        alt="Brochure preview"
                        onDelete={async () => {
                          if (brochurePreview) {
                            setBrochureFile(null);
                            setBrochurePreview(prev => {
                              if (prev) URL.revokeObjectURL(prev);
                              return null;
                            });
                            const input = document.getElementById('brochureImage') as HTMLInputElement;
                            if (input) input.value = '';
                          } else {
                            await handleDeleteBrochure();
                          }
                        }}
                        showDelete={false}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gallery">Add More Gallery Images</Label>
                  <Input
                    id="gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trip.gallery?.map((image: { image_path: string; publicUrl: string }) => (
                      <ImagePreview
                        key={image.image_path}
                        src={image.publicUrl}
                        alt="Gallery image"
                        onDelete={() => handleDeleteGalleryImage(image.image_path)}
                        showDelete={false}
                      />
                    ))}
                    {galleryPreviews.map((preview, index) => (
                      <ImagePreview
                        key={preview}
                        src={preview}
                        alt={`New gallery image ${index + 1}`}
                        onDelete={() => {
                          const newFiles = [...galleryFiles];
                          newFiles.splice(index, 1);
                          setGalleryFiles(newFiles);
                          
                          const newPreviews = [...galleryPreviews];
                          URL.revokeObjectURL(preview);
                          newPreviews.splice(index, 1);
                          setGalleryPreviews(newPreviews);
                          
                          if (newFiles.length === 0) {
                            const input = document.getElementById('gallery') as HTMLInputElement;
                            if (input) input.value = '';
                          }
                        }}
                        showDelete={false}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="organizerName">Organizer Name</Label>
                  <Input 
                    id="organizerName" 
                    name="organizerName" 
                    defaultValue={trip.organizer_name}
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="organizerContact">Organizer Contact</Label>
                  <Input 
                    id="organizerContact" 
                    name="organizerContact" 
                    defaultValue={trip.organizer_contact}
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Trip...
                  </>
                ) : (
                  "Update Trip"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTrip;
