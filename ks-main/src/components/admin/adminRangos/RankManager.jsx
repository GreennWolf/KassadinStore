// RankManager.jsx
import React, { useState, useEffect } from "react";
import { getAllRanks, createRank, updateRank, deleteRank } from "../../../services/rankService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { RankModal } from "./RankModal";

export function RankManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ranks, setRanks] = useState([]);
  const [selectedRank, setSelectedRank] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  useEffect(() => {
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    try {
      const data = await getAllRanks();
      setRanks(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los rangos");
    }
  };

  const filteredRanks = ranks.filter((rank) =>
    rank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRank = async (rankData) => {
    try {
      await createRank(rankData);
      toast.success("Rango creado exitosamente");
      await fetchRanks();
      setModalOpen(false);
    } catch (error) {
      console.error("Error creando rango:", error);
      toast.error("Error al crear el rango");
    }
  };

  const handleEditRank = async (rankData) => {
    try {
      await updateRank(selectedRank._id, rankData);
      toast.success("Rango actualizado exitosamente");
      await fetchRanks();
      setModalOpen(false);
      setSelectedRank(null);
    } catch (error) {
      console.error("Error editando rango:", error);
      toast.error("Error al actualizar el rango");
    }
  };

  const handleDeleteRank = async (rank) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar el rango "${rank.name}"?`)) {
      try {
        await deleteRank(rank._id);
        toast.success("Rango eliminado exitosamente");
        await fetchRanks();
      } catch (error) {
        console.error("Error eliminando rango:", error);
        toast.error("Error al eliminar el rango");
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar rangos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setSelectedRank(null);
            setModalOpen(true);
          }}
        >
          Crear Rango
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icono</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>XP Requerido</TableHead>
                <TableHead>Oro de Recompensa</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRanks.map((rank) => (
                <TableRow key={rank._id}>
                  <TableCell>
                    <img
                      src={rank.icon}
                      alt={rank.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </TableCell>
                  <TableCell>{rank.name}</TableCell>
                  <TableCell>{rank.xp}</TableCell>
                  <TableCell>{rank.gold}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='bg-black' align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRank(rank);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteRank(rank)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RankModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRank(null);
        }}
        rank={selectedRank}
        onSubmit={modalMode === "create" ? handleCreateRank : handleEditRank}
        mode={modalMode}
      />
    </div>
  );
}