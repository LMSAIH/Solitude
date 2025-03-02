from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_frame")
async def upload_frame(file: UploadFile = File(...)):
  #TODO
  return

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
