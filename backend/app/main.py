from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.shared.config import CORS_ORIGINS
from app.shared.database import init_db
from app.features.spend_analyzer.services.seed_dummy import seed_dummy_if_empty
from app.shared.routers import health
from app.features.spend_analyzer.routers import transactions, analytics

app = FastAPI(title="FinanceOS API", description="FinanceOS backend — feature routers are mounted from app.features.*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    seed_dummy_if_empty()


app.include_router(health.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
