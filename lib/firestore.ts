import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface MenuItem {
  id?: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isAvailable: boolean
  preparationTime: number
  rating: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Category {
  id?: string
  name: string
  color: string
  createdAt?: Timestamp
}

// Check if Firebase is accessible
export const checkFirebaseAccess = async (): Promise<boolean> => {
  try {
    await getDocs(collection(db, "test"))
    return true
  } catch (error) {
    console.log("Firebase access check failed:", error)
    return false
  }
}

// Local storage helpers
const MENU_ITEMS_KEY = "restaurant_menu_items"
const CATEGORIES_KEY = "restaurant_categories"

const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

const getFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

// Default data
const DEFAULT_CATEGORIES: Category[] = [

]

const DEFAULT_MENU_ITEMS: MenuItem[] = [

]

// Menu Items Functions
export const addMenuItem = async (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    // Try Firebase first
    const docRef = await addDoc(collection(db, "menuItems"), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.log("Firebase add failed, using localStorage")

    // Fallback to localStorage
    const newItem: MenuItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    }

    const existingItems = getFromLocalStorage(MENU_ITEMS_KEY) || []
    const updatedItems = [...existingItems, newItem]
    saveToLocalStorage(MENU_ITEMS_KEY, updatedItems)

    return newItem.id!
  }
}

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, "menuItems"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const items: MenuItem[] = []

    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data(),
      } as MenuItem)
    })

    // Save to localStorage as backup
    saveToLocalStorage(MENU_ITEMS_KEY, items)
    return items
  } catch (error) {
    console.log("Firebase get failed, using localStorage")

    // Fallback to localStorage
    const localItems = getFromLocalStorage(MENU_ITEMS_KEY)
    if (localItems && localItems.length > 0) {
      return localItems
    }

    // Return default items if nothing in localStorage
    saveToLocalStorage(MENU_ITEMS_KEY, DEFAULT_MENU_ITEMS)
    return DEFAULT_MENU_ITEMS
  }
}

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
  try {
    const itemRef = doc(db, "menuItems", id)
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.log("Firebase update failed, using localStorage")

    // Fallback to localStorage
    const existingItems = getFromLocalStorage(MENU_ITEMS_KEY) || []
    const updatedItems = existingItems.map((item: MenuItem) =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item,
    )
    saveToLocalStorage(MENU_ITEMS_KEY, updatedItems)
  }
}

export const deleteMenuItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, "menuItems", id))
  } catch (error) {
    console.log("Firebase delete failed, using localStorage")

    // Fallback to localStorage
    const existingItems = getFromLocalStorage(MENU_ITEMS_KEY) || []
    const updatedItems = existingItems.filter((item: MenuItem) => item.id !== id)
    saveToLocalStorage(MENU_ITEMS_KEY, updatedItems)
  }
}

export const toggleMenuItemAvailability = async (id: string, isAvailable: boolean) => {
  await updateMenuItem(id, { isAvailable })
}

// Categories Functions
export const addCategory = async (category: Omit<Category, "id" | "createdAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...category,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.log("Firebase add category failed, using localStorage")

    // Fallback to localStorage
    const newCategory: Category = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, "-"),
      createdAt: new Date() as any,
    }

    const existingCategories = getFromLocalStorage(CATEGORIES_KEY) || []
    const updatedCategories = [...existingCategories, newCategory]
    saveToLocalStorage(CATEGORIES_KEY, updatedCategories)

    return newCategory.id!
  }
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, "categories"), orderBy("createdAt", "asc"))
    const querySnapshot = await getDocs(q)
    const categories: Category[] = []

    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      } as Category)
    })

    // Save to localStorage as backup
    saveToLocalStorage(CATEGORIES_KEY, categories)
    return categories
  } catch (error) {
    console.log("Firebase get categories failed, using localStorage")

    // Fallback to localStorage
    const localCategories = getFromLocalStorage(CATEGORIES_KEY)
    if (localCategories && localCategories.length > 0) {
      return localCategories
    }

    // Return default categories if nothing in localStorage
    saveToLocalStorage(CATEGORIES_KEY, DEFAULT_CATEGORIES)
    return DEFAULT_CATEGORIES
  }
}

export const deleteCategory = async (id: string) => {
  try {
    await deleteDoc(doc(db, "categories", id))
  } catch (error) {
    console.log("Firebase delete category failed, using localStorage")

    // Fallback to localStorage
    const existingCategories = getFromLocalStorage(CATEGORIES_KEY) || []
    const updatedCategories = existingCategories.filter((category: Category) => category.id !== id)
    saveToLocalStorage(CATEGORIES_KEY, updatedCategories)
  }
}

// Real-time listeners with fallback
export const subscribeToMenuItems = (callback: (items: MenuItem[]) => void) => {
  try {
    const q = query(collection(db, "menuItems"), orderBy("createdAt", "desc"))

    return onSnapshot(
      q,
      (querySnapshot) => {
        const items: MenuItem[] = []
        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          } as MenuItem)
        })
        saveToLocalStorage(MENU_ITEMS_KEY, items)
        callback(items)
      },
      (error) => {
        console.log("Firebase subscription failed, using localStorage")

        // Fallback to localStorage
        const localItems = getFromLocalStorage(MENU_ITEMS_KEY) || DEFAULT_MENU_ITEMS
        saveToLocalStorage(MENU_ITEMS_KEY, localItems)
        callback(localItems)

        // Return empty unsubscribe function
        return () => {}
      },
    )
  } catch (error) {
    console.log("Firebase subscription setup failed, using localStorage")

    // Immediate callback with localStorage data
    const localItems = getFromLocalStorage(MENU_ITEMS_KEY) || DEFAULT_MENU_ITEMS
    saveToLocalStorage(MENU_ITEMS_KEY, localItems)
    callback(localItems)

    // Return empty unsubscribe function
    return () => {}
  }
}

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  try {
    const q = query(collection(db, "categories"), orderBy("createdAt", "asc"))

    return onSnapshot(
      q,
      (querySnapshot) => {
        const categories: Category[] = []
        querySnapshot.forEach((doc) => {
          categories.push({
            id: doc.id,
            ...doc.data(),
          } as Category)
        })
        saveToLocalStorage(CATEGORIES_KEY, categories)
        callback(categories)
      },
      (error) => {
        console.log("Firebase categories subscription failed, using localStorage")

        // Fallback to localStorage
        const localCategories = getFromLocalStorage(CATEGORIES_KEY) || DEFAULT_CATEGORIES
        saveToLocalStorage(CATEGORIES_KEY, localCategories)
        callback(localCategories)

        // Return empty unsubscribe function
        return () => {}
      },
    )
  } catch (error) {
    console.log("Firebase categories subscription setup failed, using localStorage")

    // Immediate callback with localStorage data
    const localCategories = getFromLocalStorage(CATEGORIES_KEY) || DEFAULT_CATEGORIES
    saveToLocalStorage(CATEGORIES_KEY, localCategories)
    callback(localCategories)

    // Return empty unsubscribe function
    return () => {}
  }
}

// Initialize default categories if none exist
export const initializeDefaultCategories = async () => {
  try {
    const categories = await getCategories()

    if (categories.length === 0) {
      for (const category of DEFAULT_CATEGORIES) {
        await addCategory(category)
      }
    }
  } catch (error) {
    console.log("Error initializing default categories, using localStorage defaults")
    saveToLocalStorage(CATEGORIES_KEY, DEFAULT_CATEGORIES)
  }
}

// Sync localStorage data to Firebase when connection is restored
export const syncLocalDataToFirebase = async () => {
  try {
    const hasAccess = await checkFirebaseAccess()
    if (!hasAccess) return false

    // Sync categories
    const localCategories = getFromLocalStorage(CATEGORIES_KEY) || []
    const firebaseCategories = await getCategories()

    for (const localCat of localCategories) {
      const exists = firebaseCategories.find((cat) => cat.id === localCat.id)
      if (!exists) {
        await addCategory(localCat)
      }
    }

    // Sync menu items
    const localItems = getFromLocalStorage(MENU_ITEMS_KEY) || []
    const firebaseItems = await getMenuItems()

    for (const localItem of localItems) {
      const exists = firebaseItems.find((item) => item.id === localItem.id)
      if (!exists) {
        await addMenuItem(localItem)
      }
    }

    return true
  } catch (error) {
    console.error("Error syncing local data to Firebase:", error)
    return false
  }
}
