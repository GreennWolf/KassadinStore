import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../services/userService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { Loader2 } from "lucide-react";

export function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, valid, error
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const verifyToken = async () => {
            try {
                await verifyResetToken(token);
                setStatus('valid');
            } catch (error) {
                setStatus('error');
                toast.error(error.message || 'Token inválido o expirado');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, formData.newPassword);
            toast.success('Contraseña actualizada exitosamente');
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            toast.error(error.message || 'Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                        <h2 className="text-2xl font-bold">Verificando token...</h2>
                        <p className="text-muted-foreground">
                            Por favor espera mientras verificamos tu solicitud
                        </p>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center space-y-4">
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                            <h2 className="text-2xl font-bold mb-2">Error de verificación</h2>
                            <p>El enlace ha expirado o no es válido.</p>
                        </div>
                        <Button 
                            onClick={() => navigate('/')}
                            variant="outline"
                            size="lg"
                            className="mt-4"
                        >
                            Volver al inicio
                        </Button>
                    </div>
                );

            case 'valid':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">Restablecer Contraseña</h2>
                            <p className="text-muted-foreground mt-2">
                                Ingresa tu nueva contraseña
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        newPassword: e.target.value
                                    })}
                                    required
                                    placeholder="********"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        confirmPassword: e.target.value
                                    })}
                                    required
                                    placeholder="********"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <Loader2 className="animate-spin mr-2" />
                                        Actualizando...
                                    </span>
                                ) : (
                                    'Actualizar Contraseña'
                                )}
                            </Button>
                        </form>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-[500px] w-full bg-card border rounded-xl shadow-lg p-8">
                {renderContent()}
            </div>
        </div>
    );
}