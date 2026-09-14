"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-13 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Villages
    op.create_table(
        'villages',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('district', sa.String(length=100), nullable=False, server_default='Panchayat District'),
        sa.Column('state', sa.String(length=100), nullable=False, server_default='Telangana'),
        sa.Column('population', sa.Integer(), server_default='5000'),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Departments
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('code', sa.String(length=20), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('mobile', sa.String(length=20), nullable=True),
        sa.Column('role', sa.Enum('CITIZEN', 'OFFICER', 'ADMIN', name='userrole'), nullable=False, server_default='CITIZEN'),
        sa.Column('village_id', sa.Integer(), sa.ForeignKey('villages.id'), nullable=True),
        sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Complaints
    op.create_table(
        'complaints',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('reference_id', sa.String(length=30), nullable=False, unique=True),
        sa.Column('citizen_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=False),
        sa.Column('village_id', sa.Integer(), sa.ForeignKey('villages.id'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('photo_url', sa.String(length=255), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('address_text', sa.String(length=255), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='prioritylevel'), nullable=False, server_default='MEDIUM'),
        sa.Column('status', sa.Enum('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', name='complaintstatus'), nullable=False, server_default='SUBMITTED'),
        sa.Column('assigned_officer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('ai_confidence', sa.Float(), server_default='0.85'),
        sa.Column('duplicate_of_id', sa.Integer(), sa.ForeignKey('complaints.id'), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_complaints_reference_id', 'complaints', ['reference_id'])

    # Complaint Status History
    op.create_table(
        'complaint_status_history',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('complaint_id', sa.Integer(), sa.ForeignKey('complaints.id'), nullable=False),
        sa.Column('status', sa.Enum('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', name='complaintstatus'), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('changed_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Officer Notes
    op.create_table(
        'officer_notes',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('complaint_id', sa.Integer(), sa.ForeignKey('complaints.id'), nullable=False),
        sa.Column('officer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('note_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('complaint_id', sa.Integer(), sa.ForeignKey('complaints.id'), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('officer_notes')
    op.drop_table('complaint_status_history')
    op.drop_table('complaints')
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
    op.drop_table('categories')
    op.drop_table('departments')
    op.drop_table('villages')
    op.execute('DROP TYPE userrole')
    op.execute('DROP TYPE prioritylevel')
    op.execute('DROP TYPE complaintstatus')
