"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, AlertTriangle, FileText, Volume2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { generateImageCaption, type GenerateImageCaptionInput } from '@/ai/flows/generate-image-caption';
import { describeImage, type DescribeImageInput } from '@/ai/flows/describe-image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type LoadingOperation = 'caption' | 'describe' | null;

export default function ImageScribeClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[] | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState<LoadingOperation>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [previewImage]);

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image.');
        setSelectedFile(null);
        setPreviewImage(null);
        setCaptions(null);
        setDescription(null);
        stopSpeech();
        return;
      }
      setSelectedFile(file);
      setCaptions(null);
      setDescription(null);
      setError(null);
      stopSpeech();
      
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const processImageWithAI = async (operation: 'caption' | 'describe') => {
    if (!selectedFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setLoadingOperation(operation);
    setError(null);
    setSpeechError(null);
    stopSpeech();

    if (operation === 'caption') {
        setCaptions(null);
    } else {
        setDescription(null);
    }


    const reader = new FileReader();

    reader.onloadend = async () => {
      if (reader.error) {
        console.error("FileReader error during loadend:", reader.error);
        setError('Failed to read the image file.');
        setIsLoading(false);
        setLoadingOperation(null);
        return;
      }

      const photoDataUri = reader.result as string;
      if (!photoDataUri) {
          setError('Failed to read image data.');
          setIsLoading(false);
          setLoadingOperation(null);
          return;
      }

      try {
        if (operation === 'caption') {
          const input: GenerateImageCaptionInput = { photoDataUri };
          const result = await generateImageCaption(input);
          setCaptions(result.captions);
        } else if (operation === 'describe') {
          const input: DescribeImageInput = { photoDataUri };
          const result = await describeImage(input);
          setDescription(result.description);
        }
      } catch (e) {
        console.error(`Error generating ${operation}:`, e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to generate ${operation}: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        setLoadingOperation(null);
      }
    };

    reader.onerror = () => {
      console.error("FileReader onerror triggered");
      setError('Failed to read the image file.');
      setIsLoading(false);
      setLoadingOperation(null);
    };
    
    try {
      reader.readAsDataURL(selectedFile);
    } catch (e) {
        console.error("Error initiating FileReader.readAsDataURL:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to process image for reading: ${errorMessage}`);
        setIsLoading(false);
        setLoadingOperation(null);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSpeakDescription = () => {
    if (!description) {
      setSpeechError("No description available to speak.");
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechError("Speech synthesis is not supported by your browser.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setSpeechError(null);
    const utterance = new SpeechSynthesisUtterance(description);

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setSpeechError(`Speech synthesis error: ${event.error || 'Unknown error'}`);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.cancel(); // Clear queue
    window.speechSynthesis.speak(utterance);
  };


  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Analyze Your Image</CardTitle>
        <CardDescription className="text-center">
          Upload an image and let our AI generate descriptive captions or a detailed description for you!
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
                setDescription(null);
                stopSpeech();
                return;
              }
              setSelectedFile(file);
              setCaptions(null);
              setDescription(null);
              setError(null);
              stopSpeech();
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => processImageWithAI('caption')}
            disabled={!selectedFile || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && loadingOperation === 'caption' ? (
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
          <Button
            onClick={() => processImageWithAI('describe')}
            disabled={!selectedFile || isLoading}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            {isLoading && loadingOperation === 'describe' ? (
              <>
                <FileText className="mr-2 h-5 w-5 animate-pulse" />
                Generating Description...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Describe Image
              </>
            )}
          </Button>
        </div>
        

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && loadingOperation === 'caption' && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        )}

        {isLoading && loadingOperation === 'describe' && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3 mb-2" /> 
            <Skeleton className="h-24 w-full" /> 
          </div>
        )}

        {captions && !isLoading && (
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

        {description && !isLoading && (
           <div className="pt-4">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Generated Description:</h3>
            <Card className="bg-secondary">
              <CardContent className="p-4">
                <p className="text-secondary-foreground whitespace-pre-wrap">{description}</p>
              </CardContent>
            </Card>
            <Button
              onClick={handleSpeakDescription}
              disabled={!description || isLoading}
              className="mt-4 w-full md:w-auto"
              variant="outline"
            >
              {isSpeaking ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5 animate-pulse" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-5 w-5" />
                  Speak Description
                </>
              )}
            </Button>
            {speechError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Speech Error</AlertTitle>
                <AlertDescription>{speechError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
