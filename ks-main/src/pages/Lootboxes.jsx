// pages/Lootboxes.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Trophy, Star } from "lucide-react";

// Componentes de UI
import { TopNav } from "@/components/TopNav";
import { LootboxCard } from "@/components/lootboxes/LootboxCard";

// Función del servicio para obtener las lootboxes disponibles
import { getAvailableLootboxes } from "@/services/lootboxService";

const Lootboxes = () => {
  const [lootboxes, setLootboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar las lootboxes disponibles al montar el componente
  useEffect(() => {
    const fetchLootboxes = async () => {
      try {
        const data = await getAvailableLootboxes();
        setLootboxes(data);
      } catch (error) {
        console.error("Error al cargar las lootboxes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLootboxes();
  }, []);

  // Función para redirigir al usuario a la página de la caja con el id correspondiente
  const handleSelectLootbox = (lootboxId) => {
    navigate(`/cases/${lootboxId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="container mx-auto px-4 py-12">
        {/* Sección de Lootboxes / Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-4xl p-2 font-bold text-center mb-12 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Cajas Disponibles
          </h2>

          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lootboxes.map((lootbox) => (
                <LootboxCard
                  key={lootbox._id}
                  title={lootbox.name}
                  price={lootbox.price}
                  color={lootbox.color || "emerald"}
                  image={lootbox.image}
                  rarity={lootbox.rarity || "Exclusiva"}
                  // Al hacer click redirige a la página de la caja con el id correspondiente
                  onClick={() => handleSelectLootbox(lootbox._id)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Sección de Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          <div className="p-8 rounded-lg bg-black/50 border border-white/10 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-white/60" />
            <h3 className="text-xl font-semibold mb-2">Apertura 24/7</h3>
            <p className="text-gray-400">Abre cajas en cualquier momento y lugar</p>
          </div>
          <div className="p-8 rounded-lg bg-black/50 border border-white/10 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-white/60" />
            <h3 className="text-xl font-semibold mb-2">Recompensas Garantizadas</h3>
            <p className="text-gray-400">Cada caja contiene objetos valiosos</p>
          </div>
          <div className="p-8 rounded-lg bg-black/50 border border-white/10 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-white/60" />
            <h3 className="text-xl font-semibold mb-2">Objetos Exclusivos</h3>
            <p className="text-gray-400">Descubre recompensas raras y únicas</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Lootboxes;