"""drop has_tiles and is_processing

Revision ID: 1cb373794ed3
Revises: 405c242c7461
Create Date: 2026-04-18 18:39:34.685177

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1cb373794ed3'
down_revision: Union[str, Sequence[str], None] = '405c242c7461'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("maps", "is_processing")
    op.drop_column("maps", "has_tiles")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "maps",
        sa.Column("has_tiles", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "maps",
        sa.Column("is_processing", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.execute("""
               UPDATE maps
               SET has_tiles = CASE
                                   WHEN status = 'ready' THEN TRUE
                                   ELSE FALSE
                   END
               """)

    op.execute("""
               UPDATE maps
               SET is_processing = FALSE
               """)
    pass
