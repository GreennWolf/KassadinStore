import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Servicios para skins, items, RPPrice y fragmentos
import { getAllItems } from "../../../services/itemService";
import { getAllSkins } from "../../../services/champsService";
import { getAllRpPrice } from "../../../services/rpService";
import { getAllFragmentsPresets } from "../../../services/fragmentsService";

// Constantes para búsquedas en el modal principal
const ITEM_TYPES = [
  "todos",
  "loot",
  "icon",
  "chromas",
  "presale",
  "tft",
  "bundle",
  "unrankeds",
];
// Opciones para filtrar recompensas en el modal de selección (además de "skins")
const FRAGMENT_RPTYPE_OPTIONS = [
  ...ITEM_TYPES,
  "skins",
];

const ITEMS_PER_PAGE = 20;

/**
 * Modal para seleccionar la recompensa en fragmentos de tipo "específico".
 * Incluye buscador, infinite scroll y muestra la imagen (srcLocal) junto al nombre.
 * Si rewardType es "skin" se usa getAllSkins; para "chromas" y demás se usa getAllItems
 * pasando type igual a rewardType. En el caso de "chromas", se muestra: {item.name} - {item.skin.NombreSkin}.
 */
function RewardSelectionModal({ isOpen, onClose, rewardType, onSelect }) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef(null);
  const endRef = useRef(null);

  const fetchData = async (currentPage, reset = false) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 20, search };
      let result;
      if (rewardType === "skin") {
        result = await getAllSkins(params);
      } else {
        // Para "chromas" y demás rewardTypes se filtra con getAllItems
        result = await getAllItems({ ...params, type: rewardType });
      }
      const newData = result.data || [];
      if (reset) {
        setData(newData);
      } else {
        setData((prev) => [...prev, ...newData]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error al cargar recompensas:", error);
      toast.error("Error al cargar recompensas");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchData(1, true);
    }
  }, [isOpen, rewardType, search]);

  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage);
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    if (endRef.current) observer.observe(endRef.current);
    return () => {
      if (endRef.current) observer.unobserve(endRef.current);
    };
  }, [page, loading, hasMore, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar recompensa</DialogTitle>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              fetchData(1, true);
            }}
            className="mb-4"
          />
        </DialogHeader>
        <ScrollArea ref={scrollRef} className="h-64">
          {data.map((item) => {
            let displayName = "";
            if (rewardType === "skin") {
              displayName = item.NombreSkin;
            } else if (rewardType === "chromas") {
              displayName = `${item.name} - ${item.skin ? item.skin.NombreSkin : ""}`;
            } else {
              displayName = item.name;
            }
            return (
              <Card
                key={item._id}
                className="cursor-pointer hover:bg-accent transition-colors m-2 flex items-center"
                onClick={() => {
                  onSelect({
                    _id: item._id,
                    name: displayName,
                    srcLocal: item.srcLocal,
                  });
                  onClose();
                }}
              >
                <CardContent className="p-2 flex items-center">
                  <img
                    src={item.srcLocal}
                    alt={displayName}
                    className="w-10 h-10 object-cover rounded mr-2"
                  />
                  <p>{displayName}</p>
                </CardContent>
              </Card>
            );
          })}
          <div ref={endRef} />
          {loading && <p className="p-2 text-center">Cargando...</p>}
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente principal de selección de items para la lootbox.
 * Incluye pestañas para skins, items, cupón, oro y fragmentos. En la pestaña "fragmentos"
 * se permite elegir el "Tipo de Fragmento" (Específico o RP Type). Si es "Específico" se muestra
 * un select para elegir el rewardType y un botón para seleccionar la recompensa (se abre RewardSelectionModal),
 * mientras que si es "RP Type" se muestra únicamente el select para elegir el Precio RP.
 */
export function SelectionModal({ isOpen, onClose, onSelect, totalRate = 0 }) {
  const [activeTab, setActiveTab] = useState("skins");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemType, setSelectedItemType] = useState("todos");

  const [skins, setSkins] = useState([]);
  const [skinsPage, setSkinsPage] = useState(1);
  const [hasMoreSkins, setHasMoreSkins] = useState(true);

  const [items, setItems] = useState([]);
  const [itemsPage, setItemsPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  const [fragments, setFragments] = useState([]);
  const [fragmentsPage, setFragmentsPage] = useState(1);
  const [hasMoreFragments, setHasMoreFragments] = useState(true);

  const [loading, setLoading] = useState(false);

  // Estado para cupón (RewardCouponPreset)
  const [couponData, setCouponData] = useState({
    name: "",
    percent: "",
    validDays: "",
    maxUses: "",
    rpPrice: "",
    rpType: "ambos",
    applicableTo: "ambos",
    maxApplicableSkins: null,
  });
  const [rpPrices, setRpPrices] = useState([]);
  const [goldAmount, setGoldAmount] = useState("");

  // Estado para el formulario de fragmentos
  const [fragmentData, setFragmentData] = useState({
    name: "",
    type: "especifico", // "especifico" o "rptype"
    // En "especifico" se usará el select de "Recompensa"
    rewardType: "",
    requiredQuantity: 1,
    itemId: null, // Se selecciona si type === "especifico"
    rpId: null,   // Se selecciona si type === "rptype"
    selectedReward: null, // Guarda la recompensa seleccionada en "especifico"
  });
  const [fragmentSearchTerm, setFragmentSearchTerm] = useState("");

  // Estado para abrir el modal de selección de recompensa (para fragmentos de tipo "especifico")
  const [rewardModalOpen, setRewardModalOpen] = useState(false);

  // Refs para infinite scroll en el modal principal
  const skinsScrollRef = useRef(null);
  const itemsScrollRef = useRef(null);
  const fragmentsScrollRef = useRef(null);
  const skinsEndRef = useRef(null);
  const itemsEndRef = useRef(null);
  const fragmentsEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "skins") {
      setSkinsPage(1);
      fetchSkins(1, true);
    } else if (activeTab === "items") {
      setItemsPage(1);
      fetchItems(1, true);
    } else if (activeTab === "cupones") {
      fetchRpPrices();
    } else if (activeTab === "fragmentos") {
      setFragmentsPage(1);
      fetchFragments(1, true);
    }
  }, [isOpen, activeTab, searchTerm, selectedItemType]);

  useEffect(() => {
    if (fragmentData.type === "rptype" && rpPrices.length === 0) {
      fetchRpPrices();
    }
  }, [fragmentData.type]);

  const fetchSkins = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        subcategory: "all",
        showAll: true,
        orderByNew: false,
      };
      const result = await getAllSkins(params);
      const newSkins = result.data || [];
      if (reset) {
        setSkins(newSkins);
      } else {
        setSkins((prev) => [...prev, ...newSkins]);
      }
      setHasMoreSkins(result.hasMore);
    } catch (error) {
      console.error("Error al cargar skins:", error);
    }
    setLoading(false);
  };

  const fetchItems = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        showAll: true,
      };
      if (selectedItemType !== "todos") {
        params.type = selectedItemType;
      }
      const result = await getAllItems(params);
      const newItems = result.data || [];
      if (reset) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }
      setHasMoreItems(result.hasMore);
    } catch (error) {
      console.error("Error al cargar items:", error);
    }
    setLoading(false);
  };

  const fetchFragments = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = { page, limit: ITEMS_PER_PAGE, search: searchTerm };
      const result = await getAllFragmentsPresets(params);
      const newFragments = result.data || [];
      if (reset) {
        setFragments(newFragments);
      } else {
        setFragments((prev) => [...prev, ...newFragments]);
      }
      setHasMoreFragments(result.hasMore);
    } catch (error) {
      console.error("Error al cargar fragmentos:", error);
    }
    setLoading(false);
  };

  const fetchRpPrices = async () => {
    try {
      const data = await getAllRpPrice();
      setRpPrices(data || []);
    } catch (error) {
      console.error("Error al cargar precios de RP:", error);
    }
  };

  // Infinite scroll para skins
  useEffect(() => {
    if (activeTab !== "skins" || !skinsScrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMoreSkins) {
          const nextPage = skinsPage + 1;
          setSkinsPage(nextPage);
          fetchSkins(nextPage);
        }
      },
      { root: skinsScrollRef.current, threshold: 0.1 }
    );
    if (skinsEndRef.current) observer.observe(skinsEndRef.current);
    return () => {
      if (skinsEndRef.current) observer.unobserve(skinsEndRef.current);
    };
  }, [activeTab, loading, hasMoreSkins, skinsPage]);

  // Infinite scroll para items
  useEffect(() => {
    if (activeTab !== "items" || !itemsScrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMoreItems) {
          const nextPage = itemsPage + 1;
          setItemsPage(nextPage);
          fetchItems(nextPage);
        }
      },
      { root: itemsScrollRef.current, threshold: 0.1 }
    );
    if (itemsEndRef.current) observer.observe(itemsEndRef.current);
    return () => {
      if (itemsEndRef.current) observer.unobserve(itemsEndRef.current);
    };
  }, [activeTab, loading, hasMoreItems, itemsPage]);

  // Infinite scroll para fragmentos
  useEffect(() => {
    if (activeTab !== "fragmentos" || !fragmentsScrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMoreFragments) {
          const nextPage = fragmentsPage + 1;
          setFragmentsPage(nextPage);
          fetchFragments(nextPage);
        }
      },
      { root: fragmentsScrollRef.current, threshold: 0.1 }
    );
    if (fragmentsEndRef.current) observer.observe(fragmentsEndRef.current);
    return () => {
      if (fragmentsEndRef.current) observer.unobserve(fragmentsEndRef.current);
    };
  }, [activeTab, loading, hasMoreFragments, fragmentsPage]);

  // Función para agregar cupón (RewardCouponPreset)
  const handleAddCoupon = () => {
    const { name, percent, validDays, maxUses, rpPrice, rpType, applicableTo } = couponData;
    if (!name.trim() || !percent || !validDays || !maxUses || !rpType || (rpPrice && !couponData.maxApplicableSkins))
      return;

    onSelect({
      itemType: "RewardCouponPreset",
      itemId: "local-preset",
      dropRate: 0,
      quantity: 1,
      details: {
        name,
        percent,
        validDays,
        maxUses,
        rpPrice: rpPrice === "" ? null : rpPrice,
        rpType,
        applicableTo,
        ...(rpPrice ? { maxApplicableSkins: parseInt(couponData.maxApplicableSkins, 10) } : {}),
      },
    });

    setCouponData({
      name: "",
      percent: "",
      validDays: "",
      maxUses: "",
      rpPrice: "",
      rpType: "ambos",
      applicableTo: "ambos",
      maxApplicableSkins: null,
    });
    onClose();
  };

  // Función para agregar oro
  const handleAddGold = () => {
    if (!goldAmount) return;
    onSelect({
      itemType: "Gold",
      itemId: goldAmount,
      dropRate: 0,
      quantity: 1,
      details: { amount: goldAmount },
    });
    setGoldAmount("");
    onClose();
  };

  // Función para agregar fragmento (FragmentsPreset)
  const handleAddFragment = () => {
    const { name, type, rewardType, requiredQuantity, itemId, rpId } = fragmentData;
    if (!name.trim() || !type || !rewardType || !requiredQuantity || requiredQuantity < 1) {
      toast.error("Por favor, completa todos los campos obligatorios para el fragmento.");
      return;
    }
    if (type === "especifico" && !itemId) {
      toast.error("Debes seleccionar una recompensa para este fragmento.");
      return;
    }
    if (type === "rptype" && !rpId) {
      toast.error("Debes seleccionar un precio de RP para este fragmento.");
      return;
    }
    onSelect({
      itemType: "FragmentsPreset",
      itemId: "local-preset",
      dropRate: 0,
      quantity: 1,
      details: {
        name,
        type,
        rewardType,
        requiredQuantity,
        itemId: type === "especifico" ? itemId : null,
        rpId: type === "rptype" ? rpId : null,
      },
    });
    setFragmentData({
      name: "",
      type: "especifico",
      rewardType: "",
      requiredQuantity: 1,
      itemId: null,
      rpId: null,
      selectedReward: null,
    });
    setFragmentSearchTerm("");
    onClose();
  };

  const getTotalRate = () => {
    return formData.items.reduce((sum, item) => sum + Number(item.dropRate), 0);
  };

  const getRarityClass = (dropRate) => {
    if (dropRate <= 1) {
      return {
        border: "border-yellow-500",
        bg: "bg-yellow-500/10",
        text: "text-yellow-500",
        shadow: "shadow-yellow-500/25",
      };
    }
    if (dropRate <= 5) {
      return {
        border: "border-purple-500",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        shadow: "shadow-purple-500/25",
      };
    }
    if (dropRate <= 20) {
      return {
        border: "border-blue-500",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        shadow: "shadow-blue-500/25",
      };
    }
    return {
      border: "border-gray-500",
      bg: "bg-gray-500/10",
      text: "text-gray-500",
      shadow: "shadow-gray-500/25",
    };
  };

  const getItemDisplay = (item) => {
    switch (item.itemType) {
      case "Skin":
      case "Item":
        return item.details?.name || "Item";
      case "RewardCouponPreset":
        return `${item.details.name}`;
      case "Gold":
        return `${item.details?.amount || "0"} Oro`;
      case "FragmentsPreset":
        return `${item.details.name}`;
      default:
        return item.itemType;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar Item a la Lootbox</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Porcentaje total actual: {totalRate}%
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="skins">Skins</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="cupones">Cupón</TabsTrigger>
              <TabsTrigger value="oro">Oro</TabsTrigger>
              <TabsTrigger value="fragmentos">Fragmentos</TabsTrigger>
            </TabsList>

            {/* TAB: Skins */}
            <TabsContent value="skins">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar skins..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSkinsPage(1);
                      fetchSkins(1, true);
                    }}
                    className="pl-8"
                  />
                </div>
                <ScrollArea ref={skinsScrollRef} className="h-[400px] rounded-md border">
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {skins.map((skin) => (
                      <Card
                        key={skin._id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelect({
                            itemType: "Skin",
                            itemId: skin._id,
                            dropRate: 0,
                            quantity: 1,
                            details: {
                              name: skin.NombreSkin,
                              image: skin.srcLocal,
                            },
                          });
                          onClose();
                        }}
                      >
                        <CardContent className="flex items-center p-4">
                          <img
                            src={skin.srcLocal}
                            alt={skin.NombreSkin}
                            className="w-16 h-16 object-cover rounded mr-4"
                          />
                          <div>
                            <div className="font-medium">{skin.NombreSkin}</div>
                            <div className="text-sm text-muted-foreground">
                              {skin.priceRPData.valueRP} RP
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div ref={skinsEndRef} />
                </ScrollArea>
              </div>
            </TabsContent>

            {/* TAB: Items */}
            <TabsContent value="items">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar items..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setItemsPage(1);
                        fetchItems(1, true);
                      }}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={selectedItemType}
                    onValueChange={(value) => {
                      setSelectedItemType(value);
                      setItemsPage(1);
                      fetchItems(1, true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de item" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea ref={itemsScrollRef} className="h-[400px] rounded-md border">
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {items.map((item) => (
                      <Card
                        key={item._id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelect({
                            itemType: "Item",
                            itemId: item._id,
                            dropRate: 0,
                            quantity: 1,
                            details: {
                              name: item.name,
                              image: item.srcLocal,
                              type: item.type,
                            },
                          });
                          onClose();
                        }}
                      >
                        <CardContent className="flex items-center p-4">
                          <img
                            src={item.srcLocal}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded mr-4"
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.type}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div ref={itemsEndRef} />
                </ScrollArea>
              </div>
            </TabsContent>

            {/* TAB: Cupón */}
            <TabsContent value="cupones">
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Cupón</Label>
                    <Input
                      type="text"
                      value={couponData.name}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ej: Cupón super promo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porcentaje de descuento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={couponData.percent}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          percent: e.target.value,
                        }))
                      }
                      placeholder="Ej: 15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Días de validez</Label>
                    <Input
                      type="number"
                      min="1"
                      value={couponData.validDays}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          validDays: e.target.value,
                        }))
                      }
                      placeholder="Ej: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usos máximos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={couponData.maxUses}
                      onChange={(e) =>
                        setCouponData((prev) => ({
                          ...prev,
                          maxUses: e.target.value,
                        }))
                      }
                      placeholder="Ej: 5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de RP</Label>
                    <Select
                      value={couponData.rpType}
                      onValueChange={(value) =>
                        setCouponData((prev) => ({ ...prev, rpType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seguro">Seguro</SelectItem>
                        <SelectItem value="barato">Barato</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio RP</Label>
                    <Select
                      value={couponData.rpPrice}
                      onValueChange={(value) =>
                        setCouponData((prev) => ({ ...prev, rpPrice: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los RP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Todos los RP</SelectItem>
                        {rpPrices.map((rp) => (
                          <SelectItem key={rp._id} value={rp._id}>
                            {rp.valueRP} RP
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {couponData.rpPrice ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aplicable a</Label>
                      <Select
                        value={couponData.applicableTo}
                        onValueChange={(value) =>
                          setCouponData((prev) => ({ ...prev, applicableTo: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="items">Items</SelectItem>
                          <SelectItem value="skins">Skins</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad máxima aplicable</Label>
                      <Input
                        type="number"
                        min="1"
                        value={couponData.maxApplicableSkins || ""}
                        onChange={(e) =>
                          setCouponData((prev) => ({
                            ...prev,
                            maxApplicableSkins: e.target.value,
                          }))
                        }
                        placeholder="Ej: 1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Aplicable a</Label>
                    <Select
                      value={couponData.applicableTo}
                      onValueChange={(value) =>
                        setCouponData((prev) => ({ ...prev, applicableTo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="skins">Skins</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleAddCoupon}
                  className="w-full"
                  disabled={
                    !couponData.name.trim() ||
                    !couponData.percent ||
                    !couponData.validDays ||
                    !couponData.maxUses ||
                    !couponData.rpType ||
                    !couponData.applicableTo ||
                    (couponData.rpPrice && !couponData.maxApplicableSkins)
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cupón
                </Button>
              </div>
            </TabsContent>

            {/* TAB: Oro */}
            <TabsContent value="oro">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Cantidad de Oro</Label>
                  <Input
                    type="number"
                    min="1"
                    value={goldAmount}
                    onChange={(e) => setGoldAmount(e.target.value)}
                    placeholder="Ej: 1000"
                  />
                </div>
                <Button
                  onClick={handleAddGold}
                  className="w-full"
                  disabled={!goldAmount}
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar Oro
                </Button>
              </div>
            </TabsContent>

            {/* TAB: Fragmentos */}
            <TabsContent value="fragmentos">
              <div className="space-y-4 p-4">
                <div className="mb-4">
                  <Label className="block mb-1">Nombre del Fragmento</Label>
                  <Input
                    type="text"
                    placeholder="Nombre del fragmento"
                    value={fragmentData.name}
                    onChange={(e) =>
                      setFragmentData({ ...fragmentData, name: e.target.value })
                    }
                  />
                </div>
                {/* Selección del Tipo de Fragmento */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="block mb-1">Tipo de Fragmento</Label>
                    <Select
                      value={fragmentData.type}
                      onValueChange={(value) =>
                        setFragmentData({
                          ...fragmentData,
                          type: value,
                          itemId: null,
                          selectedReward: null,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de fragmento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="especifico">Específico</SelectItem>
                        <SelectItem value="rptype">RP Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                      <Label className="block mb-1">Recompensa</Label>
                      <Select
                        value={fragmentData.rewardType}
                        onValueChange={(value) =>
                          setFragmentData({
                            ...fragmentData,
                            rewardType: value,
                            itemId: null,
                            selectedReward: null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona recompensa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skin">Skin</SelectItem>
                          <SelectItem value="loot">Loot</SelectItem>
                          <SelectItem value="icon">Icon</SelectItem>
                          <SelectItem value="chromas">Chromas</SelectItem>
                          <SelectItem value="presale">Presale</SelectItem>
                          <SelectItem value="tft">TFT</SelectItem>
                          <SelectItem value="bundle">Bundle</SelectItem>
                          <SelectItem value="unrankeds">Unrankeds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
                {fragmentData.type === "especifico" && (
                  <div className="mb-4">
                    <Label className="block mb-1">Recompensa seleccionada</Label>
                    {fragmentData.selectedReward ? (
                      <div className="p-2 border rounded flex justify-between items-center">
                        <img
                          src={fragmentData.selectedReward.srcLocal}
                          alt={fragmentData.selectedReward.name}
                          className="w-10 h-10 object-cover rounded mr-2"
                        />
                        <p>{fragmentData.selectedReward.name}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setFragmentData({
                              ...fragmentData,
                              itemId: null,
                              selectedReward: null,
                            })
                          }
                        >
                          Quitar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setRewardModalOpen(true)}>
                        Seleccionar recompensa
                      </Button>
                    )}
                  </div>
                )}
                {fragmentData.type === "rptype" && (
                  <div className="mb-4">
                    <Label className="block mb-1">Seleccionar Precio RP</Label>
                    <Select
                      value={fragmentData.rpId || ""}
                      onValueChange={(value) =>
                        setFragmentData({ ...fragmentData, rpId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona RP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem>Selecciona RP</SelectItem>
                        {rpPrices.map((rp) => (
                          <SelectItem key={rp._id} value={rp._id}>
                            {rp.valueRP} RP
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="mb-4">
                  <Label className="block mb-1">Cantidad necesaria para canjear</Label>
                  <Input
                    type="number"
                    min="1"
                    value={fragmentData.requiredQuantity}
                    onChange={(e) =>
                      setFragmentData({
                        ...fragmentData,
                        requiredQuantity: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <Button onClick={handleAddFragment} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Fragmento
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal para selección de recompensa en fragmentos de tipo "especifico" */}
      <RewardSelectionModal
        isOpen={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        rewardType={fragmentData.rewardType}
        onSelect={(reward) =>
          setFragmentData({
            ...fragmentData,
            itemId: reward._id,
            selectedReward: reward,
          })
        }
      />
    </>
  );
}

export default SelectionModal;
