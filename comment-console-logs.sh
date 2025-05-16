#!/bin/bash

# Lista de archivos con console.log
files=(
  "./ks-main/src/components/admin/adminEloBoost/EloBoostRanksManager.jsx"
  "./ks-main/src/components/admin/adminPrecios/RpConversionsManager.jsx"
  "./ks-main/src/components/admin/adminProductos/ProductModal.jsx"
  "./ks-main/src/components/admin/adminProductos/UnrankedSkinSelector.jsx"
  "./ks-main/src/components/admin/AdminProducts.jsx"
  "./ks-main/src/components/admin/adminRecompensas/LootboxModal.jsx"
  "./ks-main/src/components/admin/adminRecompensas/RewardCouponManager.jsx"
  "./ks-main/src/components/admin/adminUsuarios/PerfilImageManager.jsx"
  "./ks-main/src/components/admin/adminUsuarios/PerfilImageModal.jsx"
  "./ks-main/src/components/admin/adminUsuarios/UserDetailsModal.jsx"
  "./ks-main/src/components/admin/adminUsuarios/UserModal.jsx"
  "./ks-main/src/components/admin/dashboard/OrdersChart.jsx"
  "./ks-main/src/components/admin/dashboard/OrderStatusChart.jsx"
  "./ks-main/src/components/InventoryDisplay.jsx"
  "./ks-main/src/components/Login/AuthModal.jsx"
  "./ks-main/src/components/OrderDetailsModal.jsx"
  "./ks-main/src/components/ProductCard.jsx"
  "./ks-main/src/components/ProductGrid.jsx"
  "./ks-main/src/components/RankBoostPanel.tsx"
  "./ks-main/src/components/RewardRevealModal.jsx"
  "./ks-main/src/components/rewards/RewardsCatalog.tsx"
  "./ks-main/src/components/rewards/RewardsNewCatalog.tsx"
  "./ks-main/src/components/StatusToolTip.jsx"
  "./ks-main/src/context/currencyContext.jsx"
  "./ks-main/src/pages/CasePage.jsx"
  "./ks-main/src/pages/Checkout.jsx"
  "./ks-main/src/pages/EloboostCheckout.jsx"
  "./ks-main/src/pages/LootboxRoulette.jsx"
  "./ks-main/src/pages/Unrankeds.jsx"
  "./ks-main/src/services/champsService.js"
  "./ks-main/src/services/dashboardService.js"
  "./ks-main/src/services/eloBoostService.js"
  "./ks-main/src/services/inventoryService.js"
  "./ks-main/src/services/lootBoxService.js"
  "./ks-main/src/services/perfilImagesService.js"
  "./ks-main/src/services/purcharseService.js"
  "./ks-main/src/services/rankService.js"
  "./ks-main/src/services/rpService.js"
  "./ks-main/src/services/unrankedService.js"
  "./ks-main/src/services/userService.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Reemplazar console.log con // console.log
    sed -i 's/console\.log/\/\/ console.log/g' "$file"
  fi
done

echo "Done commenting console.logs"