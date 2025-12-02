"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, IndianRupee, Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useDropzone } from "react-dropzone"
import Categories from "./Categories"
import AdditionalSettings from "./AdditionalSettings"
import { useAuth } from "../../../../../context/AuthContext"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load Jodit editor with loading state
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />
})

export default function AddProductPage() {
  // State management
  const [productName, setProductName] = useState("")
  const [regularPrice, setRegularPrice] = useState("")
  const [shortDesc, setShortDesc] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [description, setDescription] = useState("")
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [thumbnail, setThumbnail] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDesc, setSeoDesc] = useState("")

  // Hooks
  const { toast } = useToast()
  const { checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Import CSS for Jodit editor with dynamic import to ensure it's loaded properly
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
  const baseEditorConfig = useMemo(() => ({
    readonly: false,
    enableDragAndDropFileToEditor: true,
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
      'symbol', 'fullsize', 'print', 'about'
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
    defaultMode: '1',
    tableAllowCellSelection: true,
    tableDefaultWidth: '100%',
    tableCellsControllers: ['left', 'top', 'right', 'bottom', 'delete'],
  }), [])

  // Editor-specific configurations
  const shortDescConfig = useMemo(() => ({
    ...baseEditorConfig,
    height: 350,
    allowResizeY: true,
    minHeight: 200,
    maxHeight: 500
  }), [baseEditorConfig])

  const descriptionConfig = useMemo(() => ({
    ...baseEditorConfig,
    height: 450,
    allowResizeY: true,
    minHeight: 300,
    maxHeight: 800
  }), [baseEditorConfig])

  // Stable event handlers
  const handleShortDescChange = useCallback((newContent) => {
    setShortDesc(newContent)
  }, [])

  const handleDescriptionChange = useCallback((newContent) => {
    setDescription(newContent)
  }, [])

  useEffect(() => {
    import('jodit/build/jodit.min.css')
    checkAuth()
  }, [checkAuth])

  // Dropzone configurations
  const onDropThumbnail = useCallback((acceptedFiles) => {
    setThumbnail(acceptedFiles[0])
  }, [])

  const onDropAdditionalImage = useCallback((acceptedFiles) => {
    if (additionalImages.length < 8) {
      setAdditionalImages(prev => [...prev, acceptedFiles[0]])
    } else {
      toast({
        title: "Error",
        description: "Maximum 8 additional images allowed",
        variant: "destructive",
      })
    }
  }, [additionalImages.length, toast])

  const thumbnailDropzone = useDropzone({
    onDrop: onDropThumbnail,
    accept: { "image/*": [] },
    multiple: false,
  })

  const additionalImagesDropzone = useDropzone({
    onDrop: onDropAdditionalImage,
    accept: { "image/*": [] },
    multiple: false,
  })

  // Category handlers
  const handleCategoryChange = useCallback((selected) => {
    const categoryIds = selected.map(item => typeof item === 'string' ? item : item.id);
    setCategories(categoryIds);
  }, []);

  const handleSubCategoryChange = useCallback((selected) => {
    // Convert selected items to array of IDs
    const subCategoryIds = selected.map(item => typeof item === 'string' ? item : item.id);
    setSubCategories(subCategoryIds);
  }, []);

  // Image removal handler
  const removeAdditionalImage = useCallback((index) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
  }, [])


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!await checkAuth()) {
        router.push("/");
        return;
      }

      // Validation
      if (!productName || !shortDesc || !description || !thumbnail) {
        throw new Error("Required fields missing");
      }

      const formData = new FormData();

      // Basic fields
      formData.append("title", productName);
      formData.append("shortDesc", shortDesc);
      formData.append("description", description);
      formData.append("image", thumbnail);

      // Optional fields
      if (regularPrice) formData.append("price", regularPrice);
      if (salePrice) formData.append("salePrice", salePrice);
      if (seoTitle) formData.append("seoTitle", seoTitle);
      if (seoDesc) formData.append("seoDesc", seoDesc);

      // Handle categories
      if (categories.length > 0) {
        categories.forEach(categoryId => {
          formData.append("categoryIds[]", categoryId);
        });
      }

      // Handle subcategories  
      if (subCategories.length > 0) {
        subCategories.forEach(subCategoryId => {
          formData.append("subCategoryIds[]", subCategoryId);
        });
      }

      // Additional images
      additionalImages.forEach(image => {
        formData.append("images", image);
      });

      console.log('Debug - Form Data:', {
        categories,
        subCategories,
        formDataEntries: Array.from(formData.entries())
      });

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/product`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (data.success) {
        toast({ title: "Success", description: "Product created" });
        router.push("/dashboard/products");
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [
    checkAuth, productName, shortDesc, description, thumbnail,
    regularPrice, salePrice, seoTitle, seoDesc,
    categories, subCategories, additionalImages,
    router, toast
  ]);



  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-6">
            <CardTitle className="text-2xl font-bold">Add Product</CardTitle>
            <Button disabled={loading} type="submit" className="w-full sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Publishing..." : "Publish"}
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    placeholder="Enter product name"
                  />
                </div>

                {/* Short Description Editor */}
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <JoditEditor
                    value={shortDesc}
                    config={shortDescConfig}
                    onChange={handleShortDescChange}
                    tabIndex={1}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Regular Price</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <Input
                        type="number"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sale Price</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <Input
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Description Editor */}
                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <JoditEditor
                    value={description}
                    config={descriptionConfig}
                    onChange={handleDescriptionChange}
                    tabIndex={2}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Thumbnail Upload */}
                <div className="space-y-4">
                  <Label>Thumbnail Image</Label>
                  <div
                    {...thumbnailDropzone.getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    <input {...thumbnailDropzone.getInputProps()} />
                    {thumbnail ? (
                      <Image
                        src={URL.createObjectURL(thumbnail)}
                        alt="Thumbnail"
                        width={200}
                        height={200}
                        className="h-32 w-32 object-cover mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Drag or click to upload thumbnail
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div className="space-y-4">
                  <Label>Additional Images (Max 8)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {additionalImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Additional ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {additionalImages.length < 8 && (
                      <div
                        {...additionalImagesDropzone.getRootProps()}
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer"
                      >
                        <input {...additionalImagesDropzone.getInputProps()} />
                        <Plus className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <Label>Categories</Label>
                  <Categories
                    onCategoryChange={handleCategoryChange}
                    onSubCategoryChange={handleSubCategoryChange}
                    allowSelect
                    className="h-40"
                  />
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <AdditionalSettings
              seoTitle={seoTitle}
              seoDesc={seoDesc}
              onSeoTitleChange={setSeoTitle}
              onSeoDescChange={setSeoDesc}
            />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}