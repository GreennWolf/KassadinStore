import { ReviewCard } from "./ReviewCard";
import { reviews } from "./reviewsData"; // Ahora ya tiene las imágenes asignadas

export const ReviewsList = () => {
  return (
    <div className="relative overflow-hidden h-[400px]">
      <div className="absolute top-0 animate-scroll space-y-4">
        {[...reviews, ...reviews].map((review, index) => (
          <ReviewCard key={index} {...review} />
        ))}
      </div>
    </div>
  );
};