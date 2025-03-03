from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.apiRoutes import router as APIROUTES
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(APIROUTES, prefix='/v1')

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
