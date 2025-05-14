import React, { useState, useEffect, useMemo } from "react";
import { getAllGoldConvertions, createGoldConvertion, updateGoldConvertion, deleteGoldConvertion } from "../../../services/goldConvertionService";
import { getAllRpPrice } from "../../../services/rpService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { GoldConversionModal } from "./GoldConversionModal";

export function GoldConversionManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversions, setConversions] = useState([]);
  const [rpPrices, setRPPrices] = useState([]);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchRPPrices(), fetchConversions()]);
      setLoading(false);
    };
    initializeData();
  }, []);

  const fetchConversions = async () => {
    try {
      const data = await getAllGoldConvertions();
      setConversions(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las conversiones de oro");
    }
  };

  const fetchRPPrices = async () => {
    try {
      const data = await getAllRpPrice();
      setRPPrices(data);
    } catch (error) {
      console.error("Error fetching RP prices:", error);
      toast.error("Error al cargar los precios RP");
    }
  };

  const filteredConversions = useMemo(() => {
    if (!searchTerm) return conversions;
    return conversions.filter((conversion) => {
      return conversion.rpPrice.valueRP.toString().includes(searchTerm);
    });
  }, [conversions, searchTerm]);

  const handleCreateConversion = async (conversionData) => {
    try {
      await createGoldConvertion(conversionData);
      toast.success("Conversión creada exitosamente");
      await fetchConversions();
      setModalOpen(false);
    } catch (error) {
      console.error("Error creando conversión:", error);
      toast.error("Error al crear la conversión");
    }
  };

  const handleEditConversion = async (conversionData) => {
    try {
      await updateGoldConvertion(selectedConversion._id, conversionData);
      toast.success("Conversión actualizada exitosamente");
      await fetchConversions();
      setModalOpen(false);
      setSelectedConversion(null);
    } catch (error) {
      console.error("Error editando conversión:", error);
      toast.error("Error al actualizar la conversión");
    }
  };

  const handleDeleteConversion = async (conversion) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar esta conversión?`)) {
      try {
        await deleteGoldConvertion(conversion._id);
        toast.success("Conversión eliminada exitosamente");
        await fetchConversions();
      } catch (error) {
        console.error("Error eliminando conversión:", error);
        toast.error("Error al eliminar la conversión");
      }
    }
  };

  if (loading) {
    return <div className="w-full text-center py-4">Cargando...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por valor de RP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setSelectedConversion(null);
            setModalOpen(true);
          }}
        >
          Crear Conversión de Oro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cantidad de Oro</TableHead>
                <TableHead>RP</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversions.map((conversion) => (
                <TableRow key={conversion._id}>
                  <TableCell>{conversion.gold}</TableCell>
                  <TableCell>{conversion.rpPrice.valueRP}</TableCell>
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
                            setSelectedConversion(conversion);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteConversion(conversion)}
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

      {modalOpen && (
        <GoldConversionModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedConversion(null);
          }}
          conversion={selectedConversion}
          onSubmit={modalMode === "create" ? handleCreateConversion : handleEditConversion}
          mode={modalMode}
        />
      )}
    </div>
  );
}