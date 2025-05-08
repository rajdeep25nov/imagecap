"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { generateImageCaption, type GenerateImageCaptionInput } from '@/ai/flows/generate-image-caption';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImageScribeClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up the object URL when the component unmounts or previewImage changes
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image.');
        setSelectedFile(null);
        setPreviewImage(null);
        return;
      }
      setSelectedFile(file);
      setCaption(null);
      setError(null);
      
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaption(null);

    const reader = new FileReader();

    reader.onloadend = async () => {
      // This event fires after the file is successfully read or if reading failed and onerror is not set.
      // We check reader.error in case of failure if onerror was not specifically triggered.
      if (reader.error) {
        console.error("FileReader error during loadend:", reader.error);
        setError('Failed to read the image file.');
        setIsLoading(false);
        return;
      }

      const photoDataUri = reader.result as string;
      if (!photoDataUri) {
          setError('Failed to read image data.');
          setIsLoading(false);
          return;
      }

      try {
        const input: GenerateImageCaptionInput = { photoDataUri };
        const result = await generateImageCaption(input);
        setCaption(result.caption);
      } catch (e) {
        console.error("Error generating caption:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to generate caption: ${errorMessage}`);
      } finally {
        setIsLoading(false); // Ensures isLoading is false after caption generation attempt
      }
    };

    reader.onerror = () => {
      // This event fires if an error occurs while reading the file.
      console.error("FileReader onerror triggered");
      setError('Failed to read the image file.');
      setIsLoading(false);
    };

    try {
      // Start reading the file. This is an asynchronous operation.
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      // This catch block handles synchronous errors from initiating readAsDataURL.
      // Most errors with FileReader are asynchronous and handled by 'onerror' or 'onloadend' (with reader.error check).
      console.error("Error initiating FileReader.readAsDataURL:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to process image for reading: ${errorMessage}`);
      setIsLoading(false); // Set loading to false if read initiation fails synchronously.
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Describe Your Image</CardTitle>
        <CardDescription className="text-center">
          Upload an image and let our AI generate a descriptive caption for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={triggerFileInput}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
               if (!file.type.startsWith('image/')) {
                setError('Invalid file type. Please upload an image.');
                setSelectedFile(null);
                setPreviewImage(null);
                return;
              }
              setSelectedFile(file);
              setCaption(null);
              setError(null);
              if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
              }
              setPreviewImage(URL.createObjectURL(file));
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag & drop an image here, or click to select
          </p>
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {selectedFile && (
          <div className="space-y-2">
            <Label htmlFor="image-preview" className="text-sm font-medium">Image Preview</Label>
             {previewImage && (
              <div className="relative w-full aspect-video rounded-md overflow-hidden border border-muted">
                 <Image
                    src={previewImage}
                    alt="Uploaded preview"
                    fill // Use fill for responsive layout
                    style={{ objectFit: 'contain' }} // Replaces layout="fill" objectFit="contain"
                    data-ai-hint="uploaded image"
                  />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerateCaption}
          disabled={!selectedFile || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
              Generating Caption...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Caption
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !caption && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {caption && !isLoading && (
          <div className="pt-4">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Generated Caption:</h3>
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-secondary-foreground">{caption}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
