
import { useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Calendar, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Temporary mock data
const mockTrips = [
  {
    id: "1",
    name: "Israel Spiritual Journey",
    description: "A transformative journey through the holy land",
    startDate: "2025-01-15",
    endDate: "2025-01-25",
    location: "israel",
    gender: "mixed",
    spots: 20,
    organizer: {
      name: "Sarah Cohen",
      contact: "sarah@example.com"
    },
    brochureImage: "/lovable-uploads/bf14e132-3c84-46cf-98bb-16b5d4f449fb.png"
  },
  {
    id: "2",
    name: "Women's Only Trip to Costa Rica",
    description: "Adventure and wellness in paradise",
    startDate: "2025-01-20",
    endDate: "2025-01-30",
    location: "international",
    gender: "female",
    spots: 15,
    organizer: {
      name: "Rachel Green",
      contact: "rachel@example.com"
    }
  }
];

const Index = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[40vh] bg-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/lovable-uploads/bf14e132-3c84-46cf-98bb-16b5d4f449fb.png"
            alt="Hero background"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative container mx-auto h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-4 animate-fade-down">
            Discover Your Next Adventure
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 animate-fade-up">
            Join amazing group trips and create unforgettable memories
          </p>
          <Link to="/add-trip">
            <Button size="lg" className="bg-primary hover:bg-primary/90 animate-fade-up">
              Add New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4" />
            Filter Trips
          </Button>
        </div>

        {/* Trip Grid */}
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-display text-gray-900 mb-6">January 2025</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] animate-fade-up"
                >
                  <div className="relative h-48">
                    {trip.brochureImage ? (
                      <img
                        src={trip.brochureImage}
                        alt={trip.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      <Badge variant="secondary" className="capitalize">
                        {trip.location}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {trip.gender}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{trip.name}</h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(trip.startDate), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{trip.spots} spots available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">{trip.location}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-x-2">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        See Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
