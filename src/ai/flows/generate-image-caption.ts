'use server';

/**
 * @fileOverview AI-powered image caption generator.
 *
 * - generateImageCaption - A function that generates multiple captions for an image.
 * - GenerateImageCaptionInput - The input type for the generateImageCaption function.
 * - GenerateImageCaptionOutput - The return type for the generateImageCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageCaptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to generate a caption for, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageCaptionInput = z.infer<typeof GenerateImageCaptionInputSchema>;

const GenerateImageCaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe('An array of 3-5 unique, engaging, and descriptive captions for the image, suitable for social media platforms like Instagram and Facebook.'),
});
export type GenerateImageCaptionOutput = z.infer<typeof GenerateImageCaptionOutputSchema>;

export async function generateImageCaption(input: GenerateImageCaptionInput): Promise<GenerateImageCaptionOutput> {
  return generateImageCaptionFlow(input);
}

const generateImageCaptionPrompt = ai.definePrompt({
  name: 'generateImageCaptionPrompt',
  input: {schema: GenerateImageCaptionInputSchema},
  output: {schema: GenerateImageCaptionOutputSchema},
  prompt: `You are an AI model that generates engaging and descriptive captions for images, suitable for social media platforms like Instagram and Facebook.

  Generate 3-5 unique captions for the following image. The captions should be varied in style (e.g., some short and punchy, some more descriptive, some including a question to engage the audience).
  {{media url=photoDataUri}}
  `,
});

const generateImageCaptionFlow = ai.defineFlow(
  {
    name: 'generateImageCaptionFlow',
    inputSchema: GenerateImageCaptionInputSchema,
    outputSchema: GenerateImageCaptionOutputSchema,
  },
  async input => {
    const {output} = await generateImageCaptionPrompt(input);
    return output!;
  }
);
