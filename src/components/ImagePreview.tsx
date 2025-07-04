
import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  onDelete,
  showDelete = true
}) => {
  // Prevent the click event from bubbling up to parent elements
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div className="relative rounded-md overflow-hidden h-20 w-20">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
      />
      {showDelete && onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-100"
          onClick={handleDelete}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ImagePreview;
