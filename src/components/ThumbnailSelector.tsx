
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ThumbnailSelectorProps {
  images: string[];
  selectedThumbnail: string | null;
  onSelect: (imagePath: string | null) => void;
  brochureImage: string | null;
}

const ThumbnailSelector = ({
  images,
  selectedThumbnail,
  onSelect,
  brochureImage
}: ThumbnailSelectorProps) => {
  // If no thumbnail is explicitly selected, default to brochure
  const value = selectedThumbnail || "default";
  
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">
        Select image to use as main thumbnail on home page:
      </div>
      
      <RadioGroup 
        value={value} 
        onValueChange={(val) => {
          if (val === "default") {
            onSelect(null);
          } else {
            onSelect(val);
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {/* Default option (use brochure) */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "relative border-2 rounded-md overflow-hidden h-32 w-full",
            value === "default" ? "border-primary" : "border-gray-200"
          )}>
            {brochureImage ? (
              <img
                src={brochureImage}
                alt="Brochure image"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-500 text-sm">No brochure image</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <RadioGroupItem value="default" id="default" className="border-primary" />
            </div>
          </div>
          <Label htmlFor="default" className="text-sm">Default (brochure)</Label>
        </div>
        
        {/* Gallery images */}
        {images.map((image, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className={cn(
              "relative border-2 rounded-md overflow-hidden h-32 w-full",
              value === image ? "border-primary" : "border-gray-200"
            )}>
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <RadioGroupItem value={image} id={`thumb-${index}`} className="border-primary" />
              </div>
            </div>
            <Label htmlFor={`thumb-${index}`} className="text-sm">Gallery image {index + 1}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ThumbnailSelector;
