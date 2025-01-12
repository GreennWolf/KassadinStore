// components/RPInfoModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Wallet } from "lucide-react";

export const RPInfoModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Tipos de RP en Kassadin Store
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Introducción */}
          <DialogDescription className="text-base leading-relaxed">
            En Kassadin Store, llevamos más de 2 años utilizando un sistema confiable para regalar ítems. 
            Aunque tomamos todas las medidas necesarias para que las transacciones sean seguras, es importante 
            tener en cuenta que, como no somos una tienda oficial, siempre existe un riesgo mínimo inherente 
            en este tipo de servicios. Esto aplica no solo a nosotros, sino a cualquier tienda similar.
          </DialogDescription>

          {/* RP Seguro */}
          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Shield className="h-5 w-5" />
              <h3>RP Seguro</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Utiliza RP cargado en otras regiones, giftcards y giftcards en otras regiones, 
              lo que reduce significativamente los riesgos. Este método tiene una probabilidad 
              baja, cercana al 1%, de que ocurra un rollback (que eliminen los ítems regalados) 
              o un ban general.
            </p>
          </div>

          {/* RP Barato */}
          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Wallet className="h-5 w-5" />
              <h3>RP Barato</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Utiliza RP proveniente de cuentas con grandes cantidades adquiridas a través de terceros. 
              Esto permite un costo más bajo, pero conlleva un riesgo mayor, estimado en un 4%, de 
              rollback o baneo.
            </p>
          </div>

          {/* Nota final */}
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              Queremos ser completamente transparentes: aunque los riesgos son muy bajos, factores 
              externos, como cambios en las políticas, podrían generar problemas imprevistos en 
              raras ocasiones. A lo largo de nuestra trayectoria, estos casos han sido excepcionales, 
              pero queremos que nuestros clientes estén informados.
            </p>
            <p>
              Nuestro compromiso es ofrecerte una solución confiable, respaldada por años de 
              experiencia y un historial de clientes satisfechos. La decisión del método que 
              prefieras depende de tus necesidades y prioridades en términos de seguridad y costo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};