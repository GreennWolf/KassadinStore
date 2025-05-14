import React, { useState, useEffect, useRef, useCallback } from "react";
import { getUsers, registerUser, updateUser, deleteUser } from "@/services/userService";
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
import { Search, MoreVertical, Info, Coins } from "lucide-react";
import { toast } from "react-toastify";
import { UserModal } from "./UserModal"; // Assuming UserModal is in a separate file
import UserDetailsModal from "./UserDetailsModal";
import MultiGoldModal from "./MultiGoldModal"; // Importar el nuevo componente

export const UsuariosManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // Nuevo estado para el modal de actualización múltiple de oro
  const [multiGoldModalOpen, setMultiGoldModalOpen] = useState(false);

  const tableRef = useRef();
  const observer = useRef();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los usuarios");
    }
  };

  const updateUserInState = (updatedUser) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user._id === updatedUser._id) {
          return updatedUser;
        }
        return user;
      });
    });
    
    // También actualizar el usuario seleccionado si es el mismo
    if (selectedUser && selectedUser._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  // Nueva función para actualizar múltiples usuarios en el estado
  const updateMultipleUsersInState = (updatedUsers) => {
    if (!updatedUsers || updatedUsers.length === 0) return;

    setUsers(prevUsers => {
      return prevUsers.map(user => {
        // Buscar si este usuario está en la lista de actualizados
        const updatedUser = updatedUsers.find(u => u._id === user._id);
        if (updatedUser) {
          return updatedUser;
        }
        return user;
      });
    });
    
    // Actualizar también el usuario seleccionado si está en la lista
    if (selectedUser) {
      const updatedSelectedUser = updatedUsers.find(u => u._id === selectedUser._id);
      if (updatedSelectedUser) {
        setSelectedUser(updatedSelectedUser);
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadMoreUsers = useCallback(() => {
    setVisibleUsers((prevVisible) => prevVisible + 10);
  }, []);

  const lastUserRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreUsers();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadMoreUsers]
  );

  const handleCreateUser = async (userData) => {
    try {
      await registerUser(userData);
      toast.success("Usuario creado exitosamente");
      await fetchUsers();
      setModalOpen(false);
    } catch (error) {
      console.error("Error creando usuario:", error);
      toast.error("Error al crear el usuario");
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await updateUser(selectedUser._id, userData);
      toast.success("Usuario actualizado exitosamente");
      await fetchUsers();
      setModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error editando usuario:", error);
      toast.error("Error al actualizar el usuario");
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar "${user.username}"?`)) {
      try {
        await deleteUser(user._id);
        toast.success("Usuario eliminado exitosamente");
        await fetchUsers();
      } catch (error) {
        console.error("Error eliminando usuario:", error);
        toast.error("Error al eliminar el usuario");
      }
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="space-x-2 flex items-center">
          {/* Nuevo botón para modificar oro múltiple */}
          <Button 
            variant="outline"
            onClick={() => setMultiGoldModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Coins className="h-4 w-4" />
            Modificar Oro Múltiple
          </Button>
          <Button
            onClick={() => {
              setModalMode("create");
              setSelectedUser(null);
              setModalOpen(true);
            }}
          >
            Crear Usuario
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-y-auto max-h-[calc(100vh-340px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Imagen</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, visibleUsers).map((user, index) => (
                  <TableRow
                    key={user._id}
                    ref={index === filteredUsers.slice(0, visibleUsers).length - 1 ? lastUserRef : null}
                  >
                    <TableCell>
                        {user.src ? (
                            <img 
                                src={user.src} 
                                alt={user.username}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs">No img</span>
                            </div>
                        )}
                    </TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='bg-black' align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(user)}
                            className="text-primary"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setModalMode("edit");
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user)}
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
          </div>
        </CardContent>
      </Card>

      <UserModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={modalMode === "create" ? handleCreateUser : handleEditUser}
        mode={modalMode}
      />

      {selectedUser && (
        <UserDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdate={updateUserInState}
        />
      )}

      {/* Modal para actualización múltiple de oro */}
      <MultiGoldModal
        isOpen={multiGoldModalOpen}
        onClose={() => setMultiGoldModalOpen(false)}
        users={users}
        onUsersUpdate={updateMultipleUsersInState}
      />

      {loading && <p className="text-center text-muted-foreground">Cargando más usuarios...</p>}
    </div>
  );
};