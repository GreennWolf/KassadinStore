import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getEloBoostConfig, updateEloBoostConfig } from '@/services/eloBoostService';
import { useToast } from '@/hooks/use-toast';

const EloBoostConfigManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    specificRolePricePercent: 10,
    specificChampionPricePercent: 10,
    duoQueuePricePercent: 35,
    availableRoles: [
      { name: 'Top', active: true },
      { name: 'Jungle', active: true },
      { name: 'Mid', active: true },
      { name: 'ADC', active: true },
      { name: 'Support', active: true },
    ],
    active: true,
  });
  
  const token = localStorage.getItem('token');

  // Cargar configuración inicial
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await getEloBoostConfig();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching config:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la configuración',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast]);

  // Manejar cambios en los inputs
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // Manejar cambio de switch de rol
  const handleRoleActiveChange = (index, checked) => {
    setConfig((prev) => {
      const newRoles = [...prev.availableRoles];
      newRoles[index] = { ...newRoles[index], active: checked };
      return {
        ...prev,
        availableRoles: newRoles,
      };
    });
  };

  // Manejar cambio de switch general
  const handleActiveChange = (checked) => {
    setConfig((prev) => ({
      ...prev,
      active: checked,
    }));
  };

  // Guardar configuración
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateEloBoostConfig(config, token);
      
      toast({
        title: 'Éxito',
        description: 'Configuración actualizada correctamente',
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <p>Cargando configuración...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Elo Boost</CardTitle>
        <CardDescription>
          Configure los precios adicionales y opciones disponibles para el servicio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Precios Adicionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="specificRolePricePercent">Rol Específico (%)</Label>
              <Input
                id="specificRolePricePercent"
                name="specificRolePricePercent"
                type="number"
                value={config.specificRolePricePercent}
                onChange={handlePriceChange}
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje adicional por seleccionar un rol específico
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specificChampionPricePercent">Campeón Específico (%)</Label>
              <Input
                id="specificChampionPricePercent"
                name="specificChampionPricePercent"
                type="number"
                value={config.specificChampionPricePercent}
                onChange={handlePriceChange}
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje adicional por seleccionar un campeón específico
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duoQueuePricePercent">Duo con Booster (%)</Label>
              <Input
                id="duoQueuePricePercent"
                name="duoQueuePricePercent"
                type="number"
                value={config.duoQueuePricePercent}
                onChange={handlePriceChange}
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje adicional por jugar en dúo con el booster
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Roles Disponibles</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {config.availableRoles.map((role, index) => (
              <div key={role.name} className="flex flex-col items-center p-4 border rounded-lg">
                <span className="text-base font-medium mb-2">{role.name}</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`role-${index}`}
                    checked={role.active}
                    onCheckedChange={(checked) => handleRoleActiveChange(index, checked)}
                  />
                  <Label htmlFor={`role-${index}`}>
                    {role.active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={config.active}
              onCheckedChange={handleActiveChange}
            />
            <Label htmlFor="active">
              Servicio de Elo Boost Activo
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cuando está desactivado, los usuarios no podrán acceder al servicio
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EloBoostConfigManager;