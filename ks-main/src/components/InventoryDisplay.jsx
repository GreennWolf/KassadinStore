import { useState, useEffect } from "react";
import { getActiveItems, useItem } from "@/services/inventoryService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const InventoryDisplay = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getActiveItems();
      setItems(response.items);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const handleUseItem = async (itemId, quantity = 1) => {
    try {
      await useItem({ itemId, quantity });
      toast.success("Item utilizado correctamente");
      fetchInventory(); // Recargar inventario
    } catch (error) {
      console.error("Error al usar el item:", error);
      toast.error(error.message || "Error al usar el item");
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando inventario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Tu Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Aquí encontrarás todos tus items disponibles
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const itemData = item.itemId;
            const isHovered = hoveredItem === item._id;
            // console.log(items)
            return (
              <div
                key={item._id}
                className="relative group bg-accent rounded-lg overflow-hidden"
                onMouseEnter={() => setHoveredItem(item._id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="aspect-square relative">
                  {/* Imagen del item */}
                  <img
                    src={itemData.srcLocal || '/placeholder-item.png'}
                    alt={itemData.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay al hacer hover */}
                  <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      onClick={() => handleUseItem(item._id)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Utilizar
                    </button>
                  </div>

                  {/* Cantidad */}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-md text-xs">
                    x{item.quantity}
                  </div>
                </div>

                {/* Nombre del item */}
                <div className="p-2 text-sm truncate text-center bg-black/40">
                  {itemData.name || itemData.NombreSkin}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No tienes items en tu inventario.
        </div>
      )}
    </div>
  );
};