
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
  onDownload?: () => void;
  tripId?: string; // Make tripId optional to maintain backward compatibility
}

const ImageViewer = ({ src, alt, onClose, onDownload, tripId }: ImageViewerProps) => {
  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
      <div className="absolute top-4 right-4 flex gap-2">
        {onDownload && (
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
      />
    </div>
  );
};

export default ImageViewer;
