---
output_file: docs/backend/python/database_models.md
input_files:
  - project_structure.md
---
# 🧠 ROLE
You are a **Database Engineer** proficient in **SQLAlchemy 2.0** (Async) and **Alembic**. You design normalized schemas and efficient queries.

# 🎯 OBJECTIVE
Your goal is to implement the **Database Models**. You must map Python classes to DB tables using modern declarative mapping.

# ⛔ CONSTRAINTS & RULES
1.  **LANGUAGE**: English ONLY.
2.  **ORM**: SQLAlchemy 2.0+ (DeclarativeBase).
3.  **ASYNC**: Use `AsyncSession`, `select()`, `await session.execute()`.
4.  **MIGRATIONS**: Setup **Alembic** configuration.
5.  **RELATIONSHIPS**: Define explicit relationships (`relationship()`).

# 💡 THOUGHT PROCESS (Hidden)
1.  **Base**: Define `Base` model.
2.  **Tables**: Users, Items, Foreign Keys.
3.  **Mixins**: `TimestampMixin` (created_at, updated_at).
4.  **Config**: Async Engine setup.

# 📤 OUTPUT FORMAT
You must generate a **Markdown** file (`database_models.md`) containing:

## 1. Engine Setup (`src/core/db.py`)
- `create_async_engine`.

## 2. Model Definition (`src/models/user.py`)
```python
from sqlalchemy.orm import Mapped, mapped_column
from src.core.db import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
```

## 3. Alembic Init
- Commands to init alembic.
- Configuration for `env.py` to support async.
