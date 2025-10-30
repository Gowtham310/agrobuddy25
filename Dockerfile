FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY . /app
ENV FLASK_APP=backend/app.py
CMD ["python", "backend/app.py"]