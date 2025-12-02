"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  Plus,
  Edit,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "../../../../../context/AuthContext";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  compressImage,
  getFileSize,
  formatFileSize,
} from "@/lib/imageCompression";

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=No+Image";

const getImageUrl = (filename) => {
  if (!filename) return FALLBACK_IMAGE;
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("blob:")) return filename;
  return filename;
};

export default function Categories({
  onCategoryChange,
  onSubCategoryChange,
  allowEdit = false,
  allowCreate = false,
  allowDelete = false,
  allowSelect = true,
  initialSelectedCategories = [],
  initialSelectedSubCategories = [],
  className,
}) {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    initialSelectedCategories
  );
  const [selectedSubCategories, setSelectedSubCategories] = useState(
    initialSelectedSubCategories
  );
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subCategoryImage, setSubCategoryImage] = useState(null);
  const [subCategoryImagePreview, setSubCategoryImagePreview] = useState(null);
  const [updatingSubCategory, setUpdatingSubCategory] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [originalFileSize, setOriginalFileSize] = useState(null);
  const [compressedFileSize, setCompressedFileSize] = useState(null);

  const { checkAuth } = useAuth();
  const { toast } = useToast();

  // Dropzone for subcategory image
  const onDropSubCategoryImage = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        console.log("Starting image compression...");
        setCompressingImage(true);
        setOriginalFileSize(getFileSize(file));

        try {
          // Compress the image with faster settings
          const compressionPromise = compressImage(file, {
            maxWidth: 400, // Reduced from 800
            maxHeight: 400, // Reduced from 800
            quality: 0.6, // Reduced from 0.8 for faster compression
            format: "jpeg",
          });

          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Compression timeout")), 5000); // Reduced from 10s to 5s
          });

          const compressedFile = await Promise.race([
            compressionPromise,
            timeoutPromise,
          ]);

          console.log("Image compression completed");
          setCompressedFileSize(getFileSize(compressedFile));
          setSubCategoryImage(compressedFile);
          setSubCategoryImagePreview(URL.createObjectURL(compressedFile));

          // Show compression info toast
          const originalSize = formatFileSize(file.size);
          const compressedSize = formatFileSize(compressedFile.size);
          const savings = (
            ((file.size - compressedFile.size) / file.size) *
            100
          ).toFixed(1);

          toast({
            title: "Image Compressed",
            description: `Original: ${originalSize} → Compressed: ${compressedSize} (${savings}% smaller)`,
          });
        } catch (error) {
          console.error("Image compression failed:", error);
          // Fallback to original file if compression fails
          setSubCategoryImage(file);
          setSubCategoryImagePreview(URL.createObjectURL(file));
          toast({
            title: "Warning",
            description: "Image compression failed, using original file.",
            variant: "destructive",
          });
        } finally {
          console.log("Setting compressingImage to false");
          setCompressingImage(false);
        }
      }
    },
    [toast]
  );

  const subCategoryImageDropzone = useDropzone({
    onDrop: onDropSubCategoryImage,
    accept: { "image/*": [] },
    multiple: false,
  });

  useEffect(() => {
    const initializeCategories = async () => {
      await loadCategories();
      if (initialSelectedCategories.length === 0) {
        const uncategorized = categories.find(
          (c) => c.name.toLowerCase() === "uncategorized"
        );
        if (uncategorized) {
          setSelectedCategories([uncategorized.id]);
        }
      }
    };
    initializeCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        window.location.href = "/";
        return;
      }
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/category`
      );

      // Handle different response structures
      let loadedCategories = [];
      if (response.data && response.data.success) {
        // New API structure with pagination
        if (response.data.data && response.data.data.categories) {
          loadedCategories = response.data.data.categories;
        } else if (Array.isArray(response.data.data)) {
          // Direct array response
          loadedCategories = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array at root level
          loadedCategories = response.data;
        }
      } else if (Array.isArray(response.data)) {
        // Direct array response
        loadedCategories = response.data;
      }

      // Ensure it's always an array
      if (!Array.isArray(loadedCategories)) {
        console.error("Categories is not an array:", loadedCategories);
        loadedCategories = [];
      }

      setCategories(loadedCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategories((prev) => {
      let newSelection = [...prev];
      const category = Array.isArray(categories)
        ? categories.find((c) => c.id === categoryId)
        : null;

      if (category && category.name.toLowerCase() === "uncategorized") {
        if (!prev.includes(categoryId)) {
          setSelectedSubCategories([]);
          return [categoryId];
        }
        return prev.filter((id) => id !== categoryId);
      }

      if (prev.includes(categoryId)) {
        newSelection = prev.filter((id) => id !== categoryId);
        // Clear subcategories of this category
        const subCategoryIds =
          categories
            .find((c) => c.id === categoryId)
            ?.subCategories.map((sc) => sc.id) || [];
        setSelectedSubCategories((prev) =>
          prev.filter((id) => !subCategoryIds.includes(id))
        );
      } else {
        newSelection.push(categoryId);
        // Remove uncategorized if exists
        newSelection = newSelection.filter(
          (id) =>
            categories.find((c) => c.id === id)?.name.toLowerCase() !==
            "uncategorized"
        );
      }

      if (onCategoryChange) {
        onCategoryChange(newSelection);
      }
      return newSelection;
    });
  };

  const handleSubCategorySelect = (subCategoryId, categoryId) => {
    setSelectedSubCategories((prev) => {
      let newSelection = [...prev];

      if (prev.includes(subCategoryId)) {
        newSelection = prev.filter((id) => id !== subCategoryId);

        // If no subcategories selected for this category, remove category selection
        const hasOtherSubcategories = prev.some((id) => {
          const category = categories.find((c) =>
            c.subCategories?.some((sc) => sc.id === id)
          );
          return category?.id === categoryId;
        });

        if (!hasOtherSubcategories) {
          setSelectedCategories((prev) =>
            prev.filter((id) => id !== categoryId)
          );
        }
      } else {
        // Remove Uncategorized if it's selected
        setSelectedCategories((prev) => {
          const uncategorized = categories.find(
            (c) => c.name.toLowerCase() === "uncategorized"
          );
          let newCats = prev.filter((id) => id !== uncategorized?.id);

          // Add parent category if not already selected
          if (!newCats.includes(categoryId)) {
            newCats = [...newCats, categoryId];
          }

          // Notify parent about category changes
          if (onCategoryChange) {
            const selectedCategoryObjects = categories.filter((c) =>
              newCats.includes(c.id)
            );
            onCategoryChange(selectedCategoryObjects);
          }

          return newCats;
        });

        newSelection.push(subCategoryId);
      }

      // Notify parent about subcategory changes
      if (onSubCategoryChange) {
        const selectedSubCategoryObjects = categories
          .flatMap((c) => c.subCategories)
          .filter((sc) => newSelection.includes(sc.id));
        onSubCategoryChange(selectedSubCategoryObjects);
      }

      return newSelection;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/category`,
        {
          name: newCategory,
        }
      );
      const newCategoryData = response.data.data;
      setCategories((prevCategories) => [...prevCategories, newCategoryData]);
      setNewCategory("");
      toast({
        title: "Success",
        description: `Category "${newCategoryData.name}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubCategory = async (categoryId) => {
    if (!newSubCategory.trim()) return;
    const category = Array.isArray(categories)
      ? categories.find((c) => c.id === categoryId)
      : null;
    if (category && category.name.toLowerCase() === "uncategorized") {
      toast({
        title: "Error",
        description: "Cannot create subcategories for Uncategorized.",
        variant: "destructive",
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", newSubCategory);
      formData.append("categoryId", categoryId);

      if (subCategoryImage) {
        formData.append("image", subCategoryImage);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/subcategory`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const newSubCategoryData = response.data.data;
      setCategories((prevCategories) => {
        if (!Array.isArray(prevCategories)) {
          console.error("prevCategories is not an array:", prevCategories);
          return [];
        }
        return prevCategories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subCategories: [
                  ...(category.subCategories || []),
                  newSubCategoryData,
                ],
              }
            : category
        );
      });
      setNewSubCategory("");
      setSubCategoryImage(null);
      setSubCategoryImagePreview(null);
      setOriginalFileSize(null);
      setCompressedFileSize(null);
      toast({
        title: "Success",
        description: `Sub-category "${newSubCategoryData.name}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create sub-category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const categoryToDelete = Array.isArray(categories)
        ? categories.find((c) => c.id === categoryId)
        : null;

      // Prevent deleting Uncategorized
      if (
        categoryToDelete &&
        categoryToDelete.name.toLowerCase() === "uncategorized"
      ) {
        toast({
          title: "Error",
          description: "Cannot delete Uncategorized category",
          variant: "destructive",
        });
        return;
      }

      // Delete from API
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/category/${categoryId}`
      );

      // Update UI state
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));

      // Clear subcategory selections of deleted category
      const deletedSubCatIds =
        categoryToDelete.subCategories?.map((sc) => sc.id) || [];
      setSelectedSubCategories((prev) =>
        prev.filter((id) => !deletedSubCatIds.includes(id))
      );

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubCategory = async (subCategoryId) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/subcategory/${subCategoryId}`
      );

      // Update UI state
      setCategories((prev) => {
        if (!Array.isArray(prev)) {
          console.error("prev is not an array:", prev);
          return [];
        }
        return prev.map((category) => ({
          ...category,
          subCategories: (category.subCategories || []).filter(
            (sc) => sc.id !== subCategoryId
          ),
        }));
      });

      setSelectedSubCategories((prev) =>
        prev.filter((id) => id !== subCategoryId)
      );

      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete subcategory",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setEditedName(category.name);
  };

  const handleEditSubCategory = (subCategory) => {
    setEditingSubCategory(subCategory.id);
    setEditedName(subCategory.name);
    setSubCategoryImage(null);
    setSubCategoryImagePreview(
      subCategory.image ? getImageUrl(subCategory.image) : null
    );
    setOriginalFileSize(null);
    setCompressedFileSize(null);
    setCompressingImage(false);
  };

  const handleUpdateCategory = async () => {
    if (editingCategory === null) return;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/category/${editingCategory}`,
        { name: editedName }
      );
      const updatedCategory = response.data.data;
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory ? { ...c, name: updatedCategory.name } : c
        )
      );
      setEditingCategory(null);
      toast({
        title: "Success",
        description: `Category has been updated to "${updatedCategory.name}".`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubCategory = async () => {
    if (editingSubCategory === null) return;
    setUpdatingSubCategory(editingSubCategory);
    try {
      const formData = new FormData();
      formData.append("name", editedName);

      if (subCategoryImage) {
        formData.append("image", subCategoryImage);
      }

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/subcategory/${editingSubCategory}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const updatedSubCategory = response.data.data;
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          subCategories: category.subCategories.map((sc) =>
            sc.id === editingSubCategory
              ? {
                  ...sc,
                  name: updatedSubCategory.name,
                  image: updatedSubCategory.image,
                }
              : sc
          ),
        }))
      );
      setEditingSubCategory(null);
      setSubCategoryImage(null);
      setSubCategoryImagePreview(null);
      setOriginalFileSize(null);
      setCompressedFileSize(null);
      toast({
        title: "Success",
        description: `Sub-category has been updated to "${updatedSubCategory.name}".`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update sub-category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingSubCategory(null);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <ScrollArea className={`h-[400px] pr-4 ${className}`}>
            <div className="space-y-2">
              {!Array.isArray(categories) && (
                <div className="text-center text-gray-500 py-8">
                  Error: Categories data is invalid
                </div>
              )}
              {Array.isArray(categories) && categories.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No categories found
                </div>
              )}
              {Array.isArray(categories) &&
                categories.length > 0 &&
                categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {allowSelect && (
                          <Checkbox
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() =>
                              handleCategorySelect(category.id)
                            }
                            id={`category-${category.id}`}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        )}
                        <span
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {category.name.toLowerCase() !== "uncategorized" ? (
                            expandedCategory === category.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          ) : null}
                          {editingCategory === category.id ? (
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="h-8 flex-1"
                              autoFocus
                            />
                          ) : (
                            <Label
                              htmlFor={`category-${category.id}`}
                              className="flex-1 cursor-pointer truncate"
                            >
                              {category.name}
                            </Label>
                          )}
                        </span>
                      </div>
                      {allowEdit &&
                        category.name.toLowerCase() !== "uncategorized" && (
                          <div className="flex items-center gap-2">
                            {editingCategory === category.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleUpdateCategory}
                                  className="h-8 w-8"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCategory(null)}
                                  className="h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {allowDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                className="h-8 w-8 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                    {expandedCategory === category.id && (
                      <div className="ml-6 space-y-2">
                        {category.subCategories?.map((subCategory) => (
                          <div
                            key={subCategory.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {allowSelect && (
                                <Checkbox
                                  checked={selectedSubCategories.includes(
                                    subCategory.id
                                  )}
                                  onCheckedChange={() =>
                                    handleSubCategorySelect(
                                      subCategory.id,
                                      category.id
                                    )
                                  }
                                  id={`subcategory-${subCategory.id}`}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              )}
                              {/* Subcategory Image */}
                              {subCategory.image && (
                                <Image
                                  src={getImageUrl(subCategory.image)}
                                  alt={subCategory.name}
                                  width={32}
                                  height={32}
                                  className="object-cover rounded"
                                />
                              )}
                              {editingSubCategory === subCategory.id ? (
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={editedName}
                                    onChange={(e) =>
                                      setEditedName(e.target.value)
                                    }
                                    className="h-8"
                                    autoFocus
                                  />
                                  {/* Image upload for editing */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Update Image
                                    </Label>
                                    <div
                                      {...subCategoryImageDropzone.getRootProps()}
                                      className="border border-dashed border-gray-300 rounded p-2 hover:border-gray-400 transition-colors cursor-pointer"
                                    >
                                      <input
                                        {...subCategoryImageDropzone.getInputProps()}
                                      />
                                      {compressingImage ? (
                                        <div className="text-center">
                                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />
                                          <p className="text-xs text-gray-500">
                                            Optimizing image...
                                          </p>
                                        </div>
                                      ) : subCategoryImagePreview ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Image
                                              src={subCategoryImagePreview}
                                              alt="Preview"
                                              width={24}
                                              height={24}
                                              className="object-cover rounded"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                              New image selected
                                            </span>
                                          </div>
                                          {originalFileSize &&
                                            compressedFileSize && (
                                              <div className="text-xs text-green-600">
                                                {originalFileSize}MB →{" "}
                                                {compressedFileSize}MB
                                              </div>
                                            )}
                                        </div>
                                      ) : (
                                        <div className="text-center">
                                          <Upload className="mx-auto h-4 w-4 text-gray-400" />
                                          <p className="text-xs text-gray-500">
                                            Click to change image
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Label
                                  htmlFor={`subcategory-${subCategory.id}`}
                                  className="flex-1 cursor-pointer truncate"
                                >
                                  {subCategory.name}
                                </Label>
                              )}
                            </div>
                            {allowEdit && (
                              <div className="flex items-center gap-2">
                                {editingSubCategory === subCategory.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleUpdateSubCategory}
                                      className="h-8 w-8"
                                      disabled={
                                        updatingSubCategory === subCategory.id
                                      }
                                    >
                                      {updatingSubCategory ===
                                      subCategory.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingSubCategory(null);
                                        setSubCategoryImage(null);
                                        setSubCategoryImagePreview(null);
                                        setOriginalFileSize(null);
                                        setCompressedFileSize(null);
                                        setCompressingImage(false);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleEditSubCategory(subCategory)
                                    }
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {allowDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDeleteSubCategory(subCategory.id)
                                    }
                                    className="h-8 w-8 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {allowCreate &&
                          category.name.toLowerCase() !== "uncategorized" && (
                            <div className="space-y-2 mt-2">
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  placeholder="New sub-category name"
                                  value={newSubCategory}
                                  onChange={(e) =>
                                    setNewSubCategory(e.target.value)
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    handleCreateSubCategory(category.id)
                                  }
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add
                                </Button>
                              </div>
                              {/* Image upload for new subcategory */}
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">
                                  Subcategory Image (Optional)
                                </Label>
                                <div
                                  {...subCategoryImageDropzone.getRootProps()}
                                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                                >
                                  <input
                                    {...subCategoryImageDropzone.getInputProps()}
                                  />
                                  {compressingImage ? (
                                    <div className="text-center">
                                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                      <p className="mt-1 text-xs text-gray-500">
                                        Optimizing image...
                                      </p>
                                    </div>
                                  ) : subCategoryImagePreview ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Image
                                          src={subCategoryImagePreview}
                                          alt="Preview"
                                          width={40}
                                          height={40}
                                          className="object-cover rounded"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          Image selected
                                        </span>
                                      </div>
                                      {originalFileSize &&
                                        compressedFileSize && (
                                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                            <div>
                                              Original: {originalFileSize}MB
                                            </div>
                                            <div>
                                              Compressed: {compressedFileSize}MB
                                            </div>
                                            <div className="font-medium">
                                              {(
                                                ((originalFileSize -
                                                  compressedFileSize) /
                                                  originalFileSize) *
                                                100
                                              ).toFixed(1)}
                                              % smaller
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <Upload className="mx-auto h-6 w-6 text-gray-400" />
                                      <p className="mt-1 text-xs text-gray-500">
                                        Click to upload image
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
          {allowCreate && (
            <div className="flex gap-2 pt-4">
              <Input
                type="text"
                placeholder="Enter new category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreateCategory} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          )}
          {allowSelect &&
            (selectedCategories.length > 0 ||
              selectedSubCategories.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-4">
                {categories
                  .filter((category) =>
                    selectedCategories.includes(category.id)
                  )
                  .map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                {categories
                  .flatMap((category) => category.subCategories)
                  .filter((subCategory) =>
                    selectedSubCategories.includes(subCategory.id)
                  )
                  .map((subCategory) => (
                    <Badge key={subCategory.id} variant="outline">
                      {subCategory.name}
                    </Badge>
                  ))}
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
