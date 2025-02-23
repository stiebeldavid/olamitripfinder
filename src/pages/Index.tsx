
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Trip } from "@/types/trip";

export default function Index() {
  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('show_trip', 'Show')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match our Trip interface
      return data.map((trip) => ({
        id: trip.id,
        trip_id: trip.trip_id,
        name: trip.name,
        description: trip.description,
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
        brochureImage: trip.brochure_image_path
      })) as Trip[];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display">Trips</h1>
        <Link to="/add-trip">
          <Button>Add Trip</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips?.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{trip.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {trip.description || "No description available"}
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Start: {new Date(trip.startDate).toLocaleDateString()}</p>
                <p>End: {new Date(trip.endDate).toLocaleDateString()}</p>
                <p>Location: {trip.location}</p>
                <p>Gender: {trip.gender}</p>
                {trip.spots && <p>Available Spots: {trip.spots}</p>}
              </div>
              <div className="mt-4 flex justify-end">
                <Link to={`/edit-trip/${trip.trip_id}`}>
                  <Button variant="outline">Edit Trip</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
