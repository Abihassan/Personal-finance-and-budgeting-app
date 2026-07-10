"""
Shared SQLAlchemy declarative base.
Kept in its own file so models can import Base without touching database.py,
which would create a circular import:
  database.py → app.models → database.py  (BROKEN)
  database.py → app.models → app.base     (OK)
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
