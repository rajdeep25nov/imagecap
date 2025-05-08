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
  const [captions, setCaptions] = useState<string[] | null>(null);
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
        setCaptions(null);
        return;
      }
      setSelectedFile(file);
      setCaptions(null);
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
    setCaptions(null);

    const reader = new FileReader();

    reader.onloadend = async () => {
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
        setCaptions(result.captions);
      } catch (e) {
        console.error("Error generating captions:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to generate captions: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      console.error("FileReader onerror triggered");
      setError('Failed to read the image file.');
      setIsLoading(false);
    };

    try {
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      console.error("Error initiating FileReader.readAsDataURL:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to process image for reading: ${errorMessage}`);
      setIsLoading(false);
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
          Upload an image and let our AI generate multiple descriptive captions for you, perfect for social media!
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
                setCaptions(null);
                return;
              }
              setSelectedFile(file);
              setCaptions(null);
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
                    fill
                    style={{ objectFit: 'contain' }}
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
              Generating Captions...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Captions
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

        {isLoading && !captions && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        )}

        {captions && !isLoading && captions.length > 0 && (
          <div className="pt-4">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Generated Captions:</h3>
            <div className="space-y-3">
              {captions.map((cap, index) => (
                <Card key={index} className="bg-secondary">
                  <CardContent className="p-4">
                    <p className="text-secondary-foreground whitespace-pre-wrap">{cap}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
