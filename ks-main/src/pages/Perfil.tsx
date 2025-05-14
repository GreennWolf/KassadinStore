import { TopNav } from "@/components/TopNav";
import { CardDisplay } from "@/components/CardDisplay";
import { ProfileTabs } from "@/components/ProfileTabs";
import { QuickTransfer } from "@/components/QuickTransfer";
import { useEffect, useState } from "react";
import { useAuthModal } from "../context/authModalContext";
import { getAllPurchases } from "../services/purcharseService";
import { getUserRedeems } from "@/services/rewardRedeemService";
import { getUpdatedUser } from "@/services/userService";
import { toast } from 'sonner';

const Perfil = () => {
  const [user, setUser] = useState(null);
  const { openAuthModal } = useAuthModal();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeems, setRedeems] = useState([]);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [userDataFetched, setUserDataFetched] = useState(false);

  // Primer useEffect para cargar el usuario y sus datos básicos
  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
      fetchPurchases();
      fetchRedeems();
      
      // Marcar que necesitamos actualizar los datos del usuario
      setUserDataFetched(false);
    }
  }, [openAuthModal]);

  // Segundo useEffect para actualizar los datos del usuario solo una vez después de cargarlo inicialmente
  useEffect(() => {
    const updateUserData = async () => {
      // Solo actualizar si tenemos un usuario y aún no hemos actualizado los datos
      if (user && user._id && !userDataFetched) {
        try {
          // Marcar que hemos actualizado los datos para evitar bucles
          setUserDataFetched(true);
          
          // Actualizar datos del usuario
          await getUpdatedUser(user._id , true);
          
          // Actualizar el estado con los datos más recientes
          const updatedUser = localStorage.getItem("user");
          if (updatedUser) {
            setUser(JSON.parse(updatedUser));
          }
        } catch (error) {
          console.error("Error al actualizar datos del usuario:", error);
        }
      }
    };

    updateUserData();
  }, [user, userDataFetched]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await getAllPurchases();
      const user = JSON.parse(localStorage.getItem("user"));
      const userPurchases = data.filter(purchase => purchase.userId._id === user._id);
      setPurchases(userPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedeems = async () => {
    try {
      setRedeemLoading(true);
      const userId = JSON.parse(localStorage.getItem('user'))?._id;
      if (!userId) {
        toast.error("No se encontró el usuario");
        return;
      }
      const response = await getUserRedeems(userId);
      setRedeems(response);
    } catch (error) {
      console.error('Error fetching redeems:', error);
      toast.error("Error al cargar las recompensas reclamadas");
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleRedeemUpdate = async () => {
    await fetchRedeems();
  };

  const handlePurchaseUpdate = async () => {
    await fetchPurchases();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="p-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column - Card Display */}
          <div className="col-span-12 lg:col-span-6">
            <CardDisplay user={user} />
          </div>

          {/* Right column - Quick Transfer (Timer) */}
          <div className="col-span-12 lg:col-span-6">
            <QuickTransfer 
              purchases={purchases} 
              redeems={redeems}
              loading={loading} 
              onRedeemUpdate={handleRedeemUpdate}
              onPurchaseUpdate={handlePurchaseUpdate}
            />
          </div>

          {/* Tabs Section */}
          <ProfileTabs 
            purchases={purchases} 
            redeems={redeems}
            redeemLoading={redeemLoading}
            loading={loading}
            onRedeemUpdate={handleRedeemUpdate}
            onPurchaseUpdate={handlePurchaseUpdate}
          />
        </div>
      </main>
    </div>
  );
};

export default Perfil;