
import { useState } from "react";
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

const AddTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

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
    const spotsValue = formData.get('spots') as string;

    try {
      // Upload brochure image if exists
      let brochureImagePath = null;
      if (brochureFile) {
        const { data: brochureData, error: brochureError } = await supabase.storage
          .from('trip-photos')
          .upload(`brochures/${Date.now()}-${brochureFile.name}`, brochureFile);
        
        if (brochureError) {
          console.error('Brochure upload error:', brochureError);
          throw new Error(`Failed to upload brochure: ${brochureError.message}`);
        }
        brochureImagePath = brochureData.path;
      }

      // Create trip record with more detailed error logging
      const tripData = {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        location: formData.get('location') as TripLocation,
        gender: formData.get('gender') as TripGender,
        spots: spotsValue ? parseInt(spotsValue) : null,
        website_url: (formData.get('websiteUrl') as string) || null,
        brochure_image_path: brochureImagePath,
        organizer_name: formData.get('organizerName') as string,
        organizer_contact: formData.get('organizerContact') as string,
      };

      console.log('Attempting to create trip with data:', tripData);

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (tripError) {
        console.error('Trip creation error:', tripError);
        throw new Error(`Failed to create trip: ${tripError.message}`);
      }

      // Upload gallery images if any
      if (galleryFiles.length > 0) {
        const galleryPromises = galleryFiles.map(async (file) => {
          const { data: imageData, error: imageError } = await supabase.storage
            .from('trip-photos')
            .upload(`gallery/${Date.now()}-${file.name}`, file);
          
          if (imageError) {
            console.error('Gallery image upload error:', imageError);
            throw new Error(`Failed to upload gallery image: ${imageError.message}`);
          }

          const { error: galleryError } = await supabase
            .from('trip_gallery')
            .insert({
              trip_id: trip.id,
              image_path: imageData.path,
            });
          
          if (galleryError) {
            console.error('Gallery record creation error:', galleryError);
            throw new Error(`Failed to create gallery record: ${galleryError.message}`);
          }
        });

        await Promise.all(galleryPromises);
      }

      toast({
        title: "Success",
        description: "Trip created successfully",
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display text-gray-900">Add New Trip</h1>
            <Link to="/">
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
                    <Label htmlFor="location">Location *</Label>
                    <Select name="location" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="israel">Israel</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select name="gender" defaultValue="mixed">
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
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL (optional)</Label>
                  <Input id="websiteUrl" name="websiteUrl" type="url" />
                </div>

                <div>
                  <Label htmlFor="brochureImage">Brochure Image (optional)</Label>
                  <Input
                    id="brochureImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setBrochureFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="gallery">Gallery Images (optional)</Label>
                  <Input
                    id="gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setGalleryFiles(Array.from(e.target.files));
                      }
                    }}
                  />
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
