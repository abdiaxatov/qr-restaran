"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  ChefHat,
  Search,
  Clock,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
  CreditCard,
  Phone,
} from "lucide-react"
import {
  type MenuItem,
  type Category,
  subscribeToMenuItems,
  subscribeToCategories,
  checkFirebaseAccess,
} from "@/lib/firestore"

interface CartItem extends MenuItem {
  quantity: number
}

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionMode, setConnectionMode] = useState<"firebase" | "local">("local")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    let unsubscribeItems: (() => void) | undefined
    let unsubscribeCategories: (() => void) | undefined

    const initializeData = async () => {
      try {
        setIsLoading(true)

        // Check Firebase access
        const hasFirebaseAccess = await checkFirebaseAccess()

        if (hasFirebaseAccess) {
          setConnectionMode("firebase")
        } else {
          setConnectionMode("local")
        }

        // Set up listeners (they handle fallback internally)
        unsubscribeItems = subscribeToMenuItems((items) => {
          setMenuItems(items)
        })

        unsubscribeCategories = subscribeToCategories((cats) => {
          setCategories(cats)
        })
      } catch (error) {
        console.error("Error initializing data:", error)
        setConnectionMode("local")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()

    // Load cart from localStorage
    const savedCart = localStorage.getItem("restaurant_cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    // Cleanup subscriptions
    return () => {
      if (unsubscribeItems) unsubscribeItems()
      if (unsubscribeCategories) unsubscribeCategories()
    }
  }, [])

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem("restaurant_cart", JSON.stringify(cart))
  }, [cart])

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory && item.isAvailable
  })

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      setCart(
        cart.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)),
      )
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const removeFromCart = (id: string) => {
    const existingItem = cart.find((cartItem) => cartItem.id === id)
    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map((cartItem) => (cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem)),
      )
    } else {
      setCart(cart.filter((cartItem) => cartItem.id !== id))
    }
  }

  const removeItemCompletely = (id: string) => {
    setCart(cart.filter((cartItem) => cartItem.id !== id))
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getDeliveryFee = () => {
    return getTotalPrice() >= 50000 ? 0 : 5000
  }

  const getServiceFee = () => {
    return Math.round(getTotalPrice() * 0) // 2% service fee
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getServiceFee()
  }

  const handleImageClick = (item: MenuItem) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Mazali taomlar yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ipak Yoli</h1>
                
              </div>
            </div>
            <div className="flex items-center space-x-4">
<Badge
                  variant="outline"
                  className={`text-xs ${
                    connectionMode === "firebase"
                      ? "text-green-600 border-green-300"
                      : "text-yellow-600 border-yellow-300"
                  }`}
                >
                  {connectionMode === "firebase" ? (
                    <Wifi className="w-3 h-3 mr-1" />
                  ) : (
                    <WifiOff className="w-3 h-3 mr-1" />
                  )}
                  {connectionMode === "firebase" ? "Jonli" : "Demo"}
                </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Menu Items */}
        <div className="mb-4">
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Hali menyu elementlari yo'q</h3>
              <div className="text-gray-600 mb-4">
                Restoran o'zining mazali menyusini tayyorlamoqda. Iltimos, tez orada qaytib tekshiring!
              </div>
              <a href="/login" className="text-orange-600 hover:text-orange-700 underline">
                Admin Panelga o'ting
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="aspect-square bg-gray-200 relative cursor-pointer"
                    onClick={() => handleImageClick(item)}
                  >
                    <img
                      src={item.image || "/placeholder.svg?height=200&width=200"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=200&width=200"
                      }}
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-lg font-bold text-orange-600">{item.price.toLocaleString()} </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.preparationTime}m
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {cart.find((cartItem) => cartItem.id === item.id) ? (
                        <div className="flex items-center space-x-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id!)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-medium text-sm flex-1 text-center">
                            {cart.find((cartItem) => cartItem.id === item.id)?.quantity}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => addToCart(item)} className="h-8 w-8 p-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(item)}
                          className="w-full bg-orange-600 hover:bg-orange-700 h-8 text-xs"
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Savatga qo'shish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && menuItems.length > 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Hech narsa topilmadi</h3>
              <div className="text-gray-600">Qidiruv yoki kategoriya filtrini sozlashga harakat qiling</div>
            </div>
          )}
        </div>

        {/* Floating Cart Button - Above Categories */}
        {cart.length > 0 && (
          <div className="fixed bottom-24 right-4 z-50">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className=" bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-sm font-semibold shadow-xl  ">
                  <div className="flex items-center justify-between gap-4">
                    <ShoppingCart className="w-4 h-4 " />
                    <span className="font-bold text-sm">{getTotalPrice().toLocaleString()}</span>
                  </div>
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="pb-6">
                  <SheetTitle className="text-2xl font-bold text-center">Savat</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full ">
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.image || "/placeholder.svg?height=80&width=80"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=80&width=80"
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemCompletely(item.id!)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(item.id!)}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-bold text-lg min-w-[30px] text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-8 w-8 p-0 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                {(item.price * item.quantity).toLocaleString()} 
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className=" pt-6 mt-6 space-y-4 pb-14">

                    <Separator />
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Jami to'lov</span>
                      <span className="text-orange-600">{getFinalTotal().toLocaleString()} </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}  

        {/* Category Tabs - Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap ${selectedCategory === "all" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
              >
                Barchasi
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name.toLowerCase() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name.toLowerCase())}
                  className={`whitespace-nowrap ${selectedCategory === category.name.toLowerCase() ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <img
                  src={selectedItem.image || "/placeholder.svg?height=300&width=400"}
                  alt={selectedItem.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=300&width=400"
                  }}
                />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {selectedItem.price.toLocaleString()} 
                    </span>
                    
                  </div>

                  <div className="text-gray-600">{selectedItem.description}</div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Tayyorlash: {selectedItem.preparationTime} daqiqa
                    </div>
                    <Badge
                      className={
                        categories.find((c) => c.name.toLowerCase() === selectedItem.category)?.color ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {categories.find((c) => c.name.toLowerCase() === selectedItem.category)?.name ||
                        selectedItem.category}
                    </Badge>
                  </div>

                  <div className="pt-4">
                    {cart.find((cartItem) => cartItem.id === selectedItem.id) ? (
                      <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => removeFromCart(selectedItem.id!)} className="flex-1">
                          <Minus className="w-4 h-4 mr-2" />
                          Kamaytirish
                        </Button>
                        <span className="font-bold text-lg">
                          {cart.find((cartItem) => cartItem.id === selectedItem.id)?.quantity}
                        </span>
                        <Button variant="outline" onClick={() => addToCart(selectedItem)} className="flex-1">
                          <Plus className="w-4 h-4 mr-2" />
                          Ko'paytirish
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(selectedItem)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Savatga qo'shish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  )
}
