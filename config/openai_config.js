import "dotenv/config.js";
import OpenAI from "openai";

const api_key = process.env.OPENAI_API_KEY;

export const tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Generate image",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt":  {
                        "type": "string",
                        "description": "Prompt to use for image generation"
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "Quantity of images to generate"
                    },
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_audio",
            "description": "Give bot answer as an audio file",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt":  {
                        "type": "string",
                        "description": "Prompt to use for audio creation"
                    }
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use. Infer this from the users location.",
                    },
                },
                "required": ["location", "format"],
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_n_day_weather_forecast",
            "description": "Get an N-day weather forecast",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "format": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use. Infer this from the users location.",
                    },
                    "num_days": {
                        "type": "integer",
                        "description": "The number of days to forecast",
                    }
                },
                "required": ["location", "format", "num_days"]
            },
        }
    },
]

export const 
    openai = new OpenAI({
        apiKey: api_key,
    }),
    chat_model = 'gpt-3.5-turbo',
    image_model = 'dall-e-3';
