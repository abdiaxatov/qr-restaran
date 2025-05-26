import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBNVVvNkAJNyeheRuwmWCW35qLVihfUias",
  authDomain: "ipak-yoli-c36e1.firebaseapp.com",
  databaseURL: "https://ipak-yoli-c36e1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ipak-yoli-c36e1",
  storageBucket: "ipak-yoli-c36e1.firebasestorage.app",
  messagingSenderId: "902332463786",
  appId: "1:902332463786:web:8bd199c7bf0f051e0feed3",
  measurementId: "G-ZNF08060W3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export default app
