"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, IndianRupee, Loader2, ArrowLeft, X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "../../../../../../context/AuthContext"
import Categories from "../../_components/Categories"
import AdditionalSettings from "../../_components/AdditionalSettings"

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})

const FALLBACK_IMAGE = 'https://placehold.co/600x400?text=No+Image';

const getImageUrl = (filename) => {
  if (!filename) return FALLBACK_IMAGE;
  if (filename.startsWith('http')) return filename;
  if (filename.startsWith('blob:')) return filename;
  // If URL starts with 'uploads/', prepend the S3 domain
  if (filename.startsWith(`${process.env.NEXT_PUBLIC_UPLOAD_FOLDER}/`)) {
    return `https://${process.env.NEXT_PUBLIC_SPACES_BUCKET}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${filename}`;
  }
  return filename;
};

export default function EditProductPage({ params }) {
  // State variables
  const [originalData, setOriginalData] = useState(null)
  const [productName, setProductName] = useState("")
  const [shortDesc, setShortDesc] = useState("")
  const [regularPrice, setRegularPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDesc, setSeoDesc] = useState("")
  const [selectedSubCategories, setSelectedSubCategories] = useState([])

  // Hooks
  const { toast } = useToast()
  const { checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadJoditCSS = async () => {
      try {
        await import('jodit/build/jodit.min.css');
      } catch (error) {
        console.error('Failed to load Jodit CSS:', error);
      }
    };

    loadJoditCSS();
    checkAuth();
  }, [checkAuth]);

  // Memoized editor configuration
  const editorConfig = useMemo(() => ({
    readonly: false,
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'superscript', 'subscript', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print'
    ],
    buttonsXS: [
      'bold', 'image', '|', 'brush', 'paragraph', '|', 'align', '|', 'undo', 'redo', '|',
      'source', 'fullsize'
    ],
    extraButtons: ['strikethrough', 'hr', 'symbol', 'fontsize'],
    colorPickerDefaultTab: 'background',
    toolbarAdaptive: true,
    toolbarSticky: true,
    toolbarStickyOffset: 100,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    uploader: {
      insertImageAsBase64URI: true
    },
    controls: {
      fontsize: {
        list: [
          '8', '9', '10', '11', '12', '14', '16', '18', '20', '22',
          '24', '26', '28', '36', '48', '72'
        ]
      }
    },
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    enter: 'P',
    tableAllowCellSelection: true,
    tableDefaultWidth: '100%',
    tableCellsControllers: ['left', 'top', 'right', 'bottom', 'delete'],
    allowResizeY: true,
    minHeight: 300
  }), [])

  // Editor-specific configurations
  const shortDescConfig = useMemo(() => ({
    ...editorConfig,
    height: 350,
    minHeight: 200,
    maxHeight: 800
  }), [editorConfig])

  const descriptionConfig = useMemo(() => ({
    ...editorConfig,
    height: 450,
    minHeight: 300,
    maxHeight: 800
  }), [editorConfig])
  // Stable event handlers
  const handleShortDescChange = useCallback((newContent) => {
    setShortDesc(newContent)
  }, [])

  const handleDescriptionChange = useCallback((newContent) => {
    setDescription(newContent)
  }, [])

  // Data loading
  const loadProductData = useCallback(async () => {
    setLoading(true)
    try {
      if (!await checkAuth()) {
        router.push("/")
        return
      }

      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/${params.slug}`)
      const product = data.data

      setOriginalData(product)
      setProductName(product.title)
      setShortDesc(product.shortDesc || "")
      setRegularPrice(product.price?.toString() || "")
      setSalePrice(product.salePrice?.toString() || "")
      setDescription(product.description)
      setSeoTitle(product.seoTitle || "")
      setSeoDesc(product.seoDesc || "")
      setThumbnailPreview(product.image)
      setAdditionalImages(
        product.images?.map(img => ({
          id: img.id,
          url: img.url,
          isExisting: true,
        })) || []
      )
      setSelectedCategories(product.categories.map(c => c.categoryId))
      setSelectedSubCategories(product.subCategories.map(sc => sc.subCategoryId))
    } catch (error) {
      console.error("Failed to load product:", error)
      setError(error.response?.data?.message || "Failed to load product data")
    } finally {
      setLoading(false)
    }
  }, [params.slug, checkAuth, router])

  useEffect(() => {
    loadProductData()
  }, [loadProductData])

  // Image handling
  const onDropThumbnail = useCallback(([file]) => {
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }, [])

  const onDropAdditionalImages = useCallback(acceptedFiles => {
    setAdditionalImages(prev => [
      ...prev,
      ...acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        isExisting: false,
      }))
    ])
  }, [])

  const thumbnailDropzone = useDropzone({
    onDrop: onDropThumbnail,
    accept: { "image/*": [] },
    multiple: false,
  })

  const additionalImagesDropzone = useDropzone({
    onDrop: onDropAdditionalImages,
    accept: { "image/*": [] },
    multiple: true,
  })

  // Category handlers
  const handleCategoryChange = useCallback(selectedIds => {
    const newCategoryIds = selectedIds.map(c => c.id || c)
    setSelectedCategories(newCategoryIds)
  }, [])

  const handleSubCategoryChange = useCallback(selectedIds => {
    const newSubCategoryIds = selectedIds.map(sc => sc.id || sc)
    setSelectedSubCategories(newSubCategoryIds)
  }, [])


  // Image removal
  const removeAdditionalImage = useCallback(async index => {
    const image = additionalImages[index]
    if (!image) return

    if (image.isExisting) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/product/delete-image`, {
          imageId: image.id
        })
        toast({ title: "Success", description: "Image deleted successfully" })
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete image",
          variant: "destructive"
        })
        return
      }
    }

    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
  }, [additionalImages, toast])

  // Change detection
  const hasChanges = useCallback(() => {
    if (!originalData) return false
    return (
      productName !== originalData.title ||
      shortDesc !== originalData.shortDesc ||
      regularPrice !== originalData.price?.toString() ||
      salePrice !== originalData.salePrice?.toString() ||
      description !== originalData.description ||
      !!thumbnail ||
      additionalImages.some(img => !img.isExisting) ||
      additionalImages.length !== originalData.images?.length ||
      JSON.stringify(selectedCategories) !== JSON.stringify(originalData.categories.map(c => c.categoryId)) ||
      JSON.stringify(selectedSubCategories) !== JSON.stringify(originalData.subCategories.map(sc => sc.subCategoryId))
    )
  }, [originalData, productName, shortDesc, regularPrice, salePrice, description, thumbnail, additionalImages, selectedCategories, selectedSubCategories])


  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (!hasChanges()) return

    setUpdating(true)
    try {
      const formData = new FormData()

      // Basic fields
      formData.append("title", productName)
      formData.append("shortDesc", shortDesc)
      formData.append("price", regularPrice)
      formData.append("salePrice", salePrice)
      formData.append("description", description)
      formData.append("seoTitle", seoTitle)
      formData.append("seoDesc", seoDesc)

      // Handle images
      if (thumbnail) {
        formData.append("image", thumbnail)
      }

      additionalImages.forEach(img => {
        if (!img.isExisting) {
          formData.append("images", img.file)
        }
      })

      // Always send categories array
      selectedCategories.forEach(categoryId => {
        formData.append('categoryIds[]', categoryId)
      })

      // Always send subcategories array
      selectedSubCategories.forEach(subCategoryId => {
        formData.append('subCategoryIds[]', subCategoryId)
      })

      console.log('Debug - FormData:', {
        categories: selectedCategories,
        subCategories: selectedSubCategories,
        formDataEntries: Array.from(formData.entries())
      })

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${params.slug}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Product updated successfully"
        })
        router.push("/dashboard/products")
      } else {
        throw new Error(response.data.message || "Update failed")
      }

    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Update failed",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }, [
    hasChanges,
    productName,
    shortDesc,
    regularPrice,
    salePrice,
    description,
    seoTitle,
    seoDesc,
    thumbnail,
    additionalImages,
    selectedCategories,
    selectedSubCategories,
    params.slug,
    router,
    toast
  ])


  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p>{error}</p>
            <Button onClick={() => router.push("/dashboard/products")}>
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main render
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-6">
          <CardTitle className="text-2xl font-bold">Edit Product</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              type="submit"
              form="edit-form"
              disabled={updating || !hasChanges()}
              className="w-full sm:w-auto"
            >
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {updating ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form id="edit-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    required
                    placeholder="Product Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <JoditEditor
                    value={shortDesc}
                    config={shortDescConfig}
                    onChange={handleShortDescChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Regular Price</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        value={regularPrice}
                        onChange={e => setRegularPrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sale Price</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        value={salePrice}
                        onChange={e => setSalePrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <JoditEditor
                    value={description}
                    config={descriptionConfig}
                    onChange={handleDescriptionChange}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label>Thumbnail</Label>
                  <div
                    {...thumbnailDropzone.getRootProps()}
                    className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                  >
                    <input {...thumbnailDropzone.getInputProps()} />
                    {thumbnailPreview ? (
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        width={200}
                        height={200}
                        className="mx-auto object-cover rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm">Drag or click to upload</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Additional Images ({additionalImages.length}/8)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {additionalImages.map((img, index) => (
                      <div key={index} className="relative aspect-square group">
                        <Image
                          src={img.preview || getImageUrl(img.url)}
                          alt={`Image ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {additionalImages.length < 8 && (
                      <div
                        {...additionalImagesDropzone.getRootProps()}
                        className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg hover:border-primary cursor-pointer"
                      >
                        <input {...additionalImagesDropzone.getInputProps()} />
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Categories</Label>
                  <Categories
                    onCategoryChange={handleCategoryChange}
                    onSubCategoryChange={handleSubCategoryChange}
                    initialSelectedCategories={selectedCategories}
                    initialSelectedSubCategories={selectedSubCategories}
                    allowSelect
                    className="min-h-[160px]"
                  />
                </div>
              </div>
            </div>

            <AdditionalSettings
              seoTitle={seoTitle}
              seoDesc={seoDesc}
              onSeoTitleChange={setSeoTitle}
              onSeoDescChange={setSeoDesc}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}