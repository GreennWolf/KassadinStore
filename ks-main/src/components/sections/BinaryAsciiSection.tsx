import { useEffect, useState } from "react";

export const BinaryAsciiSection = () => {
  const [binaryText, setBinaryText] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate random binary strings
    const generateBinary = () => {
      const rows = 15;
      const cols = 50;
      const newBinary: string[] = [];
      
      for (let i = 0; i < rows; i++) {
        let row = '';
        for (let j = 0; j < cols; j++) {
          row += Math.random() > 0.5 ? '1' : '0';
        }
        newBinary.push(row);
      }
      
      setBinaryText(newBinary);
    };

    // Initial generation
    generateBinary();

    // Update every second
    const interval = setInterval(generateBinary, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-black text-white overflow-hidden relative min-h-[300px] flex items-center justify-center">
      {/* Background binary rain effect */}
      <div className="absolute inset-0 opacity-20">
        {binaryText.map((row, i) => (
          <div 
            key={i} 
            className="font-mono text-xs md:text-sm whitespace-nowrap animate-fade-in"
            style={{ 
              animation: `fade-in 0.5s ease-out ${i * 0.1}s forwards`,
              opacity: 0 
            }}
          >
            {row}
          </div>
        ))}
      </div>
    </section>
  );
};