import random

def predict_disease(image):
    diseases = ["Late Blight", "Leaf Spot", "Early Blight"]
    disease = random.choice(diseases)
    confidence = random.uniform(0.8, 0.99)
    return {"disease": disease, "confidence": confidence}
