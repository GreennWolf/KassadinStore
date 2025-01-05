import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { getAllItems } from '../../../services/itemService';
import { getAllSkins } from '../../../services/champsService';
import { Label } from '@/components/ui/label';

const ITEM_TYPES = ['todos', 'loot', 'icon', 'chromas', 'presale', 'tft', 'bundle', 'unrankeds'];

export function SelectionModal({ isOpen, onClose, onSelect, totalRate = 0 }) {
  const [activeTab, setActiveTab] = useState('skins');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('todos');
  const [skins, setSkins] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [couponData, setCouponData] = useState({
    days: '',
    discount: ''
  });
  const [goldAmount, setGoldAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'skins') {
        fetchSkins();
      } else if (activeTab === 'items') {
        fetchItems();
      }
    }
  }, [isOpen, activeTab]);

  const fetchSkins = async () => {
    setLoading(true);
    try {
      const response = await getAllSkins({ showAll: true });
      setSkins(response.data || []);
    } catch (error) {
      console.error('Error fetching skins:', error);
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { showAll: true };
      if (selectedItemType !== 'todos') {
        params.type = selectedItemType;
      }
      const response = await getAllItems(params);
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'items') {
      fetchItems();
    }
  }, [selectedItemType]);

  const filteredSkins = skins.filter(skin => 
    skin.NombreSkin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCoupon = () => {
    if (!couponData.days || !couponData.discount) return;
    
    onSelect({
      itemType: 'Cupon',
      itemId: `${couponData.discount}-${couponData.days}`,
      dropRate: 0,
      quantity: 1,
      details: {
        discount: couponData.discount,
        days: couponData.days
      }
    });
    
    setCouponData({ days: '', discount: '' });
    onClose();
  };

  const handleAddGold = () => {
    if (!goldAmount) return;
    
    onSelect({
      itemType: 'Gold',
      itemId: goldAmount,
      dropRate: 0,
      quantity: 1,
      details: {
        amount: goldAmount
      }
    });
    
    setGoldAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agregar Item a la Lootbox</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Porcentaje total actual: {totalRate}%
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skins">Skins</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="cupones">Cupones</TabsTrigger>
            <TabsTrigger value="oro">Oro</TabsTrigger>
          </TabsList>

          <TabsContent value="skins">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar skins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                <div className="grid grid-cols-2 gap-4 p-4">
                  {filteredSkins.map((skin) => (
                    <Card 
                      key={skin._id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        onSelect({
                          itemType: 'Skin',
                          itemId: skin._id,
                          dropRate: 0,
                          quantity: 1,
                          details: {
                            name: skin.NombreSkin,
                            image: skin.srcLocal
                          }
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
                            {skin.priceRP} RP
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="items">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de item" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                <div className="grid grid-cols-2 gap-4 p-4">
                  {filteredItems.map((item) => (
                    <Card 
                      key={item._id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        onSelect({
                          itemType: 'Item',
                          itemId: item._id,
                          dropRate: 0,
                          quantity: 1,
                          details: {
                            name: item.name,
                            image: item.srcLocal,
                            type: item.type
                          }
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
                          <div className="text-sm text-muted-foreground">
                            {item.type}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="cupones">
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Porcentaje de descuento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={couponData.discount}
                    onChange={(e) => setCouponData(prev => ({
                      ...prev,
                      discount: e.target.value
                    }))}
                    placeholder="Ej: 15%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días de validez</Label>
                  <Input
                    type="number"
                    min="1"
                    value={couponData.days}
                    onChange={(e) => setCouponData(prev => ({
                      ...prev,
                      days: e.target.value
                    }))}
                    placeholder="Ej: 30 días"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddCoupon} 
                className="w-full"
                disabled={!couponData.days || !couponData.discount}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cupón
              </Button>
            </div>
          </TabsContent>

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
                <Plus className="w-4 h-4 mr-2" />
                Agregar Oro
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}