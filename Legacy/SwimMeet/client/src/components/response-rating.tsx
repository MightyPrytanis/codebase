import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface ResponseRatingProps {
  responseId: string;
  currentRating?: string;
  onRatingChange: (responseId: string, rating: string) => void;
}

export function ResponseRating({ responseId, currentRating, onRatingChange }: ResponseRatingProps) {
  const [rating, setRating] = useState(currentRating || '');

  const ratings = [
    { id: 'positive', label: 'Thumbs Up', icon: ThumbsUp, color: 'bg-green-500', textColor: 'text-green-800' },
    { id: 'negative', label: 'Thumbs Down', icon: ThumbsDown, color: 'bg-red-500', textColor: 'text-red-800' }
  ];

  const handleRatingClick = (ratingId: string) => {
    const newRating = rating === ratingId ? '' : ratingId;
    setRating(newRating);
    onRatingChange(responseId, newRating);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2" style={{ zIndex: 10, position: 'relative' }}>
      {ratings.map((r) => {
        const IconComponent = r.icon;
        const isSelected = rating === r.id;
        return (
          <Button
            key={r.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRatingClick(r.id);
            }}
            className={`h-8 px-3 text-xs transition-all ${
              isSelected 
                ? `${r.color} ${r.textColor} hover:opacity-80` 
                : 'hover:bg-gray-100'
            }`}
            data-testid={`button-rating-${r.id}`}
            style={{ pointerEvents: 'auto', zIndex: 20 }}
          >
            <IconComponent className="h-3 w-3 mr-1" />
            {r.label}
          </Button>
        );
      })}
    </div>
  );
}