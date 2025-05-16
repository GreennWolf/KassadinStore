import React, { useEffect } from 'react';

export default function DumpUser() {
  useEffect(() => {
    // Obtener el usuario almacenado
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      // console.log('User in localStorage:', user);
    } else {
      // console.log('No user found in localStorage');
    }
  }, []);

  return <div>Check console for user data</div>;
}