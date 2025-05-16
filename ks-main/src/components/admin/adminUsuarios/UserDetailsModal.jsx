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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNextRank } from "@/services/rankService";
import { getActiveItems } from "@/services/inventoryService";
import { updateUserGold, getUpdatedUser } from "@/services/userService";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  Award, 
  Coins, 
  User, 
  Package, 
  Puzzle, 
  MailOpen, 
  Calendar, 
  ShieldCheck 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Placeholder images
import defaultCuponImage from "../../../assets/Cupones.png";
import defaultSkinImage from "../../../assets/Skin.png";

const UserDetailsModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [rankInfo, setRankInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  
  // Estados para el modal de modificación de oro
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [goldAmount, setGoldAmount] = useState("");
  const [goldOperation, setGoldOperation] = useState("sumar");
  const [updatingGold, setUpdatingGold] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchRankInfo();
    }
  }, [isOpen, user]);

  // Carga el inventario cuando se selecciona la pestaña de inventario
  useEffect(() => {
    if (isOpen && user && activeTab === "inventory") {
      fetchInventory();
    }
  }, [isOpen, user, activeTab]);

  const fetchRankInfo = async () => {
    setLoading(true);
    try {
      // Obtener información del rango actual y próximo
      const nextRankInfo = await getNextRank(user.xp);
      setRankInfo(nextRankInfo);
    } catch (error) {
      console.error("Error fetching rank information:", error);
      toast.error("Error al obtener información del rango");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!user?._id) return;
    
    setInventoryLoading(true);
    try {
      const response = await getActiveItems(user._id);
      // console.log("Inventario cargado:", response.items);
      setInventory(response.items || []);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      toast.error("Error al cargar el inventario del usuario");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Función para manejar la actualización del oro
  const handleUpdateGold = async () => {
    if (!goldAmount || isNaN(goldAmount) || Number(goldAmount) <= 0) {
      toast.error("Por favor ingresa una cantidad válida");
      return;
    }
    
    setUpdatingGold(true);
    try {
      // Llamar a la función para actualizar el oro
      const response = await updateUserGold(user._id, goldAmount, goldOperation);
      
      // Actualizar los datos del usuario
      const updatedUser = await getUpdatedUser(user._id);
      
      // Actualizar el estado del usuario en el componente padre
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // También actualizar el estado local
      user.gold = updatedUser.gold;
      
      toast.success(`Oro ${goldOperation === 'sumar' ? 'añadido' : goldOperation === 'restar' ? 'restado' : 'actualizado'} exitosamente`);
      setIsGoldModalOpen(false);
      setGoldAmount("");
      
      // Refrescar los datos del usuario en la modal
      fetchRankInfo();
    } catch (error) {
      toast.error(error.message || "Error al actualizar el oro");
    } finally {
      setUpdatingGold(false);
    }
  };

  // Calcular el porcentaje de progreso hacia el siguiente rango
  const calculateProgress = () => {
    if (!rankInfo || !rankInfo.nextRank) return 100; // Si no hay próximo rango, está al 100%
    
    const currentXp = user.xp;
    const currentRankXp = rankInfo.currentRank?.xp || 0;
    const nextRankXp = rankInfo.nextRank?.xp || 0;
    
    // Si los rangos tienen el mismo XP (caso extremo), retornar 100%
    if (nextRankXp - currentRankXp <= 0) return 100;
    
    // Calcular el progreso como porcentaje
    const xpProgress = currentXp - currentRankXp;
    const xpNeeded = nextRankXp - currentRankXp;
    return Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);
  };

  // Formatea la fecha en un formato legible
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función mejorada para obtener URL de imágenes
  const getImageUrl = (item) => {
    if (!item) return "/placeholder-item.png";
    
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    
    // Para cupones, usamos la imagen por defecto o la proporcionada
    if (item.itemType === "RewardCouponPreset") {
      // Si hay una imagen específica en details.image, usarla
      if (item.details?.image) {
        return item.details.image;
      }
      // Si no, usar la imagen por defecto
      return defaultCuponImage;
    }
    
    // Para fragmentos, usamos la imagen por defecto o la proporcionada
    if (item.itemType === "FragmentsUser" || item.itemType === "FragmentsPreset") {
      // Si hay una imagen específica en details.image, usarla
      if (item.details?.image) {
        return item.details.image;
      }
      // Si no, usar la imagen por defecto
      return defaultSkinImage;
    }
    
    // Para skins
    if (item.itemType === "Skin") {
      // 1. Intenta con srcWeb
      if (item.srcWeb) {
        return item.srcWeb;
      }
      
      // 2. Intenta con details.srcWeb
      if (item.details?.srcWeb) {
        return item.details.srcWeb;
      }
      
      // 3. Si hay itemId y es un objeto
      if (typeof item.itemId === 'object') {
        // Intenta con srcWeb dentro de itemId
        if (item.itemId.srcWeb) {
          return item.itemId.srcWeb;
        }
      }
      
      // 4. Intenta rutas locales 
      let localPath = null;
      
      // Primero en el item
      if (item.srcLocal) {
        localPath = item.srcLocal;
      } 
      // Luego en details
      else if (item.details?.srcLocal) {
        localPath = item.details.srcLocal;
      } 
      // Finalmente en itemId
      else if (typeof item.itemId === 'object' && item.itemId.srcLocal) {
        localPath = item.itemId.srcLocal;
      }
      
      // Si encontramos una ruta local, construir URL
      if (localPath) {
        const cleanPath = localPath.replace(/\\/g, '/');
        // Si ya es una URL completa
        if (cleanPath.startsWith('http')) return cleanPath;
        
        // Intentar varios formatos de URL
        // Quitar el '/images/' inicial si existe
        const finalPath = cleanPath.startsWith('/images/')
          ? cleanPath
          : '/images/' + cleanPath;
        
        return `${API_BASE_URL}${finalPath}`;
      }
      
      // Si nada funciona, devolver imagen por defecto para skins
      return defaultSkinImage;
    }
    
    // Para otros tipos de items
    if (item.itemType === "Item") {
      // 1. Intenta con srcWeb
      if (item.srcWeb) {
        return item.srcWeb;
      }
      
      // 2. Intenta con details.srcWeb
      if (item.details?.srcWeb) {
        return item.details.srcWeb;
      }
      
      // 3. Si hay itemId y es un objeto
      if (typeof item.itemId === 'object') {
        // Intenta con srcWeb dentro de itemId
        if (item.itemId.srcWeb) {
          return item.itemId.srcWeb;
        }
      }
      
      // 4. Intenta rutas locales
      let localPath = null;
      
      // Primero en el item
      if (item.srcLocal) {
        localPath = item.srcLocal;
      } 
      // Luego en details
      else if (item.details?.srcLocal) {
        localPath = item.details.srcLocal;
      } 
      // Finalmente en itemId
      else if (typeof item.itemId === 'object' && item.itemId.srcLocal) {
        localPath = item.itemId.srcLocal;
      }
      
      // Si encontramos una ruta local, construir URL
      if (localPath) {
        const cleanPath = localPath.replace(/\\/g, '/');
        // Si ya es una URL completa
        if (cleanPath.startsWith('http')) return cleanPath;
        
        // Intentar varios formatos de URL
        // Quitar el '/images/' inicial si existe
        const finalPath = cleanPath.startsWith('/images/')
          ? cleanPath
          : '/images/' + cleanPath;
        
        return `${API_BASE_URL}${finalPath}`;
      }
    }
    
    // Si llegamos aquí, devolver un placeholder
    return "/placeholder-item.png";
  };

  // Obtener el nombre de un item del inventario
  const getItemName = (item) => {
    if (!item) return "Sin nombre";
    
    // 1. Intentar con details.name
    if (item.details?.name) {
      return item.details.name;
    }
    
    // 2. Para fragmentos, buscar fragmentName
    if (item.itemType === "FragmentsUser") {
      if (item.details?.fragmentName) {
        return item.details.fragmentName;
      }
    }
    
    // 3. Intentar con name directo
    if (item.name) {
      return item.name;
    }
    
    // 4. Si es una skin, intentar con NombreSkin
    if (item.NombreSkin) {
      return item.NombreSkin;
    }
    
    // 5. Intentar con itemId
    const itemData = item.itemId;
    if (typeof itemData === 'object') {
      if (itemData?.name) {
        return itemData.name;
      }
      
      if (itemData?.NombreSkin) {
        return itemData.NombreSkin;
      }
    }
    
    // Por defecto según el tipo
    if (item.itemType === "FragmentsUser") {
      return "Fragmento";
    }
    
    if (item.itemType === "RewardCouponPreset") {
      return "Cupón de recompensa";
    }
    
    return "Sin nombre";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detalles del Usuario</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Inventario</span>
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Perfil */}
          <TabsContent value="profile">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información básica del usuario */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      {user.src ? (
                        <img
                          src={user.src}
                          alt={user.username}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-lg">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-xl">{user.fullName}</CardTitle>
                        <CardDescription>@{user.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <div className="flex items-center gap-2">
                          <MailOpen className="h-4 w-4 text-primary" />
                          <p>{user.email}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rol</p>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <p>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <p>{user.active ? 'Activo' : 'Inactivo'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Verificado</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${user.verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <p>{user.verified ? 'Sí' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.createdAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de registro</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p>{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tarjeta de progreso y rango */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle>Progreso y Rango</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {rankInfo?.currentRank?.icon ? (
                        <img
                          src={rankInfo.currentRank.icon}
                          alt={rankInfo.currentRank.name}
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <Award className="h-16 w-16 text-primary" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{rankInfo?.currentRank?.name || "Sin rango"}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm">{user.xp} XP</span>
                        </div>
                        {rankInfo?.nextRank && (
                          <>
                            <Progress value={calculateProgress()} className="h-2 mb-1" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{rankInfo.currentRank?.xp || 0} XP</span>
                              <span>{rankInfo.xpToNextRank} XP restantes</span>
                              <span>{rankInfo.nextRank?.xp} XP</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Siguiente rango */}
                    {rankInfo?.nextRank && (
                      <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 flex items-center justify-center">
                            {rankInfo.nextRank.icon ? (
                              <img
                                src={rankInfo.nextRank.icon}
                                alt={rankInfo.nextRank.name}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <Award className="h-8 w-8 text-primary/80" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Próximo rango: {rankInfo.nextRank.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Necesita {rankInfo.xpToNextRank} XP más para subir de nivel
                            </p>
                          </div>
                        </div>
                        <p className="text-xs flex items-center">
                          <Coins className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                          Recompensa: {rankInfo.nextRank.gold} de oro al alcanzar este rango
                        </p>
                      </div>
                    )}
                    
                    {!rankInfo?.nextRank && (
                      <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                        <p className="text-sm">Este usuario ha alcanzado el rango máximo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tarjeta de monedas */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <CardTitle>Monedas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-3 rounded-full">
                          <Coins className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{user.gold}</p>
                          <p className="text-sm text-muted-foreground">Oro disponible</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setIsGoldModalOpen(true)} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Coins className="h-4 w-4" />
                        Modificar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Pestaña de Inventario */}
          <TabsContent value="inventory">
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Inventario del Usuario</CardTitle>
                    </div>
                    <CardDescription>
                      {inventory.length === 0 
                        ? "Este usuario no tiene items en su inventario." 
                        : `${inventory.length} items en el inventario.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inventory.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {inventory.map((item) => {
                          const isCoupon = item.itemType === "RewardCouponPreset";
                          const isFragment = item.itemType === "FragmentsUser";
                          const isSkin = item.itemType === "Skin";
                          
                          const imageUrl = getImageUrl(item);
                          const itemName = getItemName(item);
                          
                          // Depurar información del item
                          // console.log(`Item ${itemName}:`, {
                            type: item.itemType,
                            imageUrl,
                            srcWeb: item.srcWeb,
                            srcLocal: item.srcLocal,
                            details: item.details,
                            itemId: item.itemId
                          });
                          
                          return (
                            <div
                              key={item._id}
                              className="relative bg-accent rounded-lg overflow-hidden shadow-sm"
                            >
                              <div className="aspect-square relative overflow-hidden">
                                {/* Etiqueta de tipo */}
                                <div className="absolute top-1 left-1 z-10">
                                  {isCoupon && (
                                    <div className="bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                      Cupón
                                    </div>
                                  )}
                                  {isFragment && (
                                    <div className="bg-blue-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                      <Puzzle className="h-3 w-3 inline mr-0.5" />
                                      Fragmento
                                    </div>
                                  )}
                                  {isSkin && (
                                    <div className="bg-purple-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                      Skin
                                    </div>
                                  )}
                                  {!isCoupon && !isFragment && !isSkin && (
                                    <div className="bg-gray-400 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                      {item.itemType}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Imagen del ítem */}
                                <div className="w-full h-full flex items-center justify-center p-2">
                                  <img
                                    src={imageUrl}
                                    alt={itemName}
                                    className="max-w-full max-h-full object-cover p-0"
                                    onError={(e) => {
                                      console.error(`Error cargando imagen: ${imageUrl} para item ${itemName}`);
                                      e.target.src = isSkin ? defaultSkinImage : "/placeholder-item.png";
                                      e.target.onerror = null;
                                    }}
                                  />
                                </div>

                                {/* Metadata adicional */}
                                {!isCoupon && !isFragment && (
                                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded-md text-xs text-white z-10">
                                    x{item.quantity || 1}
                                  </div>
                                )}
                              </div>
                              
                              {/* Nombre del ítem */}
                              <div className="p-1.5 text-xs truncate text-center bg-black/40 text-white">
                                {itemName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay items en el inventario de este usuario.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal para modificar el oro */}
      <Dialog open={isGoldModalOpen} onOpenChange={setIsGoldModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modificar Oro del Usuario</DialogTitle>
            <DialogDescription>
              Ajusta la cantidad de oro para {user.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoldModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateGold} 
              disabled={updatingGold || !goldAmount}
            >
              {updatingGold ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  Procesando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default UserDetailsModal;