import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loginUser, registerUser } from '../../services/userService';

export function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ 
        completeName: '',
        identifier: '',
        email: '', 
        username: '', 
        password: '', 
        confirmPassword: '' 
    });
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const user = await loginUser({ 
                identifier: formData.identifier, 
                password: formData.password 
            });
            console.log(user)
            localStorage.setItem('user', JSON.stringify(user.data));
            onClose();
        } catch (err) {
            setError('Error al iniciar sesión. Verifique sus credenciales.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        try {
            const newUser = await registerUser({
                fullName: formData.completeName,
                email: formData.email,
                username: formData.username,
                password: formData.password
            });
            localStorage.setItem('user', JSON.stringify(newUser.data));
            onClose();
        } catch (err) {
            setError('Error al registrar. Intente con otro email o username.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </DialogTitle>
                </DialogHeader>

                {error && <p className="text-destructive text-sm mb-4">{error}</p>}

                <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                    {isLogin ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Email o Username</Label>
                                <Input
                                    id="identifier"
                                    value={formData.identifier}
                                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="completeName">Nombre Completo</Label>
                                <Input
                                    id="completeName"
                                    value={formData.completeName}
                                    onChange={(e) => setFormData({ ...formData, completeName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </Button>
                    </DialogFooter>
                </form>

                <div className="mt-4 text-center text-sm">
                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Regístrate" : "Inicia Sesión"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}