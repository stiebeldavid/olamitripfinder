
import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Briefcase, CalendarDays, Users, ExternalLink } from 'lucide-react';
import { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import ImageViewer from './ImageViewer';
import { supabase } from '@/integrations/supabase/client';

interface TripInfoProps {
  trip: Trip;
  onClose: () => void;
}

const getPublicUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  const {
    data: {
      publicUrl
    }
  } = supabase.storage.from('trip-photos').getPublicUrl(path);
  return publicUrl || "";
};

const TripInfo = ({ trip, onClose }: TripInfoProps) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Function to determine location display text
  const getLocationText = (location: string) => {
    switch (location) {
      case 'united_states':
        return 'United States';
      case 'international':
        return 'International';
      case 'israel':
        return 'Israel';
      default:
        return location;
    }
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all my-8 w-full max-w-4xl">
                <div className="absolute right-4 top-4 z-10">
                  <button
                    type="button"
                    className="rounded-full bg-white/80 p-2 text-gray-600 hover:text-gray-900 focus:outline-none backdrop-blur"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div>
                  <div className="relative h-56 sm:h-72 bg-gray-200">
                    {trip.thumbnailImage && (
                      <img
                        src={trip.thumbnailImage}
                        alt={trip.name}
                        className="h-full w-full object-cover object-center"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <Dialog.Title as="h3" className="text-2xl sm:text-3xl font-display font-semibold text-white">
                        {trip.name}
                      </Dialog.Title>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="text-sm text-white bg-black/40 px-3 py-1 rounded-full">
                          {getLocationText(trip.location)}
                        </div>
                        
                        <div className="text-sm text-white bg-black/40 px-3 py-1 rounded-full">
                          {trip.gender === 'mixed' ? 'Co-ed' : trip.gender === 'male' ? 'Male' : 'Female'}
                        </div>
                        
                        {trip.isInternship && (
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            <Briefcase className="w-3 h-3 mr-1" />
                            Internship
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        {trip.description && (
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700 whitespace-pre-line">{trip.description}</p>
                          </div>
                        )}
                      
                        {/* Placeholder for gallery */}
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                          <p className="text-gray-500">Gallery coming soon...</p>
                        </div>
                      </div>

                      <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
                        {trip.price && (
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">Price</h4>
                            <p className="text-gray-800 font-medium">{trip.price}</p>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Dates</h4>
                          <div className="flex items-center text-gray-700">
                            <CalendarDays className="w-4 h-4 mr-2" />
                            <span>{format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        {trip.spots && (
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">Spots Available</h4>
                            <div className="flex items-center text-gray-700">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{trip.spots}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Organizer</h4>
                          <div className="text-gray-700">
                            <p className="font-medium">{trip.organizer.name}</p>
                            <p className="text-sm">{trip.organizer.contact}</p>
                          </div>
                        </div>

                        {trip.websiteUrl && (
                          <div>
                            <Button className="w-full" asChild>
                              <a href={trip.websiteUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Visit Website
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button variant="outline" onClick={onClose} ref={cancelButtonRef}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TripInfo;
