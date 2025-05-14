import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateMultipleUsersGold } from "@/services/userService";
import { toast } from "react-toastify";
import { Coins, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MultiGoldModal = ({ isOpen, onClose, users, onUsersUpdate }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [goldAmount, setGoldAmount] = useState("");
  const [goldOperation, setGoldOperation] = useState("sumar");
  const [updating, setUpdating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Limpiar selecciones cuando se cierra el modal
      setSelectedUsers([]);
      setSearchTerm("");
      setGoldAmount("");
      setGoldOperation("sumar");
      setSelectAll(false);
    }
  }, [isOpen]);

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar selección/deselección de todos los usuarios
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
    setSelectAll(!selectAll);
  };

  // Manejar selección/deselección de un usuario
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      // Comprobar si ahora están todos seleccionados
      if (selectedUsers.length + 1 === filteredUsers.length) {
        setSelectAll(true);
      }
    }
  };

  // Procesar la actualización del oro
  const handleUpdateGold = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Por favor selecciona al menos un usuario");
      return;
    }

    if (!goldAmount || isNaN(goldAmount) || Number(goldAmount) <= 0) {
      toast.error("Por favor ingresa una cantidad válida de oro");
      return;
    }

    // Preparar datos para la API
    const usersToUpdate = selectedUsers.map(userId => ({
      id: userId,
      amount: goldAmount,
      operation: goldOperation
    }));

    setUpdating(true);
    try {
      const result = await updateMultipleUsersGold(usersToUpdate);
      
      // Notificar resultado
      if (result.successCount > 0) {
        toast.success(`Oro actualizado para ${result.successCount} usuarios`);
      }
      
      if (result.errorCount > 0) {
        toast.warning(`No se pudo actualizar ${result.errorCount} usuarios. Ver consola para detalles.`);
        console.warn("Errores al actualizar oro:", result.errors);
      }
      
      // Actualizar usuarios en el componente padre
      if (result.users && result.users.length > 0 && onUsersUpdate) {
        onUsersUpdate(result.users);
      }
      
      // Cerrar el modal
      onClose();
    } catch (error) {
      toast.error(error.message || "Error al actualizar el oro");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Modificar Oro de Múltiples Usuarios
          </DialogTitle>
          <DialogDescription>
            Selecciona los usuarios y establece la cantidad de oro a modificar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opciones de oro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operación de Oro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="operation" className="text-sm font-medium">
                    Operación
                  </label>
                  <Select
                    value={goldOperation}
                    onValueChange={setGoldOperation}
                  >
                    <SelectTrigger id="operation">
                      <SelectValue placeholder="Seleccionar operación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sumar">Sumar oro</SelectItem>
                      <SelectItem value="restar">Restar oro</SelectItem>
                      <SelectItem value="cambiar">Cambiar a valor exacto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Cantidad
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Ingresa la cantidad"
                    value={goldAmount}
                    onChange={(e) => setGoldAmount(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selección de Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="selectAll" 
                    checked={selectAll} 
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="selectAll" className="text-sm">
                    Seleccionar Todos
                  </label>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Oro Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user._id)}
                              onCheckedChange={() => handleSelectUser(user._id)}
                            />
                          </TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.fullName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {user.gold}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No se encontraron usuarios.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedUsers.length} usuarios seleccionados
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateGold} 
            disabled={updating || selectedUsers.length === 0 || !goldAmount}
          >
            {updating ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                Procesando...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Actualizar Oro ({selectedUsers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiGoldModal;