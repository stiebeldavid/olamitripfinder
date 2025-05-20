import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Copy, Eye, EyeOff } from "lucide-react";
import { Trip, TripLocation, TripImage } from "@/types/trip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeletedTrips, setShowDeletedTrips] = useState(false);
  const { toast } = useToast();

  // Check if user is already authenticated from session storage
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("adminAuthenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: trips, refetch } = useQuery({
    queryKey: ['admin-trips', showDeletedTrips],
    queryFn: async () => {
      let query = supabase
        .from('trips')
        .select('*, trip_images(*)') // Include the trip images
        .order('start_date', { ascending: true });
        
      // Only filter out deleted trips if showDeletedTrips is false
      if (!showDeletedTrips) {
        query = query.neq('show_trip', 'Deleted');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map((trip) => {
        // Process trip_images into the format expected by our Trip type
        const images: TripImage[] = trip.trip_images ? trip.trip_images.map((img: any) => ({
          id: img.id,
          url: img.image_path,
          isThumbnail: img.is_thumbnail || false,
          isFlyer: img.is_flyer || false
        })) : [];

        return {
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
          images: images,
          price: trip.price,
          show_trip: trip.show_trip
        };
      }) as Trip[];
    },
    enabled: isAuthenticated
  });

  // Format date correctly without timezone offset
  const formatDate = (dateString: string) => {
    // Create a date with correct timezone handling
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "olami2025") {
      setIsAuthenticated(true);
      // Store authentication state in session storage
      sessionStorage.setItem("adminAuthenticated", "true");
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

      // Create the new trip with the new trip_id
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          trip_id: newTripId,
          name: `${trip.name} - Copy`,
          description: trip.description,
          start_date: trip.startDate,
          end_date: trip.endDate,
          location: trip.location as TripLocation,
          gender: trip.gender,
          spots: trip.spots,
          website_url: trip.websiteUrl,
          price: trip.price,
          organizer_name: trip.organizer.name,
          organizer_contact: trip.organizer.contact,
          show_trip: 'Hidden' // Start as hidden by default
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Duplicate the trip images
      if (trip.images && trip.images.length > 0) {
        for (const image of trip.images) {
          const fileName = image.url.split('/').pop();
          if (fileName) {
            const { data: imageFile } = await supabase.storage
              .from('trip-photos')
              .download(`gallery/${fileName}`);

            if (imageFile) {
              const newFileName = `gallery/${Date.now()}-${fileName}`;
              const { data: uploadedFile } = await supabase.storage
                .from('trip-photos')
                .upload(newFileName, imageFile);

              if (uploadedFile) {
                await supabase
                  .from('trip_images')
                  .insert({
                    trip_id: newTrip.id,
                    image_path: newFileName,
                    is_thumbnail: image.isThumbnail,
                    is_flyer: image.isFlyer
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips?.map((trip) => (
              <TableRow key={trip.id} className={trip.show_trip === "Deleted" ? "bg-gray-100" : ""}>
                <TableCell>
                  <div className="font-medium">{trip.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">{trip.location}</div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
