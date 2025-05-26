"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChefHat,
  Plus,
  Search,
  Edit,
  Trash2,
  LogOut,
  Settings,
  Clock,
  XCircle,
  CheckCircle,
  Loader2,
  Database,
  AlertTriangle,
  Wifi,
  WifiOff,
  MoreVertical,
} from "lucide-react"
import {
  type MenuItem,
  type Category,
  addMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  addCategory,
  subscribeToMenuItems,
  subscribeToCategories,
  initializeDefaultCategories,
  checkFirebaseAccess,
  syncLocalDataToFirebase,
  updateMenuItem,
} from "@/lib/firestore"

export default function Dashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionMode, setConnectionMode] = useState<"firebase" | "local">("local")
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    preparationTime: "",
    image: "",
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "bg-gray-100 text-gray-800",
  })

  useEffect(() => {
    let unsubscribeItems: (() => void) | undefined
    let unsubscribeCategories: (() => void) | undefined

    const initializeData = async () => {
      try {
        setIsLoading(true)

        // Check Firebase access
        const hasFirebaseAccess = await checkFirebaseAccess()

        if (hasFirebaseAccess) {
          setIsConnected(true)
          setConnectionMode("firebase")

          // Initialize default categories
          await initializeDefaultCategories()

          // Set up real-time listeners
          unsubscribeItems = subscribeToMenuItems((items) => {
            setMenuItems(items)
          })

          unsubscribeCategories = subscribeToCategories((cats) => {
            setCategories(cats)
          })

          toast({
            title: "Firebasega ulanish muvaffaqiyatli",
            description: "Real vaqt yangilanishlari faol",
          })
        } else {
          setIsConnected(false)
          setConnectionMode("local")

          // Use localStorage fallback
          unsubscribeItems = subscribeToMenuItems((items) => {
            setMenuItems(items)
          })

          unsubscribeCategories = subscribeToCategories((cats) => {
            setCategories(cats)
          })

          toast({
            title: "Mahalliy rejimda ishlash",
            description: "Ma'lumotlar brauzeringizda mahalliy ravishda saqlanadi",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error initializing data:", error)
        setIsConnected(false)
        setConnectionMode("local")

        toast({
          title: "Ulanishda xatolik",
          description: "Mahalliy xotira rejimini ishlatish",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()

    // Cleanup subscriptions
    return () => {
      if (unsubscribeItems) unsubscribeItems()
      if (unsubscribeCategories) unsubscribeCategories()
    }
  }, [toast])

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && item.isAvailable) ||
      (availabilityFilter === "unavailable" && !item.isAvailable)

    return matchesSearch && matchesCategory && matchesAvailability
  })

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({
        title: "Ma'lumot yetishmayapti",
        description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      })
      return
    }

    try {
      await addMenuItem({
        name: newItem.name,
        description: newItem.description,
        price: Number.parseFloat(newItem.price),
        category: newItem.category,
        image: newItem.image || "/placeholder.svg?height=200&width=300",
        isAvailable: true,
        preparationTime: Number.parseInt(newItem.preparationTime) || 10,
        rating: 0,
      })

      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "",
        preparationTime: "",
        image: "",
      })
      setIsAddDialogOpen(false)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Ovqat qo'shildi",
        description: `${newItem.name} menyuga qo'shildi`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Menyu elementini qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Ma'lumot yetishmayapti",
        description: "Iltimos, kategoriya nomini kiriting",
        variant: "destructive",
      })
      return
    }

    try {
      await addCategory({
        name: newCategory.name,
        color: newCategory.color,
      })

      setNewCategory({
        name: "",
        color: "bg-gray-100 text-gray-800",
      })
      setIsCategoryDialogOpen(false)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Kategoriya qo'shildi",
        description: `${newCategory.name} kategoriyasi yaratildi`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Kategoriyani qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparationTime: item.preparationTime.toString(),
      image: item.image,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.name || !newItem.price || !newItem.category) {
      toast({
        title: "Ma'lumot yetishmayapti",
        description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      })
      return
    }

    try {
      await updateMenuItem(editingItem.id!, {
        name: newItem.name,
        description: newItem.description,
        price: Number.parseFloat(newItem.price),
        category: newItem.category,
        image: newItem.image || "/placeholder.svg?height=200&width=300",
        preparationTime: Number.parseInt(newItem.preparationTime) || 10,
      })

      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "",
        preparationTime: "",
        image: "",
      })
      setEditingItem(null)
      setIsEditDialogOpen(false)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Ovqat yangilandi",
        description: `${newItem.name} muvaffaqiyatli yangilandi`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ovqatni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    try {
      await deleteMenuItem(id)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Ovqat o'chirildi",
        description: `${name} menyudan olib tashlandi`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Menyu elementini o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await toggleMenuItemAvailability(id, !currentStatus)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Holat yangilandi",
        description: `${name} hozir ${!currentStatus ? "mavjud" : "mavjud emas"}`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Element holatini yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsSoldOut = async (id: string, name: string) => {
    try {
      await toggleMenuItemAvailability(id, false)

      // Refresh data
      if (connectionMode === "local") {
        window.location.reload()
      }

      toast({
        title: "Tugatilgan deb belgilandi",
        description: `${name} hozir mavjud emas`,
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Elementni tugatilgan deb belgilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleSyncToFirebase = async () => {
    try {
      const success = await syncLocalDataToFirebase()
      if (success) {
        toast({
          title: "Sinxronlash muvaffaqiyatli",
          description: "Mahalliy ma'lumotlar Firebase bilan sinxronlashtirildi",
        })
        window.location.reload()
      } else {
        toast({
          title: "Sinxronlashda xatolik",
          description: "Firebasega ulanib bo'lmadi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Sinxronlashda xatolik",
        description: "Ma'lumotlarni Firebasega sinxronlashtirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    window.location.href = "/login"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Restoran ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Restoran Admin</h1>
                <Badge
                  variant="outline"
                  className={`mt-1 sm:mt-0 sm:ml-3 ${
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
                  {connectionMode === "firebase" ? "Firebase" : "Mahalliy rejim"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {connectionMode === "local" && (
                <Button variant="outline" size="sm" onClick={handleSyncToFirebase} className="w-full sm:w-auto">
                  <Database className="w-4 h-4 mr-2" />
                  Firebase bilan sinxronlash
                </Button>
              )}
              <a href="/" className="text-sm text-orange-600 hover:text-orange-700 underline">
                Menyuni ko'rish
              </a>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Connection Status */}
        {connectionMode === "firebase" ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Firebasega ulanish muvaffaqiyatli</h3>
                <p className="text-sm text-green-700 mt-1">
                  Real vaqt yangilanishlari faol. O'zgarishlar barcha qurilmalarda avtomatik ravishda sinxronlanadi.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Mahalliy rejim faol</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Firebasega kirish imkoni yo'q. Ma'lumotlar brauzeringizda mahalliy ravishda saqlanadi.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSyncToFirebase} className="w-full sm:w-auto">
                <Database className="w-4 h-4 mr-2" />
                Sinxronlashga urinib ko'ring
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Jami ovqatlar</p>
                  <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mavjud</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {menuItems.filter((item) => item.isAvailable).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tugagan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {menuItems.filter((item) => !item.isAvailable).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Menyu elementlarini qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Mavjudlik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha elementlar</SelectItem>
                <SelectItem value="available">Mavjud</SelectItem>
                <SelectItem value="unavailable">Tugatilgan</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 h-12">
                  <Plus className="w-4 h-4 mr-2" />
                  Ovqat qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yangi menyu elementini qo'shish</DialogTitle>
                  <DialogDescription>Restoran menyusi uchun yangi element yarating</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nomi *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Element nomi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Tavsif</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Element tavsifi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Rasm URL</Label>
                    <Input
                      id="image"
                      value={newItem.image}
                      onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {newItem.image && (
                      <img
                        src={newItem.image || "/placeholder.svg"}
                        alt="Preview"
                        className="mt-2 w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Narxi (so'm) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Tayyorlash vaqti (daq)</Label>
                      <Input
                        id="time"
                        type="number"
                        value={newItem.preparationTime}
                        onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Kategoriya *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriyani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddItem} className="w-full bg-orange-600 hover:bg-orange-700">
                    Menyuga element qo'shish
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <Settings className="w-4 h-4 mr-2" />
                  Kategoriyalar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Kategoriyalarni boshqarish</DialogTitle>
                  <DialogDescription>Menyu elementlari uchun yangi kategoriyalar qo'shing</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Kategoriya nomi</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Kategoriya nomi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryColor">Rang</Label>
                    <Select
                      value={newCategory.color}
                      onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rangni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bg-red-100 text-red-800">Qizil</SelectItem>
                        <SelectItem value="bg-green-100 text-green-800">Yashil</SelectItem>
                        <SelectItem value="bg-blue-100 text-blue-800">Ko'k</SelectItem>
                        <SelectItem value="bg-purple-100 text-purple-800">Binafsha</SelectItem>
                        <SelectItem value="bg-yellow-100 text-yellow-800">Sariq</SelectItem>
                        <SelectItem value="bg-gray-100 text-gray-800">Kulrang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddCategory} className="w-full">
                    Kategoriya qo'shish
                  </Button>

                  <div className="space-y-2">
                    <Label>Joriy kategoriyalar</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge key={category.id} className={category.color}>
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={item.image || "/placeholder.svg?height=200&width=300"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className={item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {item.isAvailable ? "Mavjud" : "Tugatilgan"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                  <span className="text-lg font-bold text-orange-600">{item.price.toLocaleString()} so'm</span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <Badge
                    className={
                      categories.find((c) => c.name.toLowerCase() === item.category)?.color ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {categories.find((c) => c.name.toLowerCase() === item.category)?.name || item.category}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.preparationTime}m
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAvailability(item.id!, item.isAvailable, item.name)}
                      className={`flex-1 mr-2 ${
                        item.isAvailable ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                      }`}
                    >
                      {item.isAvailable ? "Mavjud emas" : "Mavjud"}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item.id!, item.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          O'chirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {item.isAvailable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsSoldOut(item.id!, item.name)}
                      className="w-full text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tugatilgan deb belgilang
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hech qanday element topilmadi</h3>
            <p className="text-gray-600">
              Qidiruv yoki filtrlarni sozlashga urinib ko'ring yoki birinchi menyu elementini qo'shing!
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Menyu elementini tahrirlash</DialogTitle>
            <DialogDescription>Restoran menyusi elementini tahrirlang</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nomi *</Label>
              <Input
                id="edit-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Element nomi"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Tavsif</Label>
              <Textarea
                id="edit-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Element tavsifi"
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Rasm URL</Label>
              <Input
                id="edit-image"
                value={newItem.image}
                onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {newItem.image && (
                <img
                  src={newItem.image || "/placeholder.svg"}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Narxi (so'm) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Tayyorlash vaqti (daq)</Label>
                <Input
                  id="edit-time"
                  type="number"
                  value={newItem.preparationTime}
                  onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category">Kategoriya *</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateItem} className="w-full bg-orange-600 hover:bg-orange-700">
              Menyu elementini yangilash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
