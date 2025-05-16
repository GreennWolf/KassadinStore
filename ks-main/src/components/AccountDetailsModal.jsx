import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Check, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { chargeAccountData } from '../services/purcharseService';

const AccountDetailsModal = ({ isOpen, onClose, account, currentOrder, admin, itemId, onAccountUpdate }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountData, setAccountData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (account) {
      setAccountData({
        email: account.email || '',
        password: account.password || ''
      });
    }
  }, [account]);

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
      toast.success(`${type === 'email' ? 'Email' : 'Contraseña'} copiado al portapapeles`);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const handleSaveAccount = async () => {
    try {
      if (!accountData.email || !accountData.password) {
        toast.error('Por favor complete todos los campos');
        return;
      }

      await chargeAccountData(currentOrder._id, itemId, accountData);
      toast.success('Cuenta actualizada exitosamente');
      setIsEditing(false);
      if (onAccountUpdate) {
        onAccountUpdate({
          ...account,
          ...accountData
        });
      }
    } catch (error) {
      console.error('Error al guardar la cuenta:', error);
      toast.error('Error al actualizar la cuenta');
    }
  };

  const renderCredentials = () => {
    if (!account?.email || !account?.password) {
      if (admin) {
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cargar Credenciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email de la cuenta"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={accountData.password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contraseña de la cuenta"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveAccount}>
                Cargar Cuenta
              </Button>
            </CardContent>
          </Card>
        );
      } else {
        return (
          <Card className="bg-muted">
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                La cuenta aún no ha sido cargada. Por favor, espera a que el administrador cargue los datos.
              </p>
            </CardContent>
          </Card>
        );
      }
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credenciales de la cuenta</CardTitle>
            {admin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email de la cuenta"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={accountData.password}
                    onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Contraseña de la cuenta"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveAccount}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{account?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(account?.email, 'email')}
                >
                  {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Contraseña</p>
                  <p className="font-medium">{account?.password}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(account?.password, 'password')}
                >
                  {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Cuenta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Región:</span>
                <span>{account?.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nivel:</span>
                <span>{account?.nivel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Esencia Azul:</span>
                <span>{account?.escencia}</span>
              </div>
              {account?.escenciaNaranja > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esencia Naranja:</span>
                  <span>{account?.escenciaNaranja}</span>
                </div>
              )}
              {account?.rpAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RP:</span>
                  <span>{account?.rpAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className={account?.handUpgrade ? 'text-emerald-500' : 'text-red-500'}>
                  {account?.handUpgrade ? 'Safe' : 'Unsafe'}
                </span>
              </div>
            </CardContent>
          </Card>

          {renderCredentials()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDetailsModal;