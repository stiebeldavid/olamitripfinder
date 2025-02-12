import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Calendar, MapPin, User, Home, Heart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const mockTrips = [
  {
    id: "1",
    name: "Mountain Adventure Trek",
    description: "Experience breathtaking views and challenging trails in the Rockies",
    startDate: "2025-02-15",
    endDate: "2025-02-20",
    location: "us",
    spots: 8,
    organizer: {
      name: "Trek Adventures",
      contact: "info@trekadventures.com"
    },
    brochureImage: "https://public.readdy.ai/ai/img_res/ae8b17dd7160f24a7f1b5ec1c4595f71.jpg"
  },
  {
    id: "2",
    name: "Desert Safari Adventure",
    description: "Luxury camping experience in the heart of the Negev Desert",
    startDate: "2025-02-22",
    endDate: "2025-02-25",
    location: "israel",
    spots: 5,
    organizer: {
      name: "Israel Outdoors",
      contact: "info@israeloutdoors.com"
    },
    brochureImage: "https://public.readdy.ai/ai/img_res/f02d9f6f27b282ba6157df78b3cbf3ad.jpg"
  },
  {
    id: "3",
    name: "Mediterranean Explorer",
    description: "Discover the charm of coastal towns and historic sites",
    startDate: "2025-03-05",
    endDate: "2025-03-15",
    location: "international",
    spots: 3,
    organizer: {
      name: "Euro Travel",
      contact: "info@eurotravel.com"
    },
    brochureImage: "https://public.readdy.ai/ai/img_res/0437fc392f9c833e7a20e7ebad5fcca8.jpg"
  }
];

const Index = () => {
  const [selectedTrip, setSelectedTrip] = useState<(typeof mockTrips)[0] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
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
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
              All Trips
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
              Mixed Gender
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
              Men Only
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
              Women Only
            </Button>
          </div>
          <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
            All
          </Button>
          <Button variant="default" size="sm" className="shadow-sm whitespace-nowrap">
            US
          </Button>
          <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
            Israel
          </Button>
          <Button variant="outline" size="sm" className="shadow-sm whitespace-nowrap">
            International
          </Button>
        </div>
      </div>

      <div className="px-4 pb-20 max-w-7xl mx-auto">
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-3">February 2025</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockTrips
              .filter(trip => new Date(trip.startDate).getMonth() === 1)
              .map(trip => (
                <div
                  key={trip.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => setSelectedTrip(trip)}
                >
                  <img
                    src={trip.brochureImage}
                    alt={trip.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{trip.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{trip.description}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(trip.startDate), "MMM d")} -{" "}
                          {format(new Date(trip.endDate), "MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">{trip.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary">{trip.spots} spots left</span>
                      <Button variant="link" className="text-primary p-0">
                        See Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-3">March 2025</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockTrips
              .filter(trip => new Date(trip.startDate).getMonth() === 2)
              .map(trip => (
                <div
                  key={trip.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => setSelectedTrip(trip)}
                >
                  <img
                    src={trip.brochureImage}
                    alt={trip.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{trip.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{trip.description}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(trip.startDate), "MMM d")} -{" "}
                          {format(new Date(trip.endDate), "MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">{trip.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary">{trip.spots} spots left</span>
                      <Button variant="link" className="text-primary p-0">
                        See Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
              <img
                src={selectedTrip.brochureImage}
                alt={selectedTrip.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
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
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-gray-600">{selectedTrip.spots} spots available</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Button className="w-full" onClick={() => window.open("https://example.com", "_blank")}>
                  Learn More
                </Button>
                <Button variant="outline" className="w-full border-primary text-primary">
                  Download Flyer
                </Button>
                <Button variant="outline" className="w-full">
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
