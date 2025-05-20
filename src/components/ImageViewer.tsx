
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
  const DEFAULT_IMAGE = "/lovable-uploads/f5be19fc-8a6f-428a-b7ed-07d78c2b67fd.png";

  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
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
        className="max-h-screen max-w-full object-contain p-4"
        onError={(e) => {
          console.error(`Failed to load image in viewer: ${src}`);
          setImageLoaded(false);
          (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
        }}
      />
    </div>
  );
};

export default ImageViewer;
