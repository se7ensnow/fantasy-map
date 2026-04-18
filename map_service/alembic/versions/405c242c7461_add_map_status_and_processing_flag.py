"""add map status and processing flag

Revision ID: 405c242c7461
Revises: 
Create Date: 2026-04-18 15:10:13.122734

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "405c242c7461"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "maps",
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
    )
    op.add_column(
        "maps",
        sa.Column("is_processing", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.execute("""
        UPDATE maps
        SET status = CASE
            WHEN has_tiles = TRUE THEN 'ready'
            ELSE 'draft'
        END
    """)

    op.execute("""
        UPDATE maps
        SET is_processing = FALSE
    """)

    op.create_check_constraint(
        "maps_status_check",
        "maps",
        "status IN ('draft', 'ready')",
    )


def downgrade() -> None:
    op.drop_constraint("maps_status_check", "maps", type_="check")
    op.drop_column("maps", "is_processing")
    op.drop_column("maps", "status")