from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from processors.ImageProcessor import ImageProcessor
from contextlib import asynccontextmanager

# Initialize image processor globally
image_processor = ImageProcessor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """ Ensures proper startup and shutdown handling """
    print("Starting Image Processor...")
    yield  # Run FastAPI
    print("Stopping Image Processor...")
    image_processor.stop()

app = FastAPI(lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_frame")
async def upload_frame(file: UploadFile = File(...)):
    """ Process uploaded image and return emotion analysis. """
    frame_data = await file.read()
    data = image_processor.process_image(frame_data)

    if not data:
        return {"status": "error", "message": "No face detected"}

    predominant_emotion = data[0]["dominant_emotion"]
    return {"status": "success", "emotion": predominant_emotion}

@app.get("/")
def index():
    return {"message": "Welcome to the Video Processing App!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
