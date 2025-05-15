"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileImage, FileVideo, Globe, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function NewAssetPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setSelectedFile(file);

    // Check file type and create preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      // For videos, we'll use a placeholder or the first frame
      setFilePreview("/placeholder.svg?height=200&width=300");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Check if file is an image or video
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setSelectedFile(file);

        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreview("/placeholder.svg?height=200&width=300");
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or video file.",
          variant: "destructive",
        });
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Add the file to formData
    formData.append("file", selectedFile);

    // Determine the asset type based on file type
    const type = selectedFile.type.startsWith("image/")
      ? "IMAGE"
      : selectedFile.type.startsWith("video/")
      ? "VIDEO"
      : "URL";

    formData.append("type", type);

    setIsUploading(true);

    try {
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const asset = await response.json();

      toast({
        title: "Asset uploaded successfully",
        description: "Your asset has been uploaded and is ready to use.",
      });

      router.push("/dashboard/assets");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error uploading your asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleHtmlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("type", "HTML");

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const asset = await response.json();

      toast({
        title: "HTML asset created successfully",
        description: "Your HTML asset has been created and is ready to use.",
      });

      router.push("/dashboard/assets");
    } catch (error) {
      console.error("Creation error:", error);
      toast({
        title: "Creation failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error creating your HTML asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("type", "URL");

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const asset = await response.json();

      toast({
        title: "URL asset added successfully",
        description: "Your URL asset has been added and is ready to use.",
      });

      router.push("/dashboard/assets");
    } catch (error) {
      console.error("Creation error:", error);
      toast({
        title: "Creation failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error adding your URL asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add New Asset</h2>
        <p className="text-muted-foreground">
          Upload a new asset to use in your digital signage playlists
        </p>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="html">HTML Content</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media File</CardTitle>
              <CardDescription>
                Upload an image or video file to use in your playlists
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpload}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter asset name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter a description for this asset"
                  />
                </div>

                <div className="space-y-2">
                  <Label>File</Label>
                  {!selectedFile ? (
                    <div
                      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/40 px-4 py-5 text-center"
                      onClick={triggerFileInput}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports JPG, PNG, GIF, MP4, WebM (max 100MB)
                        </p>
                      </div>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-md border bg-card">
                      <div className="absolute right-2 top-2 z-10">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={removeSelectedFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {filePreview && (
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                          <img
                            src={filePreview || "/placeholder.svg"}
                            alt="File preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                          {selectedFile.type}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload Asset"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create HTML Content</CardTitle>
              <CardDescription>
                Create custom HTML content to display in your playlists
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleHtmlSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="html-name">Asset Name</Label>
                  <Input
                    id="html-name"
                    name="name"
                    placeholder="Enter asset name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html-content">HTML Content</Label>
                  <Textarea
                    id="html-content"
                    name="content"
                    placeholder="Enter your HTML content here"
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? "Creating..." : "Create HTML Asset"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add from URL</CardTitle>
              <CardDescription>
                Add content from a URL (webpage or media file)
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUrlSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url-name">Asset Name</Label>
                  <Input
                    id="url-name"
                    name="name"
                    placeholder="Enter asset name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url-type">Content Type</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2 rounded-md border border-input p-3 hover:bg-accent">
                      <input
                        type="radio"
                        id="type-image"
                        name="contentType"
                        value="image"
                        className="sr-only"
                        defaultChecked
                      />
                      <label
                        htmlFor="type-image"
                        className="flex flex-col items-center gap-2 cursor-pointer w-full h-full"
                      >
                        <FileImage className="h-6 w-6" />
                        <span className="text-sm">Image</span>
                      </label>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-md border border-input p-3 hover:bg-accent">
                      <input
                        type="radio"
                        id="type-video"
                        name="contentType"
                        value="video"
                        className="sr-only"
                      />
                      <label
                        htmlFor="type-video"
                        className="flex flex-col items-center gap-2 cursor-pointer w-full h-full"
                      >
                        <FileVideo className="h-6 w-6" />
                        <span className="text-sm">Video</span>
                      </label>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-md border border-input p-3 hover:bg-accent">
                      <input
                        type="radio"
                        id="type-webpage"
                        name="contentType"
                        value="webpage"
                        className="sr-only"
                      />
                      <label
                        htmlFor="type-webpage"
                        className="flex flex-col items-center gap-2 cursor-pointer w-full h-full"
                      >
                        <Globe className="h-6 w-6" />
                        <span className="text-sm">Webpage</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? "Adding..." : "Add URL Asset"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
