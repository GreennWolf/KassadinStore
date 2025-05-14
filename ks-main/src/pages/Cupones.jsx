import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Percent, Calendar, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/context/StoreContext";
import { getRewardCouponPresetByType } from "@/services/rewardCouponPresetService";
import { purchaseItem } from "@/services/inventoryService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PurchaseConfirmModal = ({ isOpen, onClose, onConfirm, couponData }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-white">
            Confirmar Compra
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-gray-300">
              ¿Estás seguro de que quieres realizar esta compra?
            </p>
            <div className="bg-black/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cupón:</span>
                <span className="text-white font-medium">{couponData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Descuento:</span>
                <span className="text-white font-medium">{couponData.percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Costo:</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">{couponData.cost}</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700 border-none">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-400"
          >
            Confirmar Compra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const CouponCard = ({ id, name, percentage, cost, validDays, maxUses, onPurchaseSuccess }) => {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      const u = JSON.parse(loggedUser);
      setUser(u);
    }
  }, []);

  const handleExchange = () => {
    if (!user || !user.gold) {
      toast.error("Debes iniciar sesión para canjear un cupón.");
      return;
    }

    if (user.gold < cost) {
      toast.error(`No tienes suficiente oro. Necesitas ${cost} oro.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);

      const purchaseData = {
        itemType: "RewardCouponPreset",
        itemId: id,
        quantity: 1,
      };

      await purchaseItem(purchaseData);
      toast.success(`Cupón "${name}" canjeado con éxito.`);
      onPurchaseSuccess();
    } catch (error) {
      console.error("Error al comprar el cupón:", error);
      toast.error("Hubo un problema al canjear el cupón.");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="w-full"
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-black to-zinc-900 border-zinc-800">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-100 via-white to-gray-100 animate-pulse" />
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">{percentage}%</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">{name}</h3>

              <div className="flex items-center gap-2 text-yellow-500">
                <Coins className="w-4 h-4" />
                <span>{cost || 0} oro</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{validDays} días de validez</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <RefreshCcw className="w-4 h-4" />
                <span>Usos: {maxUses === 0 ? "Ilimitados" : maxUses}</span>
              </div>
            </div>

            <Button
              onClick={handleExchange}
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white"
            >
              {loading ? "Canjeando..." : "Canjear"}
            </Button>
          </div>
        </Card>
      </motion.div>

      <PurchaseConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPurchase}
        couponData={{
          name,
          percentage,
          cost,
        }}
      />
    </>
  );
};

const Cupones = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getRewardCouponPresetByType("store");
      const activeCoupons = response.filter(coupon => coupon.isActive);
      setCoupons(activeCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("No se pudieron cargar los cupones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">Sistema de Cupones</h1>
            <p className="text-lg text-gray-400">
              Intercambia tu oro por cupones de descuento para tus próximas compras
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-400">Cargando cupones...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    id={coupon._id}
                    name={coupon.name}
                    percentage={coupon.percent}
                    cost={coupon.gold || 0}
                    validDays={coupon.validDays}
                    maxUses={coupon.maxUses}
                    onPurchaseSuccess={fetchCoupons}
                  />
                ))
              ) : (
                <p className="text-center text-gray-400 col-span-3">
                  No hay cupones disponibles en este momento.
                </p>
              )}
            </div>
          )}
          
          <Card className="p-6 bg-card/50 backdrop-blur border-zinc-800">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">¿Cómo funcionan los cupones?</h2>
              <div className="space-y-2 text-gray-300">
                <p>• Los cupones son descuentos que puedes aplicar en tus próximas compras.</p>
                <p>• Puedes obtener cupones intercambiando el oro que has ganado.</p>
                <p>• Cuanto mayor sea el descuento, más oro necesitarás para obtenerlo.</p>
                <p>• Los cupones tienen una validez de varios días según su configuración.</p>
                <p>• Algunos cupones tienen usos limitados, ¡úsalos sabiamente!</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Cupones;