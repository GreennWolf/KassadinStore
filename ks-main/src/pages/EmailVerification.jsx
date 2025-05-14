// pages/EmailVerification.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/userService';

export function EmailVerification() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verificando');

    useEffect(() => {
        const verify = async () => {
            try {
                await verifyEmail(token);
                setStatus('success');
                setTimeout(() => {
                    navigate('/'); // O donde quieras redirigir después de verificar
                }, 3000);
            } catch (error) {
                setStatus('error');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                {status === 'verificando' && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Verificando tu correo electrónico...</h2>
                        {/* Puedes agregar un spinner aquí */}
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="text-center text-green-600">
                        <h2 className="text-2xl font-bold mb-4">¡Email verificado exitosamente!</h2>
                        <p>Serás redirigido en unos segundos...</p>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="text-center text-red-600">
                        <h2 className="text-2xl font-bold mb-4">Error al verificar el email</h2>
                        <p>El enlace puede haber expirado o ser inválido. hemos enviado otro</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Volver al inicio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}