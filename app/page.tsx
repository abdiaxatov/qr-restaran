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
  Wifi,
  WifiOff,
  Trash2,
  CreditCard,
  Phone,
  MapPin,
  User,
  RotateCcw,
} from "lucide-react"
import {
  type MenuItem,
  type Category,
  type MenuItemVariant,
  subscribeToMenuItems,
  subscribeToCategories,
  checkFirebaseAccess,
} from "@/lib/firestore"

interface CartItem extends MenuItem {
  quantity: number
  selectedVariant?: MenuItemVariant
  isOriginal?: boolean
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
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: MenuItemVariant | null }>({})

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

  const getItemPrice = (item: MenuItem) => {
    const selectedVariant = selectedVariants[item.id!]
    return selectedVariant ? selectedVariant.price : item.price
  }

  const getItemImage = (item: MenuItem) => {
    const selectedVariant = selectedVariants[item.id!]
    return selectedVariant?.image || item.image
  }

  const addToCart = (item: MenuItem) => {
    const selectedVariant = selectedVariants[item.id!]
    const isOriginal = !selectedVariant

    const existingItem = cart.find((cartItem) => {
      if (selectedVariant) {
        return cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id
      }
      return cartItem.id === item.id && cartItem.isOriginal
    })

    if (existingItem) {
      setCart(
        cart.map((cartItem) => {
          if (selectedVariant) {
            return cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          }
          return cartItem.id === item.id && cartItem.isOriginal
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        }),
      )
    } else {
      const newCartItem: CartItem = {
        ...item,
        quantity: 1,
        price: getItemPrice(item),
        image: getItemImage(item),
        selectedVariant,
        isOriginal,
      }
      setCart([...cart, newCartItem])
    }
  }

  const removeFromCart = (item: MenuItem) => {
    const selectedVariant = selectedVariants[item.id!]

    const existingItem = cart.find((cartItem) => {
      if (selectedVariant) {
        return cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id
      }
      return cartItem.id === item.id && cartItem.isOriginal
    })

    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map((cartItem) => {
          if (selectedVariant) {
            return cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          }
          return cartItem.id === item.id && cartItem.isOriginal
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        }),
      )
    } else {
      setCart(
        cart.filter((cartItem) => {
          if (selectedVariant) {
            return !(cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id)
          }
          return !(cartItem.id === item.id && cartItem.isOriginal)
        }),
      )
    }
  }

  const removeItemCompletely = (cartItem: CartItem) => {
    setCart(
      cart.filter((item) => {
        if (cartItem.selectedVariant) {
          return !(item.id === cartItem.id && item.selectedVariant?.id === cartItem.selectedVariant.id)
        }
        return !(item.id === cartItem.id && item.isOriginal)
      }),
    )
  }

  const getCartItemQuantity = (item: MenuItem) => {
    const selectedVariant = selectedVariants[item.id!]
    const cartItem = cart.find((cartItem) => {
      if (selectedVariant) {
        return cartItem.id === item.id && cartItem.selectedVariant?.id === selectedVariant.id
      }
      return cartItem.id === item.id && cartItem.isOriginal
    })
    return cartItem?.quantity || 0
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getServiceFee = () => {
    return Math.round(getTotalPrice() * 0.02) // 2% service fee
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getServiceFee()
  }

  const handleImageClick = (item: MenuItem) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleVariantSelect = (itemId: string, variant: MenuItemVariant | null) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [itemId]: variant,
    }))
  }

  const resetToOriginal = (itemId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [itemId]: null,
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-orange-600 animate-pulse" />
          </div>
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <p className="text-gray-600 font-medium">Mazali taomlar yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Ipak Yoli
                </h1>
                <p className="text-xs text-gray-500">Restoran</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className={`text-xs border-2 ${
                  connectionMode === "firebase"
                    ? "text-green-600 border-green-300 bg-green-50"
                    : "text-amber-600 border-amber-300 bg-amber-50"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Menu Items */}
        <div className="mb-4">
          {menuItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hali menyu elementlari yo'q</h3>
              <div className="text-gray-600 mb-6 max-w-md mx-auto">
                Restoran o'zining mazali menyusini tayyorlamoqda. Iltimos, tez orada qaytib tekshiring!
              </div>
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg"
              >
                <User className="w-4 h-4 mr-2" />
                Admin Panelga o'ting
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group"
                >
                  <div
                    className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative cursor-pointer overflow-hidden"
                    onClick={() => handleImageClick(item)}
                  >
                    <img
                      src={getItemImage(item) || "/placeholder.svg?height=300&width=300"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=300&width=300"
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs font-bold">{item.rating || 4.5}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg line-clamp-1 text-gray-900">{item.name}</h3>
                    </div>

                    {/* Original Price Display */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span
                            className={`text-xl font-bold ${
                              selectedVariants[item.id!]
                                ? "text-gray-400 line-through text-base"
                                : "bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                            }`}
                          >
                            {item.price.toLocaleString()} so'm
                          </span>
                          {selectedVariants[item.id!] && (
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                              {selectedVariants[item.id!].price.toLocaleString()} so'm
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.preparationTime}m
                        </div>
                      </div>
                    </div>

                    {/* Variants */}
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700">Variantlar ({item.variants.length})</h4>
                          {selectedVariants[item.id!] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetToOriginal(item.id!)}
                              className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Asl
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {item.variants.map((variant) => (
                            <Button
                              key={variant.id}
                              variant={selectedVariants[item.id!]?.id === variant.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleVariantSelect(item.id!, variant)}
                              className={`text-xs h-8 px-2 ${
                                selectedVariants[item.id!]?.id === variant.id
                                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-0"
                                  : "border-orange-200 text-orange-700 hover:bg-orange-50"
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium">{variant.name}</span>
                                <span className="text-xs opacity-80">{variant.price.toLocaleString()}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {getCartItemQuantity(item) > 0 ? (
                        <div className="flex items-center space-x-3 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item)}
                            className="h-10 w-10 p-0 rounded-full border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                          >
                            <Minus className="w-4 h-4 text-orange-600" />
                          </Button>
                          <span className="font-bold text-lg flex-1 text-center bg-orange-50 rounded-lg py-2">
                            {getCartItemQuantity(item)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="h-10 w-10 p-0 rounded-full border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                          >
                            <Plus className="w-4 h-4 text-orange-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(item)}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-10 text-sm font-semibold rounded-xl shadow-lg"
                        >
                          <Plus className="w-4 h-4 mr-2" />
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
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hech narsa topilmadi</h3>
              <div className="text-gray-600">Qidiruv yoki kategoriya filtrini sozlashga harakat qiling</div>
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-28 right-4 z-50">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-2xl rounded-2xl h-14 px-6 relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <ShoppingCart className="w-5 h-5" />
                      <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {getTotalItems()}
                      </span>
                    </div>
                    <span className="text-lg">{getTotalPrice().toLocaleString()}</span>
                  </div>
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-0 bg-white/95 backdrop-blur-md">
                <SheetHeader className="pb-6 border-b border-gray-200">
                  <SheetTitle className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Savat
                  </SheetTitle>
                  <p className="text-center text-gray-600">{getTotalItems()} ta mahsulot</p>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-4">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.id}-${item.selectedVariant?.id || "original"}-${index}`}
                        className="flex gap-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
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
                            <div>
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              {item.isOriginal ? (
                                <p className="text-sm text-gray-600">Asl porsiya</p>
                              ) : (
                                <p className="text-sm text-orange-600 font-medium">
                                  Variant: {item.selectedVariant?.name}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemCompletely(item)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (item.selectedVariant) {
                                    setSelectedVariants((prev) => ({ ...prev, [item.id!]: item.selectedVariant! }))
                                  } else {
                                    setSelectedVariants((prev) => ({ ...prev, [item.id!]: null }))
                                  }
                                  removeFromCart(item)
                                }}
                                className="h-8 w-8 p-0 rounded-full border-2 border-orange-200"
                              >
                                <Minus className="w-4 h-4 text-orange-600" />
                              </Button>
                              <span className="font-bold text-lg min-w-[40px] text-center bg-orange-50 rounded-lg px-3 py-1">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (item.selectedVariant) {
                                    setSelectedVariants((prev) => ({ ...prev, [item.id!]: item.selectedVariant! }))
                                  } else {
                                    setSelectedVariants((prev) => ({ ...prev, [item.id!]: null }))
                                  }
                                  addToCart(item)
                                }}
                                className="h-8 w-8 p-0 rounded-full border-2 border-orange-200"
                              >
                                <Plus className="w-4 h-4 text-orange-600" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                {(item.price * item.quantity).toLocaleString()} so'm
                              </div>
                              <div className="text-sm text-gray-500">{item.price.toLocaleString()} so'm/dona</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-gray-200 pt-6 space-y-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-3xl p-6 -mx-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Mahsulotlar ({getTotalItems()} ta)</span>
                        <span className="font-bold text-lg">{getTotalPrice().toLocaleString()} so'm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Xizmat haqi (2%)</span>
                        <span className="font-bold text-lg">{getServiceFee().toLocaleString()} so'm</span>
                      </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-orange-200 to-red-200" />

                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span className="text-gray-900">Jami to'lov</span>
                      <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {getFinalTotal().toLocaleString()} so'm
                      </span>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-16 text-lg font-bold rounded-2xl shadow-xl">
                      <CreditCard className="w-6 h-6 mr-3" />
                      Buyurtma berish
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-bold text-green-900">Yetkazib berish</div>
                            <div className="text-sm text-green-700">25-35 daqiqa</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-bold text-blue-900">Aloqa</div>
                            <div className="text-sm text-blue-700">+998 90 123 45 67</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Category Tabs - Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-orange-100 shadow-2xl p-4 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap rounded-xl font-medium text-xs sm:text-sm ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-lg"
                    : "border-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                }`}
              >
                Barchasi
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name.toLowerCase() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name.toLowerCase())}
                  className={`whitespace-nowrap rounded-xl font-medium text-xs sm:text-sm ${
                    selectedCategory === category.name.toLowerCase()
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-lg"
                      : "border-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-center mt-3 pt-2 border-t border-orange-100">
              <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2">
                <MapPin className="w-3 h-3" />© 2025
                <a
                  href="https://abdiaxatov.uz"
                  className="text-orange-600 font-medium hover:text-orange-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abdiaxatov.uz
                </a>
                tomonidan ishlab chiqilgan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-md border-0 bg-white/95 backdrop-blur-md rounded-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <div className="relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src={getItemImage(selectedItem) || "/placeholder.svg?height=300&width=400"}
                    alt={selectedItem.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=400"
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-bold">{selectedItem.rating || 4.5}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Original Price */}
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-900">Asl porsiya</h4>
                        <span
                          className={`text-2xl font-bold ${
                            selectedVariants[selectedItem.id!]
                              ? "text-gray-400 line-through text-lg"
                              : "bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                          }`}
                        >
                          {selectedItem.price.toLocaleString()} so'm
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 bg-white rounded-full px-3 py-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-medium">{selectedItem.preparationTime} daq</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  {selectedItem.variants && selectedItem.variants.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">Variantlar ({selectedItem.variants.length})</h4>
                        {selectedVariants[selectedItem.id!] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetToOriginal(selectedItem.id!)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Asl porsiyaga qaytish
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedItem.variants.map((variant) => (
                          <Button
                            key={variant.id}
                            variant={selectedVariants[selectedItem.id!]?.id === variant.id ? "default" : "outline"}
                            onClick={() => handleVariantSelect(selectedItem.id!, variant)}
                            className={`p-4 h-auto flex flex-col rounded-xl ${
                              selectedVariants[selectedItem.id!]?.id === variant.id
                                ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-0"
                                : "border-2 border-orange-200 hover:bg-orange-50"
                            }`}
                          >
                            <span className="font-bold text-lg">{variant.name}</span>
                            <span className="text-sm opacity-90">{variant.price.toLocaleString()} so'm</span>
                          </Button>
                        ))}
                      </div>

                      {selectedVariants[selectedItem.id!] && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border-2 border-green-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-green-900">Tanlangan variant</h4>
                              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                {selectedVariants[selectedItem.id!].price.toLocaleString()} so'm
                              </span>
                            </div>
                            <span className="font-bold text-green-700">{selectedVariants[selectedItem.id!].name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-gray-600 bg-gray-50 p-4 rounded-2xl">{selectedItem.description}</div>

                  <div className="pt-4">
                    {getCartItemQuantity(selectedItem) > 0 ? (
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => removeFromCart(selectedItem)}
                          className="flex-1 h-12 rounded-xl border-2 border-orange-200 hover:bg-orange-50"
                        >
                          <Minus className="w-5 h-5 mr-2" />
                          Kamaytirish
                        </Button>
                        <span className="font-bold text-2xl bg-orange-50 rounded-xl px-4 py-2">
                          {getCartItemQuantity(selectedItem)}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => addToCart(selectedItem)}
                          className="flex-1 h-12 rounded-xl border-2 border-orange-200 hover:bg-orange-50"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Ko'paytirish
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(selectedItem)}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-14 text-lg font-bold rounded-2xl shadow-xl"
                      >
                        <Plus className="w-5 h-5 mr-3" />
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
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  )
}
