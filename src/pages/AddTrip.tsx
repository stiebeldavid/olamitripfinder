
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
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
import type { Trip, TripGender, TripLocation } from "@/types/trip";
import ImagePreview from "@/components/ImagePreview";
import ThumbnailSelector from "@/components/ThumbnailSelector";

const AddTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [brochurePreview, setBrochurePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);

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
      
      // Get the highest trip_id to generate a new one
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('trip_id')
        .order('trip_id', { ascending: false })
        .limit(1);
      
      if (tripsError) throw tripsError;
      
      const nextTripId = tripsData && tripsData.length > 0 ? tripsData[0].trip_id + 1 : 1;

      // Determine which gallery image to use as thumbnail, if any
      let thumbnailImagePath = null;
      if (thumbnailImage) {
        // Extract the filename from the thumbnailImage URL
        const parts = thumbnailImage.split('/');
        const filename = parts[parts.length - 1];
        thumbnailImagePath = `gallery/${filename}`;
      }

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          location: formData.get('location') as TripLocation,
          gender: formData.get('gender') as TripGender,
          spots: parseInt(formData.get('spots') as string) || null,
          website_url: formData.get('websiteUrl') as string || null,
          brochure_image_path: brochureImagePath,
          thumbnail_image: thumbnailImagePath,
          organizer_name: formData.get('organizerName') as string,
          organizer_contact: formData.get('organizerContact') as string,
          price: formData.get('price') as string || null, // Added price field
          show_trip: 'Hidden',
          trip_id: nextTripId
        })
        .select()
        .single();

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
        description: "Trip created successfully",
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
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

  useEffect(() => {
    return () => {
      if (brochurePreview) URL.revokeObjectURL(brochurePreview);
      galleryPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [brochurePreview, galleryPreviews]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display text-gray-900">Add New Trip</h1>
            <Link to="/admin">
              <Button variant="outline">Back to Trips</Button>
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Trip Name *</Label>
                  <Input id="name" name="name" required />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea id="description" name="description" />
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
                    <Select name="location" required>
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
                    <Select name="gender" defaultValue="mixed">
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
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (optional)</Label>
                  <Input
                    id="price"
                    name="price"
                    placeholder="e.g. $1,000 - $1,500"
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL (optional)</Label>
                  <Input id="websiteUrl" name="websiteUrl" type="url" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brochureImage">Brochure Image (optional)</Label>
                  <Input
                    id="brochureImage"
                    type="file"
                    accept="image/*"
                    onChange={handleBrochureChange}
                  />
                  {brochurePreview && (
                    <div className="mt-2">
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
                  <Label htmlFor="gallery">Gallery Images (optional)</Label>
                  <Input
                    id="gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                  />
                  {galleryPreviews.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {galleryPreviews.map((preview, index) => (
                        <ImagePreview
                          key={preview}
                          src={preview}
                          alt={`Gallery image ${index + 1}`}
                          onDelete={() => {
                            // If this was selected as thumbnail, reset thumbnail
                            if (thumbnailImage === preview) {
                              setThumbnailImage(null);
                            }
                            
                            // ... keep existing code (remove gallery image)
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
                          showDelete={true}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="organizerName">Organizer Name *</Label>
                  <Input id="organizerName" name="organizerName" required />
                </div>

                <div>
                  <Label htmlFor="organizerContact">Organizer Contact *</Label>
                  <Input id="organizerContact" name="organizerContact" required />
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">* Required fields</div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Trip...
                  </>
                ) : (
                  "Create Trip"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrip;
