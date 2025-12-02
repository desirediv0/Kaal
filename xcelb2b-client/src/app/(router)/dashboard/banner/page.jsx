"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Loader2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Edit,
  GripVertical,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../../../../context/AuthContext";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL;

function SortableBanner({ banner, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl mb-2">{banner.title}</CardTitle>
            {banner.description && (
              <CardDescription className="line-clamp-2 text-sm">
                {banner.description}
              </CardDescription>
            )}
          </div>
          <div {...listeners} className="cursor-move">
            <GripVertical className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {banner.imageUrl ? (
            <Image
              src={`${imageBaseUrl}${banner.imageUrl.replace("upload/", "")}`}
              alt={banner.title}
              className="w-full h-48 object-cover rounded-md mb-4"
              width={800}
              height={400}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="space-y-2 text-sm">
            {banner.linkUrl && (
              <p className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline truncate"
                >
                  {banner.linkUrl}
                </a>
              </p>
            )}
            <p className="flex items-center">
              <strong className="mr-2">Active:</strong>
              <Badge
                className={` ${
                  banner.isActive
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {banner.isActive ? "Yes" : "No"}
              </Badge>
            </p>
            <p className="flex items-center">
              <strong className="mr-2">Position:</strong>
              <Badge variant="secondary">{banner.position + 1}</Badge>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-6 bg-gray-50">
          <Button
            onClick={() => onEdit(banner)}
            variant="outline"
            className="flex-1 mr-2"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex-1 ml-2">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Are you sure you want to delete this banner?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(banner.id)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function BannerManagement() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all-banners");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayedBanners, setDisplayedBanners] = useState([]);
  const [viewMode, setViewMode] = useState("normal");
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    linkUrl: "",
    description: "",
    isActive: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/banner/banners`);
      setBanners(response.data.data);
      setDisplayedBanners(response.data.data);
      if (response.data.data.length === 0) {
        console.warn("No Banners found");
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch banners. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      fetchBanners();
    };
    init();
  }, [checkAuth, router, fetchBanners]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFormData((prev) => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image" && value) {
        formDataToSend.append("image", value);
      } else if (value !== "") {
        formDataToSend.append(key, String(value));
      }
    });

    try {
      const url = selectedBanner
        ? `${apiUrl}/banner/banners/${selectedBanner.id}`
        : `${apiUrl}/banner/banners`;
      const method = selectedBanner ? "put" : "post";

      await axios[method](url, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchBanners();
      resetForm();
      setActiveTab("all-banners");
      toast({
        title: "Success",
        description: `Banner ${
          selectedBanner ? "updated" : "created"
        } successfully.`,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: `Failed to ${
          selectedBanner ? "update" : "create"
        } banner. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${apiUrl}/banner/banners/${id}`);
      await fetchBanners();
      toast({
        title: "Success",
        description: "Banner deleted successfully.",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to delete banner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      image: null,
      linkUrl: "",
      description: "",
      isActive: true,
    });
    setSelectedBanner(null);
    setPreviewImage(null);
  };

  const editBanner = (banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      image: null,
      linkUrl: banner.linkUrl || "",
      description: banner.description || "",
      isActive: banner.isActive,
    });
    setPreviewImage(`${imageBaseUrl}${banner.imageUrl.replace("upload/", "")}`);
    setActiveTab("create-edit");
  };

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = banners.findIndex((item) => item.id === active.id);
        const newIndex = banners.findIndex((item) => item.id === over?.id);

        const newBanners = arrayMove(banners, oldIndex, newIndex);
        setBanners(newBanners);

        try {
          const response = await axios.put(
            `${apiUrl}/banner/banners/${active.id}/position`,
            {
              newPosition: newIndex + 1,
            }
          );

          if (
            response.data.success === true &&
            response.data.statusCode === 200
          ) {
            console.log("Banner position updated successfully");
          } else {
            throw new Error("Invalid response format");
          }
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to update banner position",
            variant: "destructive",
          });
          await fetchBanners();
        }
      }
    },
    [banners, toast, fetchBanners, apiUrl]
  );

  useEffect(() => {
    if (viewMode === "normal") {
      setDisplayedBanners([...banners]);
    } else {
      setDisplayedBanners([...banners].reverse());
    }
  }, [viewMode, banners]);

  const handleViewModeChange = (value) => {
    setViewMode(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-xl font-bold mb-8 text-center">Banner Management</h1>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="all-banners" className="text-sm">
            All Banners
          </TabsTrigger>
          <TabsTrigger value="create-edit" className="text-sm">
            {selectedBanner ? "Edit Banner" : "Create Banner"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all-banners">
          {banners.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-gray-500 text-sm">
                  No banners found. You can create a new banner.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <Select onValueChange={handleViewModeChange} value={viewMode}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="View order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal order</SelectItem>
                    <SelectItem value="reverse">Reverse order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayedBanners.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedBanners.map((banner) => (
                      <SortableBanner
                        key={banner.id}
                        banner={banner}
                        onEdit={editBanner}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </TabsContent>
        <TabsContent value="create-edit">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedBanner ? "Edit Banner" : "Create Banner"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full text-sm py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Image</Label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-gray-300"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="mx-auto h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-16 w-16 text-gray-400" />
                        <p className="text-sm">
                          Drag 'n' drop an image here, or click to select one
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl" className="text-sm">
                    Link URL (Optional)
                  </Label>
                  <Input
                    id="linkUrl"
                    name="linkUrl"
                    value={formData.linkUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full text-sm py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full text-sm py-2"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Active
                  </Label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-sm py-6"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    {selectedBanner ? "Update Banner" : "Create Banner"}
                  </Button>
                  {selectedBanner && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="w-full text-sm py-6"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
