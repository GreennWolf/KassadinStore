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
import { Search, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { UserModal } from "./UserModal"; // Assuming UserModal is in a separate file

export const UsuariosManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const tableRef = useRef();
  const observer = useRef();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.data);
      console.log(data.data)
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los usuarios");
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
      console.log('updateing',userData)
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

      {loading && <p className="text-center text-muted-foreground">Cargando más usuarios...</p>}
    </div>
  );
};