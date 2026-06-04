import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// We will initialize the client inside the route to ensure process.env is fully loaded by dotenv

/**
 * @desc    Analyze food photo and extract structured menu details
 * @route   POST /api/menu/analyze-food
 * @access  Private
 */
export const analyzeFood = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'No image uploaded' });
    return;
  }

  const imagePath = req.file.path;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in .env');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Read image as base64
    const fileBytes = fs.readFileSync(imagePath);
    const base64Data = fileBytes.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const prompt = `You are a professional restaurant menu writer and food analyst.
Analyze this food image and output a JSON object with the following fields:
- name: A catchy, appetizing name for the dish.
- description: A mouth-watering, descriptive summary (1-2 sentences).
- category: One of [Starters, Mains, Desserts, Drinks]. Guess based on the image.
- price: A suggested realistic price in INR (e.g. "₹299"). Just return the string.
- calories: Estimated calories (e.g. "450 kcal").
- time: Estimated preparation time (e.g. "15-20 min").
- emoji: A single relevant emoji (e.g. "🍕").

Output ONLY raw valid JSON, no markdown formatting blocks, no \`\`\`json.`;

    console.log('🤖 Sending image to Gemini 2.5 Flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
      }
    });

    let rawText = response.text || '{}';
    // Clean up potential markdown formatting
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(rawText);
    console.log('✅ Gemini Analysis Complete:', result);

    // Return the relative URL so the frontend can append its dynamic host (fixes localhost vs phone IP issue)
    const fileUrl = `/uploads/models/${req.file.filename}`;

    // Add the permanent image URL to the result
    result.imageUrl = fileUrl;

    res.json(result);

  } catch (error: any) {
    console.error('Gemini Analysis Error:', error.message || error);
    res.status(500).json({ message: error.message || 'Failed to analyze image' });
  }
};
