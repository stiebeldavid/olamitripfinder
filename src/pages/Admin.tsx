
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Copy, Eye, EyeOff } from "lucide-react";
import { Trip, TripLocation } from "@/types/trip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeletedTrips, setShowDeletedTrips] = useState(false);
  const { toast } = useToast();

  const { data: trips, refetch } = useQuery({
    queryKey: ['admin-trips', showDeletedTrips],
    queryFn: async () => {
      let query = supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });
        
      // Only filter out deleted trips if showDeletedTrips is false
      if (!showDeletedTrips) {
        query = query.neq('show_trip', 'Deleted');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
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
        brochureImage: trip.brochure_image_path,
        show_trip: trip.show_trip
      })) as Trip[];
    },
    enabled: isAuthenticated
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "olami2025") {
      setIsAuthenticated(true);
      toast({
        title: "Success",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    const { error } = await supabase
      .from('trips')
      .update({ show_trip: newStatus })
      .eq('id', tripId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Trip status updated successfully",
      });
      refetch();
    }
  };

  const toggleShowDeletedTrips = () => {
    setShowDeletedTrips(prev => !prev);
  };

  const duplicateTrip = async (trip: Trip) => {
    try {
      setIsDuplicating(true);

      // Get the next available trip_id
      const { data: maxTripIdResult } = await supabase
        .from('trips')
        .select('trip_id')
        .order('trip_id', { ascending: false })
        .limit(1)
        .single();

      const newTripId = (maxTripIdResult?.trip_id || 0) + 1;

      // Copy brochure image if it exists
      let newBrochureImagePath = null;
      if (trip.brochureImage) {
        const fileName = trip.brochureImage.split('/').pop();
        if (fileName) {
          const { data: brochureFile } = await supabase.storage
            .from('trip-photos')
            .download(`brochures/${fileName}`);

          if (brochureFile) {
            const newFileName = `brochures/${Date.now()}-${fileName}`;
            const { data: uploadedFile } = await supabase.storage
              .from('trip-photos')
              .upload(newFileName, brochureFile);

            if (uploadedFile) {
              newBrochureImagePath = newFileName;
            }
          }
        }
      }

      // Create the new trip with the new trip_id
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          trip_id: newTripId, // Using the calculated next trip_id
          name: `${trip.name} - Copy`,
          description: trip.description,
          start_date: trip.startDate,
          end_date: trip.endDate,
          location: trip.location as TripLocation,
          gender: trip.gender,
          spots: trip.spots,
          website_url: trip.websiteUrl,
          brochure_image_path: newBrochureImagePath,
          organizer_name: trip.organizer.name,
          organizer_contact: trip.organizer.contact,
          show_trip: 'Hidden' // Start as hidden by default
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Get and copy gallery images
      const { data: galleryImages } = await supabase
        .from('trip_gallery')
        .select('image_path')
        .eq('trip_id', trip.id);

      if (galleryImages && galleryImages.length > 0) {
        for (const image of galleryImages) {
          const fileName = image.image_path.split('/').pop();
          if (fileName) {
            const { data: galleryFile } = await supabase.storage
              .from('trip-photos')
              .download(`gallery/${fileName}`);

            if (galleryFile) {
              const newFileName = `gallery/${Date.now()}-${fileName}`;
              const { data: uploadedFile } = await supabase.storage
                .from('trip-photos')
                .upload(newFileName, galleryFile);

              if (uploadedFile) {
                await supabase
                  .from('trip_gallery')
                  .insert({
                    trip_id: newTrip.id,
                    image_path: newFileName
                  });
              }
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Trip duplicated successfully",
      });
      refetch();
    } catch (error) {
      console.error('Error duplicating trip:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate trip",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-display text-gray-900">
              Admin Access
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Enter Admin Panel
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display">Admin Panel - All Trips</h1>
        <div className="space-x-4">
          <Link to="/">
            <Button variant="outline">Back to Trips</Button>
          </Link>
          <Link to="/add-trip">
            <Button>Add Trip</Button>
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-6">
        <Switch
          id="show-deleted"
          checked={showDeletedTrips}
          onCheckedChange={toggleShowDeletedTrips}
        />
        <Label htmlFor="show-deleted" className="cursor-pointer flex items-center">
          {showDeletedTrips ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Showing deleted trips
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Deleted trips hidden
            </>
          )}
        </Label>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips?.map((trip) => (
              <tr key={trip.id} className={trip.show_trip === "Deleted" ? "bg-gray-100" : ""}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{trip.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{trip.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    defaultValue={trip.show_trip}
                    onValueChange={(value) => handleStatusChange(trip.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Show">Show</SelectItem>
                      <SelectItem value="Hidden">Hidden</SelectItem>
                      <SelectItem value="Deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link to={`/edit-trip/${trip.trip_id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => duplicateTrip(trip)}
                      disabled={isDuplicating}
                    >
                      {isDuplicating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
