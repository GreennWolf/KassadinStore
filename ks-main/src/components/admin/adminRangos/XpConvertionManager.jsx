import React, { useState, useEffect, useMemo } from "react";
import { getAllXpConversions, createXpConversion, updateXpConversion, deleteXpConversion } from "../../../services/xpConvertionService";
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
import { XpConversionModal } from "./XpConversionModal";

export function XpConversionManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversions, setConversions] = useState([]);
  const [rpPrices, setRpPrices] = useState([]);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchRpPrices(), fetchConversions()]);
      setLoading(false);
    };
    initializeData();
  }, []);

  const fetchConversions = async () => {
    try {
      const data = await getAllXpConversions();
      setConversions(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las conversiones de XP");
    }
  };

  const fetchRpPrices = async () => {
    try {
      const data = await getAllRpPrice();
      setRpPrices(data);
    } catch (error) {
      console.error("Error fetching RP prices:", error);
      toast.error("Error al cargar los precios de RP");
    }
  };

  const filteredConversions = useMemo(() => {
    return conversions.filter((conversion) => {
      const rpPrice = rpPrices.find((rp) => rp._id === conversion.rpPrice._id);
      return rpPrice?.valueRP.toString().includes(searchTerm.toLowerCase());
    });
  }, [conversions, rpPrices, searchTerm]);

  const handleCreateConversion = async (conversionData) => {
    try {
      await createXpConversion(conversionData);
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
      await updateXpConversion(selectedConversion._id, conversionData);
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
        await deleteXpConversion(conversion._id);
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
            placeholder="Buscar por cantidad de RP..."
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
          Crear Conversión XP
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RP</TableHead>
                <TableHead>XP Seguro</TableHead>
                <TableHead>XP Barato</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversions.map((conversion) => (
                <TableRow key={conversion._id}>
                  <TableCell>{conversion.rpPrice.valueRP}</TableCell>
                  <TableCell>{conversion.xpSeguro}</TableCell>
                  <TableCell>{conversion.xpBarato}</TableCell>
                  <TableCell>{conversion.active ? "Activo" : "Inactivo"}</TableCell>
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
        <XpConversionModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedConversion(null);
          }}
          conversion={selectedConversion}
          onSubmit={modalMode === "create" ? handleCreateConversion : handleEditConversion}
          mode={modalMode}
          rpPrices={rpPrices}
        />
      )}
    </div>
  );
}