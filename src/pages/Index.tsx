import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Calendar, MapPin, User, Home, Heart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Trip } from "@/types/trip";
import { Skeleton } from "@/components/ui/skeleton";
import ImageViewer from "@/components/ImageViewer";

const DEFAULT_IMAGE = "/lovable-uploads/f5be19fc-8a6f-428a-b7ed-07d78c2b67fd.png";

const getPublicUrl = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_IMAGE;
  const { data: { publicUrl } } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(path);
  return publicUrl || DEFAULT_IMAGE;
};

const fetchTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      gallery:trip_gallery(image_path),
      videos:trip_videos(video_url)
    `)
    .order('start_date', { ascending: true });
  
  if (error) throw error;
  
  return data.map(trip => ({
    id: trip.id,
    name: trip.name,
    description: trip.description || "",
    startDate: trip.start_date,
    endDate: trip.end_date,
    websiteUrl: trip.website_url,
    organizer: {
      name: trip.organizer_name,
      contact: trip.organizer_contact
    },
    gender: trip.gender,
    location: trip.location,
    spots: trip.spots,
    brochureImage: getPublicUrl(trip.brochure_image_path),
    gallery: trip.gallery?.map(g => getPublicUrl(g.image_path)) || [],
    videoLinks: trip.videos?.map(v => v.video_url) || []
  }));
};

const Index = () => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    gender: {
      coed: true,
      male: true,
      female: true,
    },
    location: {
      us: true,
      international: true,
    }
  });

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
  });

  const groupTripsByMonth = (trips: Trip[]) => {
    return trips?.reduce((acc, trip) => {
      const month = format(new Date(trip.startDate), 'MMMM yyyy');
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(trip);
      return acc;
    }, {} as Record<string, Trip[]>);
  };

  const TripCard = ({ trip }: { trip: Trip }) => (
    <div
      key={trip.id}
      className="relative group overflow-hidden"
      onClick={() => setSelectedTrip(trip)}
    >
      <div className="relative h-[280px]">
        <img
          src={trip.brochureImage || DEFAULT_IMAGE}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-2xl font-bold mb-3">{trip.name}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm capitalize">{trip.location}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1">
              <User className="w-4 h-4" />
              <span className="text-sm capitalize">{trip.gender || 'Mixed'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white border-none"
            >
              Learn More
            </Button>
            {trip.spots != null && (
              <Button 
                variant="outline" 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                {trip.spots} spots left
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Error loading trips</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="font-['Pacifico'] text-xl text-primary">TripTopia</div>
          <Link to="/add-trip">
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span>Add Trip</span>
            </Button>
          </Link>
        </div>
      </nav>

      <div className="mt-14 px-4 py-3 max-w-7xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search trips..."
            className="w-full h-10 pl-10 pr-4 bg-white rounded-full border-none shadow-sm text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 shadow-sm whitespace-nowrap"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>
          
          <div className="hidden md:grid grid-cols-2 gap-6 bg-white p-4 shadow-sm">
            <div>
              <h3 className="font-medium mb-3">Single-Gender/Co-ed</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="coed"
                    checked={filters.gender.coed}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        gender: { ...prev.gender, coed: checked === true }
                      }))
                    }
                  />
                  <label htmlFor="coed" className="text-sm">Co-ed</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="male"
                    checked={filters.gender.male}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        gender: { ...prev.gender, male: checked === true }
                      }))
                    }
                  />
                  <label htmlFor="male" className="text-sm">Male</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="female"
                    checked={filters.gender.female}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        gender: { ...prev.gender, female: checked === true }
                      }))
                    }
                  />
                  <label htmlFor="female" className="text-sm">Female</label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Destination</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="us"
                    checked={filters.location.us}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        location: { ...prev.location, us: checked === true }
                      }))
                    }
                  />
                  <label htmlFor="us" className="text-sm">US</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="international"
                    checked={filters.location.international}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({
                        ...prev,
                        location: { ...prev.location, international: checked === true }
                      }))
                    }
                  />
                  <label htmlFor="international" className="text-sm">International</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : trips && trips.length > 0 ? (
          Object.entries(groupTripsByMonth(trips)).map(([month, monthTrips]) => (
            <div key={month} className="mt-8 first:mt-4">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{month}</h2>
                <div className="h-1 w-16 bg-[#FF6B00]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center mt-8">
            <h3 className="text-lg font-medium">No trips found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="grid grid-cols-4 h-14">
          <button className="flex flex-col items-center justify-center text-primary">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-0.5">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-400">
            <Search className="w-5 h-5" />
            <span className="text-xs mt-0.5">Search</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-400">
            <Heart className="w-5 h-5" />
            <span className="text-xs mt-0.5">Saved</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-400">
            <User className="w-5 h-5" />
            <span className="text-xs mt-0.5">Profile</span>
          </button>
        </div>
      </nav>

      {selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-t-xl h-[90vh] absolute bottom-0 left-0 right-0 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b flex items-center justify-between p-4">
              <h2 className="text-lg font-medium">Trip Details</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedTrip(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="col-span-4">
                  <img
                    src={selectedTrip.brochureImage || DEFAULT_IMAGE}
                    alt={selectedTrip.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(selectedTrip.brochureImage || DEFAULT_IMAGE)}
                  />
                </div>
                {selectedTrip.gallery?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Trip image ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
              
              <h3 className="text-xl font-medium mb-2">{selectedTrip.name}</h3>
              <p className="text-gray-600 mb-4">{selectedTrip.description}</p>

              <div className="grid gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-gray-600">
                    {format(new Date(selectedTrip.startDate), "MMM d")} -{" "}
                    {format(new Date(selectedTrip.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-gray-600 capitalize">{selectedTrip.location}</span>
                </div>
                {selectedTrip.spots != null && (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="text-gray-600">{selectedTrip.spots} spots available</span>
                  </div>
                )}
              </div>

              {selectedTrip.videoLinks && selectedTrip.videoLinks.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Videos</h4>
                  <div className="space-y-2">
                    {selectedTrip.videoLinks.map((video, index) => (
                      <div key={index} className="aspect-video">
                        <iframe
                          src={video}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                {selectedTrip.websiteUrl && (
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(selectedTrip.websiteUrl, "_blank")}
                  >
                    Learn More
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  Contact Organizer
                </Button>
                <Button variant="outline" className="w-full">
                  Share Trip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <ImageViewer
          src={selectedImage}
          alt="Trip image"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default Index;
