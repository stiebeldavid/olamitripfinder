
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface ImageViewerProps {
  src?: string;
  alt?: string;
  onClose?: () => void;
  tripId?: string;
}

const ImageViewer = ({ src, alt, onClose, tripId }: ImageViewerProps) => {
  // If tripId is provided, it means we're using it as a gallery component
  // If src is provided, it means we're using it as a single image viewer
  const [isOpen, setIsOpen] = useState(false);
  
  if (tripId) {
    // This is a placeholder for the gallery functionality
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-500">Trip gallery will be implemented soon</p>
      </div>
    );
  }

  if (!src || !onClose) {
    return null;
  }

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
        src={src}
        alt={alt || "Image"}
        className="max-h-screen max-w-full object-contain p-4"
      />
    </div>
  );
};

export default ImageViewer;
