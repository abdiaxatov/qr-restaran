"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Upload, Loader2, X } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onUploadStart?: () => void
  onUploadEnd?: () => void
  className?: string
}

export function ImageUpload({ value, onChange, onUploadStart, onUploadEnd, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [urlInput, setUrlInput] = useState(value)
  const [previewStatus, setPreviewStatus] = useState<"loading" | "success" | "error" | "none">("none")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadImage(file, "menu-items")

      clearInterval(progressInterval)
      setUploadProgress(100)

      onChange(result.url)
      setUrlInput(result.url)
      setPreviewStatus("success")

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert(error.message || "Rasm yuklashda xatolik yuz berdi")
      setPreviewStatus("error")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      onUploadEnd?.()
    }
  }

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    onChange(url)

    if (!url.trim()) {
      setPreviewStatus("none")
      return
    }

    setPreviewStatus("loading")

    // Test image loading
    const img = new Image()
    img.onload = () => setPreviewStatus("success")
    img.onerror = () => setPreviewStatus("error")
    img.src = url.trim()
  }

  const clearImage = () => {
    onChange("")
    setUrlInput("")
    setPreviewStatus("none")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Rasm
      </Label>

      <Tabs defaultValue="upload" className="mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">📤 Yuklash</TabsTrigger>
          <TabsTrigger value="url">🔗 URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 text-orange-600 mx-auto animate-spin" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Rasm yuklanmoqda...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2"
                  >
                    Rasm tanlash
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG, WebP yoki GIF (max 5MB)</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-3">
          <Input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500">Internetdagi rasm URL manzilini kiriting</p>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {value && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Oldindan ko'rish</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearImage}
              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div
            className={`relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 ${
              previewStatus === "success"
                ? "border-green-200"
                : previewStatus === "error"
                  ? "border-red-200"
                  : "border-gray-200"
            }`}
          >
            {previewStatus === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}

            <img
              src={value || "/placeholder.svg"}
              alt="Rasm oldindan ko'rish"
              className="w-full h-full object-cover"
              onLoad={() => setPreviewStatus("success")}
              onError={() => setPreviewStatus("error")}
            />

            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
              {previewStatus === "success" && "✅ Yuklandi"}
              {previewStatus === "error" && "❌ Xato"}
              {previewStatus === "loading" && "⏳ Yuklanmoqda"}
            </div>

            {value.includes("firebase") && (
              <div className="absolute bottom-2 left-2 bg-orange-600 text-white rounded px-2 py-1 text-xs font-medium">
                🔥 Firebase Storage
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
