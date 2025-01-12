import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, ChevronDown, User, Gift } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useAuthModal } from "../context/authModalContext";
import logo from "../assets/logo.png";	
import { toast , ToastContainer } from 'react-toastify';

export const TopNav = () => {
  const { cart, removeFromCart, getTotalItems } = useStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { openAuthModal } = useAuthModal();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate('/');
  };

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    }
  }, [openAuthModal]);

  const handleCheckout = () => {
    if(user) {
      navigate('/checkout');
    } else {
      toast('Debes iniciar sesión para comprar', {
        icon: '⚠️',
        duration: 3000
      });
      openAuthModal();
    }
  }

  const totalCartItems = getTotalItems();

  return (
    <nav className="border-b border-white/10 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <ToastContainer/>
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/tienda/presale" className="text-muted-foreground hover:text-foreground">
              Evento
            </Link>
            <Link to="/tienda/skins" className="text-muted-foreground hover:text-foreground">
              Skins
            </Link>
            <Link to="/tienda/loot" className="text-muted-foreground hover:text-foreground">
              Loot
            </Link>
            <Link to="/tienda/tft" className="text-muted-foreground hover:text-foreground">
              TFT
            </Link>
            <Link to="/unrankeds" className="text-muted-foreground hover:text-foreground">
              Unrankeds
            </Link>
          </div>

          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
            <img src={logo} alt="Logo" className="h-24 w-auto" />
          </Link>
          <Link to="/" className="lg:hidden">
            <img src={logo} alt="Logo" className="h-24 w-auto" />
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {totalCartItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-[540px] flex flex-col">
                <SheetHeader>
                  <SheetTitle>Carrito de Compras</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 my-4">
                  {cart.map((item) => {
                    return (
                      <div key={item._id + '' + item.isSeguroRP} className="flex items-center space-x-4 p-4 transition-all duration-200">
                        <img 
                          src={item.srcLocal || item.src} 
                          alt={item.isUnranked ? `Cuenta ${item.region}` : (item.NombreSkin || item.name)} 
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          {item.isUnranked ? (
                            <>
                              <h3 className="font-medium">Cuenta {item.region}</h3>
                              <div className="text-sm text-muted-foreground flex gap-2">
                                <p className="text-xs font-medium ">
                                  {item.handUpgrade ? (
                                    <span className="text-emerald-500">Cuenta Safe</span>
                                  ) : (
                                    <span className="text-red-500">Cuenta Unsafe</span>
                                  )}
                                </p>
                                <p className="font-medium ">
                                  Precio: ${item.priceConverted} x {item.quantity}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="font-medium">{item.NombreSkin || item.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                ${item.priceConverted} x {item.quantity}
                              </p>
                              {item.isSkin && (
                                <p className="text-xs text-muted-foreground">
                                  Skin
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item._id)}
                          className="transition-colors duration-200 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          {item.quantity > 1 ? '-1' : 'Eliminar'}
                        </Button>
                      </div>
                    );
                  })}
                  {cart.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      Tu carrito está vacío
                    </div>
                  )}
                </ScrollArea>
                <SheetFooter className="sm:block">
                  <div className="space-y-4 w-full">
                    <Separator />
                    <Button 
                      className="w-full"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                    >
                      Ir al Checkout
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Rewards button - responsive */}
            <Link to="/recompensas">
              <Button variant="outline" size="icon" className="lg:hidden">
                <Gift className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="hidden lg:flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Recompensas
              </Button>
            </Link>

            {user ? (
              <>
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <img 
                          src={user.src || "/default-avatar.png"} 
                          alt="Profile" 
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{user.username}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-black text-white">
                      {user.role === "admin" && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/perfil")}>
                        Mi Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="lg:hidden">
                  <Link to="/perfil">
                    <Button variant="outline" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="hidden lg:block">
                  <Button variant="outline" onClick={openAuthModal}>
                    Ingresar
                  </Button>
                </div>
                <div className="lg:hidden">
                  <Button variant="outline" size="icon" onClick={openAuthModal}>
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-4 bg-black rounded-lg p-4">
            <Link to="/tienda/presale" className="block text-muted-foreground hover:text-foreground py-2">
              Evento
            </Link>
            <Link to="/tienda/skins" className="block text-muted-foreground hover:text-foreground py-2">
              Skins
            </Link>
            <Link to="/tienda/loot" className="block text-muted-foreground hover:text-foreground py-2">
              Loot
            </Link>
            <Link to="/tienda/tft" className="block text-muted-foreground hover:text-foreground py-2">
              TFT
            </Link>
            <Link to="/unrankeds" className="block text-muted-foreground hover:text-foreground py-2">
              Unrankeds
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};