import { Star, StarHalf } from "lucide-react";

interface ReviewCardProps {
  name: string;
  photo: string;
  content: string;
  rating: number;
}

export const ReviewCard = ({ name, photo, content, rating }: ReviewCardProps) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-5 h-5 fill-[#00B67A] text-[#00B67A]" />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="w-5 h-5 fill-[#00B67A] text-[#00B67A]" />
      );
    }

    return stars;
  };

  return (
    <div className="bg-card p-6 rounded-lg transform hover:scale-105 transition-transform duration-300 min-w-[300px] md:min-w-[400px]">
      <div className="flex items-center gap-1 mb-4">
        {renderStars()}
      </div>
      <p className="text-sm mb-4">{content}</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-semibold">{name}</p>
        </div>
      </div>
    </div>
  );
};