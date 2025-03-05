import { onCallGenkit } from 'firebase-functions/https';
import { gemini20Flash, googleAI } from '@genkit-ai/googleai';

import {genkit, z} from "genkit";

import {defineSecret} from "firebase-functions/params";
const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

const ai = genkit({
    plugins: [googleAI()],
    model: gemini20Flash,
});

const InputNutritionSchema = z.array(
    z.object({
        type: z.string(),
        consumed: z.number(),
        goal: z.number(),
    })
);

const AnalyzeSchema = z.object({
    overallScore: z.number(),
    overallDescription: z.string(),
    nutrients: z.array(
        z.object({
            type: z.string(),
            score: z.number(),
            description: z.string(),
        })
    ),
});

const analyzeMealFlow = ai.defineFlow(
    {
      name: "analyzeMeal",
      inputSchema: InputNutritionSchema,
    },
    async (meal) => {
      const {output} = await ai.generate({
          prompt: `
          - Analyze the following meal: ${JSON.stringify(meal, null, 2)}.
          - use formula (consumed / goal) * 5.0 to give a score from 0 to 5.
          - if consumed is greater than goal, score is 5.
          - give a short positive description based on the score. explain the importance of each nutrient.
          - give an overall description in short words, use positive and cheerful attitude.
          `,
          output: {schema: AnalyzeSchema}
      });

      return output;
    }
);

export const analyzeMeal = onCallGenkit({secrets: [apiKey]},analyzeMealFlow);
