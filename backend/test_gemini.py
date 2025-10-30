from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ No API key found in .env file.")
    exit()

try:
    genai.configure(api_key=api_key)
    # ✅ Use this model name instead
    model = genai.GenerativeModel("gemini-1.5-flash")

    response = model.generate_content("Hello Gemini! Say hi to the world in one line.")
    print("✅ Gemini API is working!\n")
    print("🤖 Response:", response.text)

except Exception as e:
    print("❌ Error connecting to Gemini API:\n", e)
