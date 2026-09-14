"""add pending_village_name to users and officer resolution escalation fields to complaints

Revision ID: 002_add_pending_village_and_officer_features
Revises: 001_initial_schema
Create Date: 2026-09-13 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_pending_village_officer'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('users', sa.Column('pending_village_name', sa.String(length=100), nullable=True))
    op.add_column('complaints', sa.Column('resolution_proof_url', sa.String(length=255), nullable=True))
    op.add_column('complaints', sa.Column('is_escalated', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('complaints', sa.Column('escalation_reason', sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column('complaints', 'escalation_reason')
    op.drop_column('complaints', 'is_escalated')
    op.drop_column('complaints', 'resolution_proof_url')
    op.drop_column('users', 'pending_village_name')
