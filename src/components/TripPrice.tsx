
import React from "react";

interface TripPriceProps {
  price?: string | null;
  className?: string;
}

const TripPrice = ({ price, className = "" }: TripPriceProps) => {
  if (!price) return null;
  
  return (
    <div className={`text-emerald-600 font-medium ${className}`}>
      {price}
    </div>
  );
};

export default TripPrice;
