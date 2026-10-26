from sqlalchemy import text

from app.api import api
from app.extensions import db, limiter


@api.get("/health")
@limiter.exempt
def health():
    try:
        db.session.execute(text("SELECT 1"))
        database = "ok"
        status = 200
    except Exception:
        db.session.rollback()
        database = "unavailable"
        status = 503
    return {"status": "ok" if status == 200 else "degraded", "database": database}, status
