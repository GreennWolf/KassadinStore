import React, { useState, useEffect } from "react";
import { 
  getAllLootboxes, 
  deactivateLootbox, 
  createLootbox, 
  updateLootbox 
} from "../../../services/lootBoxService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Dice1, Power } from "lucide-react";
import { toast } from "react-toastify";
import { LootboxModal } from "./LootboxModal";
import { SimulationModal } from "./SimulationModal";
import { Badge } from "@/components/ui/badge";

export function LootboxManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lootboxes, setLootboxes] = useState([]);
  const [selectedLootbox, setSelectedLootbox] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);

  useEffect(() => {
    fetchLootboxes();
  }, []);

  const fetchLootboxes = async () => {
    try {
      const data = await getAllLootboxes(true); // true para incluir inactivas
      console.log(data)
      setLootboxes(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las lootboxes");
    }
  };

  const filteredLootboxes = lootboxes.filter((lootbox) =>
    lootbox.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeactivate = async (lootbox) => {
    try {
      await deactivateLootbox(lootbox._id);
      toast.success("Lootbox desactivada exitosamente");
      await fetchLootboxes();
    } catch (error) {
      console.error("Error desactivando lootbox:", error);
      toast.error("Error al desactivar la lootbox");
    }
  };

  const getStatusBadge = (lootbox) => {
    if (!lootbox.active) {
      return <Badge variant="destructive">Inactiva</Badge>;
    }
    if (lootbox.endDate && new Date(lootbox.endDate) < new Date()) {
      return <Badge variant="warning">Expirada</Badge>;
    }
    return <Badge variant="success">Activa</Badge>;
  };

    const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

// Agregar esta función antes del return
const handleSubmit = async (formData) => {
  try {
    if (modalMode === "create") {
      await createLootbox(formData);
      toast.success("Lootbox creada exitosamente");
    } else {
      await updateLootbox(selectedLootbox._id, formData);
      toast.success("Lootbox actualizada exitosamente");
    }
    
    await fetchLootboxes();
    setModalOpen(false);
    setSelectedLootbox(null);
  } catch (error) {
    console.error("Error al gestionar la lootbox:", error);
    const errorMessage = error.response?.data?.message || 
      `Error al ${modalMode === "create" ? "crear" : "actualizar"} la lootbox`;
    toast.error(errorMessage);
  }
};

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lootboxes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setSelectedLootbox(null);
            setModalOpen(true);
          }}
        >
          Crear Lootbox
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio (Oro)</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Límite</TableHead>
                <TableHead>Rango Mínimo</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLootboxes.map((lootbox) => (
                <TableRow key={lootbox._id}>
                  <TableCell>
                    <img
                      src={lootbox.image}
                      alt={lootbox.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </TableCell>
                  <TableCell>{lootbox.name}</TableCell>
                  <TableCell>{formatNumber(lootbox.price)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lootbox.items.map((item, index) => (
                        <div key={index} className="text-xs">
                          {item.itemType}: {item.dropRateFormatted}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lootbox)}</TableCell>
                  <TableCell>
                    {lootbox.purchaseLimit ? `${lootbox.purchaseLimit} por usuario` : 'Sin límite'}
                  </TableCell>
                  <TableCell>
                    {lootbox.minimumRank ? lootbox.minimumRank.name : 'Ninguno'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLootbox(lootbox);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLootbox(lootbox);
                            setSimulationModalOpen(true);
                          }}
                        >
                          <Dice1 className="mr-2 h-4 w-4" />
                          Simular Apertura
                        </DropdownMenuItem>
                        {lootbox.active && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeactivate(lootbox)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LootboxModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedLootbox(null);
        }}
        lootbox={selectedLootbox}
        mode={modalMode}
        onSubmit={handleSubmit}
      />

      {selectedLootbox && (
        <SimulationModal
          isOpen={simulationModalOpen}
          onClose={() => {
            setSimulationModalOpen(false);
            setSelectedLootbox(null);
          }}
          lootbox={selectedLootbox}
        />
      )}
    </div>
  );
}