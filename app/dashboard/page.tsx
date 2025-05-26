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
  ImageIcon,
  Save,
} from "lucide-react"
import {
  type MenuItem,
  type Category,
  addMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  addCategory,
  deleteCategory,
  subscribeToMenuItems,
  subscribeToCategories,
  initializeDefaultCategories,
  checkFirebaseAccess,
  syncLocalDataToFirebase,
  updateMenuItem,
  type MenuItemVariant,
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
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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

  const [newItemVariants, setNewItemVariants] = useState<MenuItemVariant[]>([])
  const [currentVariant, setCurrentVariant] = useState({
    name: "",
    price: "",
    image: "",
  })

  const [imagePreviewStatus, setImagePreviewStatus] = useState<"loading" | "success" | "error" | "none">("none")

  const addVariant = () => {
    if (!currentVariant.name || !currentVariant.price) {
      toast({
        title: "Ma'lumot yetishmayapti",
        description: "Variant nomi va narxini kiriting",
        variant: "destructive",
      })
      return
    }

    const variant: MenuItemVariant = {
      id: Date.now().toString(),
      name: currentVariant.name,
      price: Number.parseFloat(currentVariant.price),
      image: currentVariant.image || undefined,
      isAvailable: true,
    }

    setNewItemVariants([...newItemVariants, variant])
    setCurrentVariant({ name: "", price: "", image: "" })

    toast({
      title: "Variant qo'shildi",
      description: `${variant.name} variant ro'yxatga qo'shildi`,
    })
  }

  const removeVariant = (id: string) => {
    setNewItemVariants(newItemVariants.filter((v) => v.id !== id))
    toast({
      title: "Variant o'chirildi",
      description: "Variant ro'yxatdan olib tashlandi",
    })
  }

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
            title: "🔥 Firebase ulanishi faol",
            description: "Real vaqt yangilanishlari ishlamoqda",
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
            title: "💾 Mahalliy rejim",
            description: "Ma'lumotlar brauzeringizda saqlanadi",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error initializing data:", error)
        setIsConnected(false)
        setConnectionMode("local")

        toast({
          title: "⚠️ Ulanish xatosi",
          description: "Mahalliy xotira rejimiga o'tildi",
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

  const clearFormData = () => {
    setNewItem({
      name: "",
      description: "",
      price: "",
      category: "",
      preparationTime: "",
      image: "",
    })
    setNewItemVariants([])
    setCurrentVariant({ name: "", price: "", image: "" })
    setImagePreviewStatus("none")
  }

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return true // Empty is allowed

    try {
      const urlObj = new URL(url.trim())
      // Check if it's a valid HTTP/HTTPS URL
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      // Check if it's a relative path
      return url.startsWith("/") || url.startsWith("./") || url.includes("placeholder.svg")
    }
  }

  const handleImageChange = (url: string) => {
    setNewItem({ ...newItem, image: url })

    if (!url.trim()) {
      setImagePreviewStatus("none")
      return
    }

    if (!validateImageUrl(url)) {
      setImagePreviewStatus("error")
      return
    }

    setImagePreviewStatus("loading")

    // Test image loading
    const img = new Image()
    img.onload = () => setImagePreviewStatus("success")
    img.onerror = () => setImagePreviewStatus("error")
    img.src = url.trim()
  }

  const validateForm = (): boolean => {
    console.log("🔍 Validating form...")

    if (!newItem.name.trim()) {
      console.log("❌ Name validation failed")
      toast({
        title: "❌ Nomi kiritilmagan",
        description: "Ovqat nomini kiriting",
        variant: "destructive",
      })
      return false
    }

    const price = Number.parseFloat(newItem.price)
    if (!newItem.price || isNaN(price) || price <= 0) {
      console.log("❌ Price validation failed:", newItem.price, price)
      toast({
        title: "❌ Narx noto'g'ri",
        description: "To'g'ri narx kiriting (0 dan katta son)",
        variant: "destructive",
      })
      return false
    }

    if (!newItem.category) {
      console.log("❌ Category validation failed")
      toast({
        title: "❌ Kategoriya tanlanmagan",
        description: "Ovqat kategoriyasini tanlang",
        variant: "destructive",
      })
      return false
    }

    if (newItem.image && !validateImageUrl(newItem.image)) {
      console.log("❌ Image URL validation failed")
      toast({
        title: "❌ Noto'g'ri rasm URL",
        description: "To'g'ri rasm URL manzilini kiriting",
        variant: "destructive",
      })
      return false
    }

    if (!newItem.description.trim()) {
      console.log("⚠️ Description is empty, will use default")
      // Don't fail validation, just use default
    }

    console.log("✅ Form validation passed")
    return true
  }

  const handleAddItem = async () => {
    console.log("🎯 handleAddItem called")

    if (!validateForm()) {
      console.log("❌ Form validation failed")
      return
    }

    setIsCreating(true)

    try {
      console.log("📋 Form data:", newItem)
      console.log("🔧 Variants:", newItemVariants)

      // Prepare clean data with explicit type conversion
      const cleanImageUrl = newItem.image?.trim() || "/placeholder.svg?height=200&width=300"

      // Prepare variants with proper structure
      const processedVariants =
        newItemVariants.length > 0
          ? newItemVariants.map((variant) => ({
              id: variant.id,
              name: variant.name,
              price: Number(variant.price),
              image: variant.image?.trim() || undefined,
              isAvailable: true,
            }))
          : []

      // Create menu item data with explicit structure
      const menuItemData = {
        name: newItem.name.trim(),
        description: newItem.description.trim() || "Tavsif kiritilmagan",
        price: Number.parseFloat(newItem.price),
        category: newItem.category,
        image: cleanImageUrl,
        preparationTime: Number.parseInt(newItem.preparationTime) || 10,
        variants: processedVariants.length > 0 ? processedVariants : undefined,
        isAvailable: true,
        rating: 0,
      }

      console.log("🚀 Sending to Firebase:", menuItemData)

      // Add to Firebase/localStorage
      const itemId = await addMenuItem(menuItemData)

      console.log("✅ Item created with ID:", itemId)

      // Clear form and close dialog
      clearFormData()
      setIsAddDialogOpen(false)

      // Show success message without refresh
      toast({
        title: "🎉 Muvaffaqiyat!",
        description: `${newItem.name} menyuga qo'shildi va real vaqtda yangilandi`,
      })
    } catch (error) {
      console.error("❌ Error in handleAddItem:", error)

      toast({
        title: "❌ Xatolik yuz berdi",
        description: `Ovqatni qo'shishda muammo: ${error.message || "Noma'lum xatolik"}`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "❌ Kategoriya nomi kiritilmagan",
        description: "Kategoriya nomini kiriting",
        variant: "destructive",
      })
      return
    }

    try {
      await addCategory({
        name: newCategory.name.trim(),
        color: newCategory.color,
      })

      setNewCategory({
        name: "",
        color: "bg-gray-100 text-gray-800",
      })
      setIsCategoryDialogOpen(false)

      toast({
        title: "✅ Kategoriya qo'shildi",
        description: `${newCategory.name} kategoriyasi real vaqtda yaratildi`,
      })
    } catch (error) {
      toast({
        title: "❌ Xatolik",
        description: "Kategoriyani qo'shishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteCategory(id)

      toast({
        title: "🗑️ Kategoriya o'chirildi",
        description: `${name} kategoriyasi real vaqtda o'chirildi`,
      })
    } catch (error) {
      toast({
        title: "❌ Xatolik",
        description: "Kategoriyani o'chirishda xatolik yuz berdi",
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
    setNewItemVariants(item.variants || [])
    setImagePreviewStatus(item.image ? "success" : "none")
    setIsEditDialogOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!validateForm() || !editingItem) return

    setIsUpdating(true)

    try {
      // Prepare clean data
      const cleanImageUrl = newItem.image?.trim() || "/placeholder.svg?height=200&width=300"

      // Prepare variants
      const processedVariants =
        newItemVariants.length > 0
          ? newItemVariants.map((variant) => ({
              ...variant,
              image: variant.image?.trim() || undefined,
            }))
          : undefined

      // Update data
      const updateData = {
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        price: Number.parseFloat(newItem.price),
        category: newItem.category,
        image: cleanImageUrl,
        preparationTime: Number.parseInt(newItem.preparationTime) || 10,
        variants: processedVariants,
      }

      console.log("🔄 Updating menu item:", updateData)

      await updateMenuItem(editingItem.id!, updateData)

      console.log("✅ Menu item updated successfully")

      // Clear form and close dialog
      clearFormData()
      setEditingItem(null)
      setIsEditDialogOpen(false)

      toast({
        title: "🎉 Ovqat muvaffaqiyatli yangilandi!",
        description: `${newItem.name} ma'lumotlari real vaqtda yangilandi`,
      })
    } catch (error) {
      console.error("❌ Error updating menu item:", error)

      toast({
        title: "❌ Xatolik yuz berdi",
        description: "Ovqatni yangilashda muammo bo'ldi. Qaytadan urinib ko'ring.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    try {
      await deleteMenuItem(id)

      toast({
        title: "🗑️ Ovqat o'chirildi",
        description: `${name} menyudan real vaqtda olib tashlandi`,
      })
    } catch (error) {
      toast({
        title: "❌ Xatolik",
        description: "Ovqatni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await toggleMenuItemAvailability(id, !currentStatus)

      toast({
        title: "🔄 Holat yangilandi",
        description: `${name} hozir ${!currentStatus ? "mavjud" : "mavjud emas"} - real vaqtda yangilandi`,
      })
    } catch (error) {
      toast({
        title: "❌ Xatolik",
        description: "Holatni yangilashda xatolik yuz berdi",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsSoldOut = async (id: string, name: string) => {
    try {
      await toggleMenuItemAvailability(id, false)

      toast({
        title: "❌ Tugatilgan deb belgilandi",
        description: `${name} hozir mavjud emas - real vaqtda yangilandi`,
      })
    } catch (error) {
      toast({
        title: "❌ Xatolik",
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
          title: "🔄 Sinxronlash muvaffaqiyatli",
          description: "Mahalliy ma'lumotlar Firebase bilan sinxronlashtirildi",
        })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast({
          title: "❌ Sinxronlashda xatolik",
          description: "Firebasega ulanib bo'lmadi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Sinxronlashda xatolik",
        description: "Ma'lumotlarni sinxronlashtirishda xatolik yuz berdi",
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
                      ? "text-green-600 border-green-300 bg-green-50"
                      : "text-yellow-600 border-yellow-300 bg-yellow-50"
                  }`}
                >
                  {connectionMode === "firebase" ? (
                    <Wifi className="w-3 h-3 mr-1" />
                  ) : (
                    <WifiOff className="w-3 h-3 mr-1" />
                  )}
                  {connectionMode === "firebase" ? "Firebase" : "Mahalliy"}
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
                <h3 className="text-sm font-medium text-green-800">🔥 Firebase ulanishi faol</h3>
                <p className="text-sm text-green-700 mt-1">
                  Real vaqt yangilanishlari ishlamoqda. Barcha o'zgarishlar avtomatik sinxronlanadi.
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
                  <h3 className="text-sm font-medium text-yellow-800">💾 Mahalliy rejim faol</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Firebase ulanmagan. Ma'lumotlar brauzeringizda saqlanadi.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSyncToFirebase} className="w-full sm:w-auto">
                <Database className="w-4 h-4 mr-2" />
                Firebase bilan ulanish
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

        {/* Filters and Actions */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (!open) clearFormData()
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 h-12" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isCreating ? "Qo'shilmoqda..." : "Ovqat qo'shish"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-orange-600" />
                    Yangi ovqat qo'shish
                  </DialogTitle>
                  <DialogDescription>Restoran menyusi uchun yangi ovqat yarating</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Ovqat nomi *
                    </Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Masalan: Osh, Manti, Lag'mon"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Tavsif
                    </Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Ovqat haqida qisqacha ma'lumot"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Rasm URL manzili
                    </Label>
                    <Input
                      id="image"
                      value={newItem.image}
                      onChange={(e) => handleImageChange(e.target.value)}
                      placeholder="https://example.com/rasm.jpg yoki https://unsplash.com/..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Faqat internetdagi rasm URL manzilini kiriting. Fayl yuklash imkoni yo'q.
                    </p>

                    {newItem.image && (
                      <div className="mt-3">
                        <div
                          className={`relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 ${
                            imagePreviewStatus === "success"
                              ? "border-green-200"
                              : imagePreviewStatus === "error"
                                ? "border-red-200"
                                : "border-gray-200"
                          }`}
                        >
                          {imagePreviewStatus === "loading" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            </div>
                          )}
                          <img
                            src={newItem.image || "/placeholder.svg"}
                            alt="Rasm oldindan ko'rish"
                            className="w-full h-full object-cover"
                            onLoad={() => setImagePreviewStatus("success")}
                            onError={() => setImagePreviewStatus("error")}
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                            {imagePreviewStatus === "success" && "✅ Yuklandi"}
                            {imagePreviewStatus === "error" && "❌ Xato"}
                            {imagePreviewStatus === "loading" && "⏳ Yuklanmoqda"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium">
                        Narxi (so'm) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        placeholder="25000"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium">
                        Tayyorlash vaqti (daq)
                      </Label>
                      <Input
                        id="time"
                        type="number"
                        value={newItem.preparationTime}
                        onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                        placeholder="15"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Kategoriya *
                    </Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger className="mt-1">
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

                  <div>
                    <Label className="text-sm font-medium">Variantlar (ixtiyoriy)</Label>
                    <div className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Variant nomi"
                          value={currentVariant.name}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, name: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Narxi"
                          value={currentVariant.price}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, price: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="Variant rasm URL (ixtiyoriy)"
                        value={currentVariant.image}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, image: e.target.value })}
                      />
                      <Button type="button" onClick={addVariant} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Variant qo'shish
                      </Button>

                      {newItemVariants.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {newItemVariants.map((variant) => (
                            <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">
                                {variant.name} - {variant.price.toLocaleString()} so'm
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddItem}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Qo'shilmoqda...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Ovqatni saqlash
                      </>
                    )}
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
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <Badge className={category.color}>{category.name}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id!, category.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Filter Buttons */}
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

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={
                    item.image && item.image !== "/placeholder.svg?height=200&width=300"
                      ? item.image
                      : "/placeholder.svg?height=200&width=300"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src !== "/placeholder.svg?height=200&width=300") {
                      target.src = "/placeholder.svg?height=200&width=300"
                    }
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
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) clearFormData()
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              Ovqatni tahrirlash
            </DialogTitle>
            <DialogDescription>Restoran menyusi elementini tahrirlang</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Ovqat nomi *
              </Label>
              <Input
                id="edit-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ovqat nomi"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Tavsif
              </Label>
              <Textarea
                id="edit-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Ovqat tavsifi"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-image" className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Rasm URL
              </Label>
              <Input
                id="edit-image"
                value={newItem.image}
                onChange={(e) => handleImageChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />

              {newItem.image && (
                <div className="mt-3">
                  <div
                    className={`relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 ${
                      imagePreviewStatus === "success"
                        ? "border-green-200"
                        : imagePreviewStatus === "error"
                          ? "border-red-200"
                          : "border-gray-200"
                    }`}
                  >
                    {imagePreviewStatus === "loading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      </div>
                    )}
                    <img
                      src={newItem.image || "/placeholder.svg"}
                      alt="Rasm oldindan ko'rish"
                      className="w-full h-full object-cover"
                      onLoad={() => setImagePreviewStatus("success")}
                      onError={() => setImagePreviewStatus("error")}
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                      {imagePreviewStatus === "success" && "✅ Yuklandi"}
                      {imagePreviewStatus === "error" && "❌ Xato"}
                      {imagePreviewStatus === "loading" && "⏳ Yuklanmoqda"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-sm font-medium">
                  Narxi (so'm) *
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="25000"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-time" className="text-sm font-medium">
                  Tayyorlash vaqti (daq)
                </Label>
                <Input
                  id="edit-time"
                  type="number"
                  value={newItem.preparationTime}
                  onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                  placeholder="15"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category" className="text-sm font-medium">
                Kategoriya *
              </Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger className="mt-1">
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

            <div>
              <Label className="text-sm font-medium">Variantlar (ixtiyoriy)</Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Variant nomi"
                    value={currentVariant.name}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Narxi"
                    value={currentVariant.price}
                    onChange={(e) => setCurrentVariant({ ...currentVariant, price: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Variant rasm URL (ixtiyoriy)"
                  value={currentVariant.image}
                  onChange={(e) => setCurrentVariant({ ...currentVariant, image: e.target.value })}
                />
                <Button type="button" onClick={addVariant} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Variant qo'shish
                </Button>

                {newItemVariants.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {newItemVariants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {variant.name} - {variant.price.toLocaleString()} so'm
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUpdateItem}
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yangilanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  O'zgarishlarni saqlash
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
