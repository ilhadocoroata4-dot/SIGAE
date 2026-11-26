from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # só para desenvolvimento
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/saude")
def saude():
    return {"status": "ok"}
