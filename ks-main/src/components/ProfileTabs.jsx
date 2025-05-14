import { useState, useEffect } from "react";
import { TransactionsTable } from "./TransactionsTable";
import { RedeemTransactionsTable } from "./RedeemTransactionsTable";
import { InventoryDisplay } from "./InventoryDisplay";
import { cn } from "@/lib/utils";



export const ProfileTabs = ({ purchases, redeems,redeemLoading,loading, onPurchaseUpdate , onRedeemUpdate }) => {
  const [activeTab, setActiveTab] = useState("transactions");
  
  

  const tabs = [
    { id: "transactions", label: "Pedidos" },
    { id: "rewards", label: "Recompensas Reclamadas" },
    { id: "inventory", label: "Inventario" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "transactions":
        return (
          <TransactionsTable 
            purchases={purchases} 
            loading={loading}
            onPurchaseUpdate={onPurchaseUpdate}
          />
        );
      case "rewards":
        return (
          <RedeemTransactionsTable 
            redeems={redeems} 
            loading={redeemLoading}
            onRedeemUpdate={onRedeemUpdate}
          />
        );
      case "inventory":
        return <InventoryDisplay onRedeemUpdate={onRedeemUpdate}/>;
      default:
        return null;
    }
  };

  return (
    <div className="col-span-12">
      <div className="flex flex-col space-y-4">
        {/* Tabs Navigation */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 text-sm font-medium transition-colors hover:text-primary relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;