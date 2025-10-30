from flask import Flask, request, jsonify
from flask_cors import CORS   # ✅ Import CORS
from PIL import Image
import io, os, json
from model_utils import predict_disease

app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all routes (so frontend can connect)

@app.route('/')
def home():
    return "🌾 Crop Disease Prediction Chatbot is Running!"

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded!'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file!'}), 400

    try:
        img = Image.open(io.BytesIO(file.read()))
        result = predict_disease(img)

        # Load remedies
        remedies_path = os.path.join(os.path.dirname(__file__), 'remedies.json')
        with open(remedies_path, 'r') as f:
            remedies = json.load(f)

        disease_name = result['disease']
        remedy = remedies.get(disease_name, {"actions": ["No remedy found in database."]})

        return jsonify({
            'label': disease_name,
            'confidence': round(result['confidence'], 2),
            'remedy': remedy
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 👇 Allows connection from frontend (React) or Telegram bot
    app.run(host='0.0.0.0', port=5000, debug=True)
