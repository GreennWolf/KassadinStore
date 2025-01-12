import { TopNav } from "@/components/TopNav";
import { CardDisplay } from "@/components/CardDisplay";
import { ProfileTabs } from "@/components/ProfileTabs";
import { QuickTransfer } from "@/components/QuickTransfer";
import { useEffect, useState } from "react";
import { useAuthModal } from "../context/authModalContext";
import { getAllPurchases } from "../services/purcharseService";

const Perfil = () => {
  const [user, setUser] = useState(null);
  const { openAuthModal } = useAuthModal();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
      fetchPurchases();
    }
  }, [openAuthModal]);

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
              loading={loading} 
              onPurchaseUpdate={handlePurchaseUpdate}
            />
          </div>

          {/* Tabs Section */}
          <ProfileTabs 
            purchases={purchases} 
            loading={loading}
            onPurchaseUpdate={handlePurchaseUpdate}
          />
        </div>
      </main>
    </div>
  );
};

export default Perfil;