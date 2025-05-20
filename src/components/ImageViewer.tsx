
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
  onDownload?: () => void;
  tripId?: string;
}

const ImageViewer = ({ src, alt, onClose, onDownload, tripId }: ImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(true);
  const DEFAULT_IMAGE = "/placeholder.svg";

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center">
      <div className="absolute top-4 right-4 flex gap-2">
        {onDownload && imageLoaded && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onDownload}
          >
            <Download className="w-6 h-6" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onError={(e) => {
          console.error(`Failed to load image in viewer: ${src}`);
          setImageLoaded(false);
          (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
        }}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};

export default ImageViewer;
