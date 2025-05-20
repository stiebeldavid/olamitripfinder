
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  ExternalLink,
  X,
  Video,
  Download
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Trip, TripImage } from "@/types/trip";
import TripPrice from "./TripPrice";
import ImageViewer from "./ImageViewer";

const DEFAULT_IMAGE = "/placeholder.svg";

const getPublicUrl = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_IMAGE;
  
  // Check if path is already a full URL
  if (path.startsWith('http')) {
    return path;
  }
  
  try {
    // Fix: Ensure we're working with a valid path that has proper prefixes
    const fullPath = path.includes('/') ? path : `trip-photos/${path}`;
    
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('trip-photos').getPublicUrl(fullPath);
    
    console.log(`Getting public URL for ${fullPath}: ${publicUrl}`);
    return publicUrl || DEFAULT_IMAGE;
  } catch (error) {
    console.error(`Failed to get public URL for ${path}:`, error);
    return DEFAULT_IMAGE;
  }
};

const TripInfo = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  
  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) throw new Error("Trip ID is required");

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_images:trip_images(id, image_path, is_thumbnail, is_flyer),
          videos:trip_videos(id, video_url)
        `)
        .eq('trip_id', parseInt(tripId))
        .single();

      if (error) throw error;
      if (!data) throw new Error('Trip not found');

      // Process images with the new structure
      const images: TripImage[] = data.trip_images?.map((img: any) => {
        console.log("Processing image:", img);
        
        // Fix: Ensure image_path is properly formatted
        const imagePath = img.image_path || "";
        console.log("Raw image path:", imagePath);
        
        const url = getPublicUrl(imagePath);
        console.log("Generated public URL:", url);
        
        return {
          id: img.id,
          url: url,
          isThumbnail: img.is_thumbnail || false,
          isFlyer: img.is_flyer || false
        };
      }) || [];
      
      console.log('Processed images:', images);
      
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
        spots: data.spots,
        price: data.price,
        images: images,
        videoLinks: data.videos?.map((v: any) => v.video_url) || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Trip not found</h1>
          <p>The requested trip could not be found.</p>
        </div>
      </div>
    );
  }

  console.log("Trip images in render:", trip.images);
  
  const flyerImage = trip.images.find(img => img.isFlyer)?.url;
  const otherImages = trip.images.filter(img => !img.isFlyer);

  console.log("Flyer image:", flyerImage);
  console.log("Other images:", otherImages);

  const handleDownload = (imageUrl: string) => {
    // Extract the filename from the URL
    const filename = imageUrl.split('/').pop() || 'download.jpg';
    
    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    
    // Trigger click event to download the image
    anchor.click();
    
    // Clean up
    document.body.removeChild(anchor);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl md:text-4xl font-display font-medium mb-6">{trip?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {flyerImage && (
            <div className="mb-6">
              <div className="relative">
                <img
                  src={flyerImage}
                  alt={trip.name}
                  className="w-full rounded-lg object-cover max-h-[500px]"
                  onClick={() => setSelectedImageUrl(flyerImage || null)}
                  onError={(e) => {
                    console.error(`Failed to load flyer image: ${flyerImage}`);
                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                  }}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded">
                  Flyer Image
                </div>
              </div>
            </div>
          )}
          
          {trip?.description && (
            <div className="mb-6 prose max-w-none">
              <h2 className="text-xl font-semibold mb-2">About This Trip</h2>
              <p className="whitespace-pre-line">{trip.description}</p>
            </div>
          )}
          
          {otherImages.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Photos, Videos & Flyers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {otherImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="aspect-square cursor-pointer relative group"
                    onClick={() => setSelectedImageUrl(image.url)}
                  >
                    <img 
                      src={image.url} 
                      alt={`${trip.name} image ${index + 1}`} 
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.error(`Failed to load gallery image: ${image.url}`);
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      {image.isThumbnail && (
                        <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          Thumbnail
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {trip?.videoLinks && trip.videoLinks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {trip.videoLinks.map((videoUrl, index) => (
                  <div 
                    key={index} 
                    className="aspect-video bg-gray-100 rounded overflow-hidden cursor-pointer relative group"
                    onClick={() => setSelectedVideoUrl(videoUrl)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-xs text-center bg-black bg-opacity-60 text-white p-1 rounded">
                      Video {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="bg-gray-50 p-6 rounded-lg mb-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <span>
                {format(parseISO(trip.startDate), "MMM d")} - {format(parseISO(trip.endDate), "MMM d, yyyy")}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>
                {trip.location === "united_states" ? "United States" : 
                trip.location === "international" ? "International" : "Israel"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gray-500" />
              <span>
                {trip.gender === "mixed" ? "Co-ed" : 
                trip.gender === "male" ? "Men Only" : "Women Only"}
              </span>
            </div>
            
            {trip.spots && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-gray-500" />
                <span>{trip.spots} Available Spots</span>
              </div>
            )}

            {trip.price && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-emerald-600 font-semibold">{trip.price}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 my-4 pt-4">
              <h3 className="font-medium mb-2">Organized by:</h3>
              <p className="mb-1">{trip.organizer.name}</p>
              <p className="text-gray-600">{trip.organizer.contact}</p>
            </div>
            
            {trip.websiteUrl && (
              <div className="mt-4">
                <a href={trip.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full flex items-center justify-center gap-2">
                    Visit Website
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedImageUrl && (
        <ImageViewer 
          src={selectedImageUrl} 
          alt={trip?.name || "Trip image"}
          onClose={() => setSelectedImageUrl(null)} 
          onDownload={() => handleDownload(selectedImageUrl)}
          tripId={tripId}
        />
      )}

      {selectedVideoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedVideoUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="w-full max-w-4xl max-h-[80vh] aspect-video">
            <iframe
              src={selectedVideoUrl}
              title="Video Player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripInfo;
