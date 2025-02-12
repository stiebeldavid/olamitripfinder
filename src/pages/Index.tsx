import { useState } from "react";
import { Search, Filter, Calendar, MapPin, User, Home, Heart, Plus, X, Phone } from "lucide-react";
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
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    gender: {
      mixed: true,
      male: true,
      female: true,
    },
    location: {
      united_states: true,
      international: true,
    }
  });

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
  });

  const filteredTrips = trips?.filter(trip => {
    const searchMatch = trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       trip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       trip.organizer.name.toLowerCase().includes(searchQuery.toLowerCase());

    const genderMatch = (trip.gender === 'mixed' && filters.gender.mixed) ||
                       (trip.gender === 'male' && filters.gender.male) ||
                       (trip.gender === 'female' && filters.gender.female);

    const locationMatch = (trip.location === 'united_states' && filters.location.united_states) ||
                         (trip.location === 'international' && filters.location.international);

    return searchMatch && genderMatch && locationMatch;
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
              <span className="text-sm capitalize">{trip.location.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1">
              <User className="w-4 h-4" />
              <span className="text-sm capitalize">{trip.gender === 'mixed' ? 'Co-ed' : trip.gender}</span>
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

  const FilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 md:sticky md:top-20 md:self-start">
        <div>
          <h3 className="font-medium mb-4">Trip Type</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Checkbox 
                id="mixed"
                checked={filters.gender.mixed}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({
                    ...prev,
                    gender: { ...prev.gender, mixed: checked === true }
                  }))
                }
              />
              <span className="text-sm">Co-ed</span>
            </label>
            <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
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
              <span className="text-sm">Male</span>
            </label>
            <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
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
              <span className="text-sm">Female</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4">Destination</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Checkbox 
                id="united_states"
                checked={filters.location.united_states}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({
                    ...prev,
                    location: { ...prev.location, united_states: checked === true }
                  }))
                }
              />
              <span className="text-sm">United States</span>
            </label>
            <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
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
              <span className="text-sm">International</span>
            </label>
          </div>
        </div>
      </div>

      <div>
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
        ) : filteredTrips && filteredTrips.length > 0 ? (
          Object.entries(groupTripsByMonth(filteredTrips)).map(([month, monthTrips]) => (
            <div key={month} className="mt-8 first:mt-0">
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
          <div className="font-['Playfair_Display'] text-xl text-primary">Olami Trip Finder</div>
          <Button 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setShowContactInfo(true)}
          >
            <Phone className="w-4 h-4" />
            <span>Contact</span>
          </Button>
        </div>
      </nav>

      <div className="relative">
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/16666368-d298-47be-9ef8-c608163578c5.png"
            alt="Students enjoying their trip"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
        </div>
        <div className="relative pt-24 pb-16 px-4 md:pt-32 md:pb-24">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 font-['Playfair_Display'] text-white">
              Welcome to Olami Trip Finder
            </h1>
            <p className="text-lg md:text-xl max-w-3xl leading-relaxed text-gray-100">
              If you're an Olami educator in North America, you've come to the right place to find comprehensive information about upcoming trips to maximize your students' growth and to build your learning and growth community. Your exploration of all that's available begins here!
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 px-4 py-3 max-w-7xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          
          {isFilterOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
              <div className="bg-white rounded-t-xl h-[90vh] absolute bottom-0 left-0 right-0 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b flex items-center justify-between p-4">
                  <h2 className="text-lg font-medium">Filters</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <FilterSection />
                  <Button 
                    className="w-full mt-6"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="hidden md:block">
            <FilterSection />
          </div>
        </div>
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

      {showContactInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-medium">Have Questions?</h2>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowContactInfo(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-medium">Contact Rabbi Ari Gruen</p>
              <p className="text-gray-600">
                <a href="mailto:agruen@olami.org" className="hover:text-primary">
                  agruen@olami.org
                </a>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">+972 50-473-7438</span>
                <a
                  href="https://wa.me/+97250473438"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#25D366] text-white px-3 py-1 rounded-full text-sm hover:bg-[#22BF5B] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-1" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
