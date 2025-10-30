import os
import pytz
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, ContextTypes, filters
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# --- Environment Setup ---
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
API_PREDICT = os.getenv('PREDICT_API', 'http://127.0.0.1:5000/predict')

if not TELEGRAM_TOKEN:
    print("❌ ERROR: TELEGRAM_TOKEN not set in environment variables!")
    exit(1)

# --- Timezone Fix ---
IST = pytz.timezone("Asia/Kolkata")

# --- Image Handler ---
async def handle_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    photo = update.message.photo[-1]
    file = await photo.get_file()
    fpath = 'temp_image.jpg'
    await file.download_to_drive(fpath)

    try:
        with open(fpath, 'rb') as f:
            r = requests.post(API_PREDICT, files={'image': f})

        if r.ok:
            j = r.json()
            label = j.get('label', 'Unknown')
            conf = j.get('confidence', 'N/A')
            remedy_list = j.get('remedy', {}).get('actions', ["No remedy found"])
            remedy_text = "\n".join(f"- {r}" for r in remedy_list)
            text = (
                f"🌾 *Crop Disease Prediction*\n\n"
                f"🩺 Disease: *{label}*\n"
                f"📊 Confidence: *{conf}*\n\n"
                f"🛠 Recommended Actions:\n{remedy_text}"
            )
        else:
            text = f"❌ Prediction failed:\n{r.text}"

    except Exception as e:
        text = f"❌ Error: {e}"

    await update.message.reply_text(text, parse_mode="Markdown")

# --- Main Bot Function ---
def main():
    print("🚀 Starting AgroBuddy Telegram Bot...")
    print(f"🔗 Connecting to API: {API_PREDICT}")

    # Initialize scheduler with IST timezone
    scheduler = AsyncIOScheduler(timezone=IST)

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    # Attach scheduler manually
    app.job_queue.scheduler = scheduler

    app.add_handler(MessageHandler(filters.PHOTO, handle_image))
    print("✅ Bot is live! Send an image to your bot on Telegram.")
    app.run_polling()

if __name__ == "__main__":
    main()
