import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, CalendarDays, MapPin, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Trip } from '@/types/trip';
import TripInfo from '@/components/TripInfo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Default image if no thumbnail is available
const DEFAULT_IMAGE = '/placeholder.svg';

const getPublicUrl = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_IMAGE;
  try {
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('trip-photos').getPublicUrl(path);
    return publicUrl || DEFAULT_IMAGE;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return DEFAULT_IMAGE;
  }
};

const transformTripsData = (data: any[] | null): Trip[] => {
  if (!data) return [];
  
  return data.map(trip => {
    // Determine which image to use as the card thumbnail
    let thumbnailImage = DEFAULT_IMAGE;
    
    if (trip.thumbnail_image) {
      // If a thumbnail is specifically selected, use that
      thumbnailImage = getPublicUrl(trip.thumbnail_image);
    } else if (trip.brochure_image_path) {
      // Otherwise use the brochure image
      thumbnailImage = getPublicUrl(trip.brochure_image_path);
    }
    
    // Log for debugging
    console.log(`Trip ${trip.name} - Thumbnail: ${trip.thumbnail_image}, Using: ${thumbnailImage}`);
    
    return {
      id: trip.id,
      trip_id: trip.trip_id,
      name: trip.name,
      description: trip.description || '',
      startDate: trip.start_date,
      endDate: trip.end_date,
      gender: trip.gender,
      location: trip.location,
      spots: trip.spots,
      organizer: {
        name: trip.organizer_name,
        contact: trip.organizer_contact,
      },
      websiteUrl: trip.website_url,
      thumbnailImage,
      price: trip.price,
      isInternship: trip.is_internship
    };
  });
};

export default function IndexPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedInternship, setSelectedInternship] = useState<string>('all');
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select()
        .eq('show_trip', 'Show')
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching trips:', error);
        throw error;
      }

      return transformTripsData(data);
    }
  });

  const filteredTrips = trips.filter(trip => {
    let locationMatch = selectedLocation === 'all' || trip.location === selectedLocation;
    let internshipMatch = true;
    
    if (selectedInternship === 'internship') {
      internshipMatch = trip.isInternship === true;
    } else if (selectedInternship === 'non-internship') {
      internshipMatch = !trip.isInternship;
    }
    
    return locationMatch && internshipMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold">Find Your Perfect Trip</h1>
            <p className="mt-4 text-xl text-blue-100">Discover amazing travel experiences tailored just for you.</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" onClick={() => setSelectedLocation('all')}>All Destinations</TabsTrigger>
              <TabsTrigger value="united_states" onClick={() => setSelectedLocation('united_states')}>United States</TabsTrigger>
              <TabsTrigger value="international" onClick={() => setSelectedLocation('international')}>International</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="w-full md:w-auto">
            <Select onValueChange={setSelectedInternship} defaultValue="all">
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Trip Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="internship">Internships Only</SelectItem>
                <SelectItem value="non-internship">Non-Internships</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-72 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div 
                key={trip.id} 
                className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]"
                onClick={() => setViewingTrip(trip)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={trip.thumbnailImage} 
                    alt={trip.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      // If image fails to load, fallback to default
                      console.log(`Image failed to load: ${(e.target as HTMLImageElement).src}`);
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-sm rounded">
                    {trip.location === 'united_states' ? 'United States' : trip.location === 'international' ? 'International' : 'Israel'}
                  </div>
                  {trip.isInternship && (
                    <Badge 
                      className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600"
                    >
                      <Briefcase className="w-3 h-3 mr-1" />
                      Internship
                    </Badge>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display font-semibold text-lg text-white">{trip.name}</h3>
                    {trip.price && (
                      <p className="text-white text-sm mt-1 font-medium">{trip.price}</p>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center text-gray-600">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {trip.spots && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">{trip.spots} spots available</span>
                    </div>
                  )}
                  <Button className="w-full">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-gray-700">No trips found</h3>
            <p className="text-gray-500 mt-2">Try changing your filter criteria</p>
          </div>
        )}
      </div>

      {viewingTrip && <TripInfo trip={viewingTrip} onClose={() => setViewingTrip(null)} />}
    </div>
  );
}
