
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ImageViewerProps {
  src?: string;
  alt?: string;
  onClose?: () => void;
  tripId?: string;
}

const ImageViewer = ({ src, alt, onClose, tripId }: ImageViewerProps) => {
  // When used with tripId, we'll implement gallery functionality
  // When used with src/onClose, we'll display a single image
  const [selectedImage, setSelectedImage] = useState<string | undefined>(src);

  if (!src && !tripId) {
    return null;
  }

  if (tripId) {
    // In this case, we'll display a gallery or placeholder for the trip images
    // This will be implemented separately as it requires fetching images
    return (
      <div className="mt-4">
        <h4 className="text-lg font-bold text-gray-900 mb-2">Gallery</h4>
        <div className="text-gray-500">
          Trip gallery will be displayed here.
        </div>
      </div>
    );
  }

  // Single image view mode
  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>
      <img
        src={selectedImage}
        alt={alt || "Image"}
        className="max-h-screen max-w-full object-contain p-4"
      />
    </div>
  );
};

export default ImageViewer;
