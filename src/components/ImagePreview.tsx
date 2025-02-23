
import { Trash } from "lucide-react";
import { Button } from "./ui/button";

interface ImagePreviewProps {
  src: string;
  onDelete: () => void;
  alt?: string;
  showDelete?: boolean;
}

const ImagePreview = ({ 
  src, 
  onDelete, 
  alt = "Preview",
  showDelete = true 
}: ImagePreviewProps) => {
  return (
    <div className="relative inline-block group">
      <img
        src={src}
        alt={alt}
        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
      />
      {showDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            onDelete();
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ImagePreview;
