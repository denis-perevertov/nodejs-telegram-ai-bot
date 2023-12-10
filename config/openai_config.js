import "dotenv/config.js";
import OpenAI from "openai";

const api_key = process.env.OPENAI_API_KEY;

export const 
    openai = new OpenAI({
        apiKey: api_key,
    }),
    ai_model = 'gpt-3.5-turbo'
