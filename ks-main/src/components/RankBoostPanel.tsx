import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function RankBoostPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="col-span-2 p-6 bg-card border-border">
        <div className="space-y-8">
          {/* Current Rank Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/placeholder.svg" alt="rank" className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Current Rank</h3>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-0.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="aspect-square p-0 border-muted h-20"
                  >
                    <img
                      src="/placeholder.svg"
                      alt={`rank ${i + 1}`}
                      className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                    />
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['IV', 'III', 'II', 'I'].map((division) => (
                  <Button
                    key={division}
                    variant="outline"
                    className="border-muted"
                  >
                    {division}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="0-20 LP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-20">0-20 LP</SelectItem>
                    <SelectItem value="21-40">21-40 LP</SelectItem>
                    <SelectItem value="41-60">41-60 LP</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Queue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo/Duo</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="euw">EUW</SelectItem>
                    <SelectItem value="na">NA</SelectItem>
                    <SelectItem value="eune">EUNE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desired Rank Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/placeholder.svg" alt="rank" className="w-8 h-8" />
              <h3 className="text-lg font-semibold">Desired Rank</h3>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-0.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="aspect-square p-0 border-muted h-20"
                  >
                    <img
                      src="/placeholder.svg"
                      alt={`rank ${i + 1}`}
                      className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity"
                    />
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['IV', 'III', 'II', 'I'].map((division) => (
                  <Button
                    key={division}
                    variant="outline"
                    className="border-muted"
                  >
                    {division}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Checkout Section */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Checkout</h3>
            <p className="text-sm text-muted-foreground mb-4">Add extra options to your boost</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Gold IV → Gold III</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="flex" />
                    <label htmlFor="flex" className="text-sm">Realizarlo en cola Flexible</label>
                  </div>
                  <span className="text-sm text-muted-foreground">Gratis</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="champion" />
                    <label htmlFor="champion" className="text-sm">Campeon</label>
                  </div>
                  <span className="text-sm text-muted-foreground">+10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="role" />
                    <label htmlFor="role" className="text-sm">Rol</label>
                  </div>
                  <span className="text-sm text-muted-foreground">+10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="duo" />
                    <label htmlFor="duo" className="text-sm">Jugar duo con el booster</label>
                  </div>
                  <span className="text-sm text-muted-foreground">+35%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-semibold">€11.78</span>
            </div>
            <Button className="w-full">Reservar Ahora</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}