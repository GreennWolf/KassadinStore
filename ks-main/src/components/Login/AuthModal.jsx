import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser, forgotPassword } from '../../services/userService';
import { toast } from 'react-toastify';

export function AuthModal({ isOpen, onClose }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgotPassword'
  const [formData, setFormData] = useState({
    completeName: '',
    identifier: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setFormData({
      completeName: '',
      identifier: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setError(null);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginUser({
        identifier: formData.identifier,
        password: formData.password
      });

      // Guardar el usuario en localStorage
      localStorage.setItem('user', JSON.stringify(user.data));
      
      // Guardar el token por separado para acceso directo
      if (user.token) {
        console.log('Guardando token:', user.token);
        localStorage.setItem('token', user.token);
      } else {
        console.warn('No se encontró token en la respuesta del servidor');
      }
      
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error de login completo:', err);
      if (err.message === 'Por favor verifica tu correo electrónico antes de iniciar sesión') {
        setShowVerificationMessage(true);
      } else {
        setError('Error al iniciar sesión. Verifique sus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Por favor ingrese un email válido.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        fullName: formData.completeName,
        email: formData.email, 
        username: formData.username,
        password: formData.password
      });
      setShowVerificationMessage(true);
      resetForm();
    } catch (err) {
      // Mejorar el manejo de errores
      if (err.response && err.response.status === 409) {
        // Error de conflicto - usuario ya existe
        if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('El email o nombre de usuario ya está registrado.');
        }
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al registrar. Por favor intente nuevamente.');
      }
      console.error('Error al registrar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setError('Por favor ingrese un email válido.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(formData.email);
      toast.success('Se ha enviado un enlace a tu correo para restablecer tu contraseña. (Si no lo encuentras, revisa la carpeta de spam)');
      resetForm();
      onClose();
    } catch (err) {
      setError('Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginView = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="identifier">Email o Username</Label>
        <Input
          id="identifier"
          type="text"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
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
        <button
          type="button"
          className="text-sm text-primary hover:underline mb-5"
          onClick={() => {
            setView('forgotPassword');
            setError(null);
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </>
  );

  const renderRegisterView = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="completeName">Nombre Completo</Label>
        <Input
          id="completeName"
          type="text"
          value={formData.completeName}
          onChange={(e) => setFormData({ ...formData, completeName: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
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
        <div className="relative">
          <Input 
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
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
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword" 
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex="-1"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );

  const renderForgotPasswordView = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="ejemplo@correo.com"
        />
      </div>
    </div>
  );

  const getTitle = () => {
    switch (view) {
      case 'login':
        return 'Iniciar Sesión';
      case 'register':
        return 'Registrarse';
      case 'forgotPassword':
        return 'Recuperar Contraseña';
      default:
        return '';
    }
  };

  const handleSubmit = (e) => {
    switch (view) {
      case 'login':
        return handleLogin(e);
      case 'register':
        return handleRegister(e);
      case 'forgotPassword':
        return handleForgotPassword(e);
      default:
        return null;
    }
  };

  const handleClose = () => {
    resetForm();
    setView('login');
    setShowVerificationMessage(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {showVerificationMessage ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Por favor verifica tu correo electrónico para poder iniciar sesión. Revisa tu bandeja de entrada.
                  (Si no encuentras el correo, revisa la carpeta de spam)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{getTitle()}</DialogTitle>
            </DialogHeader>

            {error && <p className="text-destructive text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'login' && renderLoginView()}
              {view === 'register' && renderRegisterView()}
              {view === 'forgotPassword' && renderForgotPasswordView()}

              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    if (view === 'forgotPassword') {
                      setView('login');
                      setError(null);
                    } else {
                      handleClose();
                    }
                  }}
                >
                  {view === 'forgotPassword' ? 'Volver' : 'Cancelar'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Cargando...' : 
                    view === 'login' ? 'Iniciar Sesión' : 
                    view === 'register' ? 'Registrarse' : 
                    'Enviar Correo'}
                </Button>
              </DialogFooter>
            </form>

            {view !== 'forgotPassword' && (
              <div className="mt-4 text-center text-sm">
                {view === 'login' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setView(view === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                >
                  {view === 'login' ? "Regístrate" : "Inicia Sesión"}
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}