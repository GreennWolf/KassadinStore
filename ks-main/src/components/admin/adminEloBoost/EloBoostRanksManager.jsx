import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  getEloBoostRanks, 
  createEloBoostRank, 
  updateEloBoostRank, 
  deleteEloBoostRank 
} from '@/services/eloBoostService';
import { useToast } from '@/hooks/use-toast';
import EloBoostRankModal from './EloBoostRankModal';
import UpdateChampionIconsButton from './UpdateChampionIconsButton';

const EloBoostRanksManager = () => {
  const { toast } = useToast();
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRank, setCurrentRank] = useState(null);
  // Obtener el token de la información de usuario almacenada
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const token = localStorage.getItem('token') || (user ? user.token : null);
  
  console.log("EloBoostRanksManager - Token en localStorage:", localStorage.getItem('token'));
  console.log("EloBoostRanksManager - User en localStorage:", userJson);
  console.log("EloBoostRanksManager - User parseado:", user);
  console.log("EloBoostRanksManager - Token final:", token);

  // Cargar rangos
  useEffect(() => {
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    try {
      setLoading(true);
      const data = await getEloBoostRanks();
      setRanks(data);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los rangos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar rangos por búsqueda
  const filteredRanks = ranks.filter(
    (rank) => rank.name.toLowerCase().includes(search.toLowerCase())
  );

  // Abrir modal para crear un nuevo rango
  const handleCreateRank = () => {
    setCurrentRank(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar un rango existente
  const handleEditRank = (rank) => {
    setCurrentRank(rank);
    setIsModalOpen(true);
  };

  // Guardar un rango (crear o actualizar)
  const handleSaveRank = async (rankData) => {
    try {
      console.log("handleSaveRank - Inicio de función");
      setLoading(true);
      
      console.log("handleSaveRank - Token:", token);
      console.log("handleSaveRank - RankData:", rankData);
      
      if (currentRank) {
        console.log("handleSaveRank - Actualizando rango existente:", currentRank._id);
        // Actualizar rango existente
        await updateEloBoostRank(currentRank._id, rankData);
        toast({
          title: 'Éxito',
          description: 'Rango actualizado correctamente',
        });
      } else {
        console.log("handleSaveRank - Creando nuevo rango");
        // Crear nuevo rango
        await createEloBoostRank(rankData);
        toast({
          title: 'Éxito',
          description: 'Rango creado correctamente',
        });
      }
      
      // Recargar rangos
      fetchRanks();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving rank:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar el rango',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un rango
  const handleDeleteRank = async (rankId) => {
    if (!confirm('¿Está seguro de que desea eliminar este rango?')) return;
    
    try {
      setLoading(true);
      await deleteEloBoostRank(rankId);
      
      toast({
        title: 'Éxito',
        description: 'Rango eliminado correctamente',
      });
      
      // Recargar rangos
      fetchRanks();
    } catch (error) {
      console.error('Error deleting rank:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar el rango',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener el valor RP de un rango para mostrarlo en la tabla
  const getRankRPValue = (rank) => {
    if (!rank.rankUpPriceRP) return "N/A";
    return `${rank.rankUpPriceRP.valueRP} RP`;
  };

  // Obtener el valor RP de una división para mostrarlo en la tabla
  const getDivisionRPValue = (rank) => {
    if (!rank.divisionPriceRP) return "N/A";
    return `${rank.divisionPriceRP.valueRP} RP`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rangos de Elo Boost</CardTitle>
        <CardDescription>
          Gestione los rangos disponibles para el servicio de Elo Boost
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/3">
            <Input
              placeholder="Buscar rangos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <UpdateChampionIconsButton />
            <Button onClick={handleCreateRank}>Nuevo Rango</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p>Cargando rangos...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/12">Orden</TableHead>
                  <TableHead className="w-1/6">Icono</TableHead>
                  <TableHead className="w-1/6">Nombre</TableHead>
                  <TableHead className="w-1/6">Precio Rango</TableHead>
                  <TableHead className="w-1/6">Precio División</TableHead>
                  <TableHead className="w-1/12">Estado</TableHead>
                  <TableHead className="w-1/4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRanks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No se encontraron rangos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRanks.map((rank) => (
                    <TableRow key={rank._id}>
                      <TableCell>{rank.order}</TableCell>
                      <TableCell>
                        <img
                          src={rank.icon ? import.meta.env.VITE_API_URL + rank.icon : '/placeholder.svg'}
                          alt={rank.name}
                          className="w-10 h-10 object-contain"
                        />
                      </TableCell>
                      <TableCell>{rank.name}</TableCell>
                      <TableCell>{getRankRPValue(rank)}</TableCell>
                      <TableCell>{getDivisionRPValue(rank)}</TableCell>
                      <TableCell>
                        <Badge variant={rank.active ? "default" : "secondary"}>
                          {rank.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEditRank(rank)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRank(rank._id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal para crear/editar rangos */}
      <EloBoostRankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRank}
        rank={currentRank}
      />
    </Card>
  );
};

export default EloBoostRanksManager;