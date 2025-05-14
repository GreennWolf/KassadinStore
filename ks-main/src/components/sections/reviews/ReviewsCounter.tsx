interface ReviewsCounterProps {
  count: number;
}

export const ReviewsCounter = ({ count }: ReviewsCounterProps) => {
  return (
    <div className="text-center md:text-left">
      <h2 className="text-4xl font-bold mb-4">
        Más de <span className="text-emerald-500" style={{
          textShadow: '0 0 10px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.1)'
        }}>{count.toLocaleString()}</span> clientes satisfechos
      </h2>
    </div>
  );
};