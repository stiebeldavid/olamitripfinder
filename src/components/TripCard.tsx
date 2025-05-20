
import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Trip } from "@/types/trip";
import TripPrice from "./TripPrice";

interface TripCardProps {
  trip: Trip;
  className?: string;
}

const TripCard = ({ trip, className }: TripCardProps) => {
  const formattedStartDate = format(parseISO(trip.startDate), "MMM d, yyyy");
  const formattedEndDate = format(parseISO(trip.endDate), "MMM d, yyyy");

  const imageUrl = trip.thumbnailImage || trip.brochureImage || "/placeholder.svg";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative aspect-[4/3]">
        <img
          src={imageUrl}
          alt={trip.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-display text-lg font-medium">{trip.name}</h3>
            <div className="text-sm text-gray-600">
              {formattedStartDate} - {formattedEndDate}
            </div>
            <TripPrice price={trip.price} className="mt-1" />
          </div>
          <div>
            {trip.websiteUrl && (
              <a href={trip.websiteUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Visit website</span>
                </Button>
              </a>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {trip.location === "united_states" ? "United States" : 
             trip.location === "international" ? "International" : "Israel"}
          </span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {trip.gender === "mixed" ? "Co-ed" : 
             trip.gender === "male" ? "Men" : "Women"}
          </span>
          {trip.spots && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {trip.spots} spots
            </span>
          )}
        </div>
        <div className="mt-4">
          <Link to={`/trip/${trip.trip_id}`} className="w-full">
            <Button className="w-full">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;
