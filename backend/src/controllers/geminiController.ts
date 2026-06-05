import { Request, Response } from 'express';
import fs from 'fs';
import { uploadToCloudinary } from '../utils/cloudinary';

/**
 * @desc    Analyze food photo and extract structured menu details
 *          Also generates a professional 4K 9:16 food mockup image using Gemini
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
    if (!process.env.NVIDIA_API_KEY) {
      throw new Error('NVIDIA_API_KEY is not set in .env');
    }

    // Read original image as base64
    const fileBytes = fs.readFileSync(imagePath);
    const base64Data = fileBytes.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // Note: Gemini's Imagen model is only available on paid plans, so we cannot use it to 
    // generate a new 4K image on the free tier. Instead, we rely on Cloudinary's powerful 
    // transformation API later to upscale, crop to 9:16, and auto-enhance the original photo.

    // ─── PROMPT: Extract Menu Details ─────────────────────────────────────
    console.log('🤖 Prompt: Extracting menu details with NVIDIA Llama 3.2 Vision...');

    const detailsPrompt = `You are a professional restaurant menu writer and food analyst.
Analyze this food image and output a JSON object with the following fields:
- name: A catchy, appetizing name for the dish.
- description: A mouth-watering, descriptive summary (1-2 sentences).
- category: One of [Starters, Mains, Desserts, Drinks]. Guess based on the image.
- price: A suggested realistic price in INR (e.g. "₹299"). Just return the string.
- calories: Estimated calories (e.g. "450 kcal").
- time: Estimated preparation time (e.g. "15-20 min").
- emoji: A single relevant emoji (e.g. "🍕").
- variants: (Optional) An array of objects [{ name: "Small", price: "₹199" }, { name: "Large", price: "₹399" }]. ONLY include this if the dish typically comes in multiple sizes (like Pizza, Coffee, Fries, etc). Otherwise, leave it out or empty.

Output ONLY raw valid JSON. Do NOT include markdown code blocks like \`\`\`json. Return only the JSON object.`;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not set in .env');
    }

    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: detailsPrompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        max_tokens: 1024,
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('NVIDIA API Error:', err);
      throw new Error('NVIDIA API request failed');
    }

    const aiData = await aiResponse.json();
    let rawText = aiData.choices?.[0]?.message?.content || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('Gemini returned invalid JSON:', rawText);
      res.status(422).json({ message: 'AI returned invalid response format. Please try again.' });
      return;
    }

    console.log('✅ Menu details extracted:', result);

    // Upload the original image to Cloudinary (no forced cropping or weird sharpening)
    console.log('📤 Uploading original image to Cloudinary...');
    const cloudinaryUrl = await uploadToCloudinary(imagePath);
    
    // Attach the generated image URL to the result
    result.imageUrl = cloudinaryUrl;

    // Clean up the local temp file
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.json(result);

  } catch (error: any) {
    console.error('Gemini Analysis Error:', error.message || error);
    // Clean up temp file on error
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.status(500).json({ message: error.message || 'Failed to analyze image' });
  }
};
