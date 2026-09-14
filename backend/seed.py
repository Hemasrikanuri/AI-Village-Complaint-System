import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import (
    Base, Village, Department, Category, User, UserRole, Complaint,
    ComplaintStatus, PriorityLevel, ComplaintStatusHistory, OfficerNote, Notification
)
from app.auth import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@gramsetu.in").first():
            print("Database already seeded. Skipping seed execution.")
            return

        print("Seeding database with initial production demo data...")

        # 1. Real Villages List (Exact 11 real villages)
        # Note on Vempa: Vempa is treated as 1 single village record in the villages table.
        # Its sub-hamlets (Komatitippa North and Srirampuram) are supported as optional locality/hamlet address text entries.
        real_villages = [
            Village(name="Anakoderu", district="West Godavari", state="Andhra Pradesh", population=4200, latitude=16.5400, longitude=81.5200),
            Village(name="Annavaram", district="West Godavari", state="Andhra Pradesh", population=3800, latitude=16.5500, longitude=81.5300),
            Village(name="Bethapudi", district="West Godavari", state="Andhra Pradesh", population=5100, latitude=16.5300, longitude=81.5100),
            Village(name="Dirusumarru", district="West Godavari", state="Andhra Pradesh", population=4600, latitude=16.5600, longitude=81.5400),
            Village(name="Komarada", district="West Godavari", state="Andhra Pradesh", population=3900, latitude=16.5200, longitude=81.5000),
            Village(name="Kovvada", district="West Godavari", state="Andhra Pradesh", population=6400, latitude=16.5700, longitude=81.5500),
            Village(name="Narasimhapuram", district="West Godavari", state="Andhra Pradesh", population=5800, latitude=16.5800, longitude=81.5600),
            Village(name="Taderu", district="West Godavari", state="Andhra Pradesh", population=3500, latitude=16.5100, longitude=81.4900),
            Village(name="Tundurru", district="West Godavari", state="Andhra Pradesh", population=7200, latitude=16.5900, longitude=81.5700),
            Village(name="Vempa", district="West Godavari", state="Andhra Pradesh", population=8900, latitude=16.6000, longitude=81.5800),
            Village(name="Yenamadurru", district="West Godavari", state="Andhra Pradesh", population=4900, latitude=16.5000, longitude=81.4800),
        ]
        db.add_all(real_villages)
        db.flush()

        vil_dict = {v.name: v.id for v in real_villages}

        # 2. Departments (10 Comprehensive Panchayati Raj Departments)
        departments = [
            Department(name="Water Supply", code="WATER", description="Drinking water distribution, pipelines, tap connections, and leaks"),
            Department(name="Electricity", code="ELEC", description="Rural electrical grid, street lights, transformers, and power cuts"),
            Department(name="PWD / Roads", code="ROADS", description="Village roads, culverts, drainage channels, and public structures"),
            Department(name="Sanitation & Waste", code="SAN", description="Solid waste collection, drain cleaning, public toilets, and hygiene"),
            Department(name="Health & General", code="HEALTH", description="Public health hazards, mosquito control, and civic amenities"),
            Department(name="Agriculture & Irrigation", code="AGRI", description="Panchayat irrigation canals, borewells, solar pumps, and agricultural support"),
            Department(name="Education & Anganwadi", code="EDU", description="Primary school infrastructure, mid-day meals, and Anganwadi centers"),
            Department(name="Veterinary & Animal Control", code="VET", description="Stray cattle/dog control, rabies vaccination, and livestock care"),
            Department(name="Public Distribution (PDS)", code="PDS", description="Ration shop distribution, pension disbursement, and card services"),
            Department(name="Environment & Forestry", code="ENV", description="Fallen trees, dangerous branches, social forestry, and pollution control"),
        ]
        db.add_all(departments)
        db.flush()

        dept_dict = {d.code: d.id for d in departments}

        # 3. Categories (20 Specific Civic Categories)
        categories = [
            # Water
            Category(name="Water Supply / Pipeline Leak", code="WATER_LEAK", department_id=dept_dict["WATER"], description="Pipe bursts, valve leaks, low water pressure"),
            Category(name="Water Contamination", code="WATER_QUAL", department_id=dept_dict["WATER"], description="Dirty water, foul taste or smell from tap"),
            # Electricity
            Category(name="Power Outage / Line Fault", code="ELEC_OUTAGE", department_id=dept_dict["ELEC"], description="Frequent power cuts, line snapping, transformer fuse burst"),
            Category(name="Street Light Damage", code="ELEC_STREET", department_id=dept_dict["ELEC"], description="Broken street lights, dark streets at night"),
            # Roads
            Category(name="Road Damage / Potholes", code="ROAD_POTHOLE", department_id=dept_dict["ROADS"], description="Deep potholes, caved-in road surface"),
            Category(name="Drainage Overflow", code="ROAD_DRAIN", department_id=dept_dict["ROADS"], description="Clogged main drains, monsoon flooding on road"),
            # Sanitation
            Category(name="Garbage Collection", code="SAN_GARBAGE", department_id=dept_dict["SAN"], description="Uncollected trash, illegal dumping near houses"),
            Category(name="Public Toilet Sanitation", code="SAN_TOILET", department_id=dept_dict["SAN"], description="Unsanitary public toilet conditions"),
            # Health
            Category(name="Stagnant Water / Mosquito Hazard", code="HEALTH_MOSQ", department_id=dept_dict["HEALTH"], description="Mosquito breeding spots, open stagnant pools"),
            Category(name="Public Property Damage / Others", code="GENERAL_OTHER", department_id=dept_dict["HEALTH"], description="Other civic concerns"),
            # Agriculture
            Category(name="Irrigation Canal Blockage", code="AGRI_CANAL", department_id=dept_dict["AGRI"], description="Clogged farm water channels, damaged canal gates"),
            Category(name="Panchayat Agriculture Pump Fault", code="AGRI_PUMP", department_id=dept_dict["AGRI"], description="Broken borewell motor or solar irrigation pump"),
            # Education
            Category(name="School Building & Toilet Maintenance", code="EDU_INFRA", department_id=dept_dict["EDU"], description="Damaged classroom roof, broken boundary wall, school toilet water"),
            Category(name="Anganwadi Supply & Sanitation", code="EDU_ANGANWADI", department_id=dept_dict["EDU"], description="Anganwadi center hygiene, drinking water, child nutrition supplies"),
            # Veterinary
            Category(name="Stray Dog / Cattle Nuisance", code="VET_STRAY", department_id=dept_dict["VET"], description="Rabies risk, aggressive stray dogs, cattle obstructing main road"),
            Category(name="Livestock Healthcare Support", code="VET_CLINIC", department_id=dept_dict["VET"], description="Veterinary doctor availability, cattle disease outbreak report"),
            # PDS
            Category(name="Ration Distribution Grievance", code="PDS_RATION", department_id=dept_dict["PDS"], description="Fair price shop closed during working hours, short weighing, poor grain quality"),
            Category(name="Pension & Ration Card Services", code="PDS_PENSION", department_id=dept_dict["PDS"], description="Delay in pension disbursement, ration card address update"),
            # Environment
            Category(name="Fallen Tree / Branch Danger", code="ENV_TREE", department_id=dept_dict["ENV"], description="Tree branch leaning on power lines, uprooted tree blocking road"),
            Category(name="Illegal Waste & Noise Pollution", code="ENV_POLLUTION", department_id=dept_dict["ENV"], description="Illegal chemical dumping, loud speakers past permitted hours"),
        ]
        db.add_all(categories)
        db.flush()

        cat_dict = {c.code: c.id for c in categories}

        # 4. Users (Admin, Officers, Citizens)
        pwd_admin = get_password_hash("admin123")
        pwd_officer = get_password_hash("officer123")
        pwd_citizen = get_password_hash("citizen123")

        # Admin
        admin = User(name="Sarpanch & Panchayat Admin", email="admin@gramsetu.in", password_hash=pwd_admin, mobile="9988776655", role=UserRole.ADMIN)
        db.add(admin)

        # Citizens tied to new real villages
        citizen1 = User(name="Ramesh Chandra (Citizen)", email="citizen1@gramsetu.in", password_hash=pwd_citizen, mobile="9876543210", role=UserRole.CITIZEN, village_id=vil_dict["Vempa"])
        citizen2 = User(name="Laxmi Devi (Citizen)", email="citizen2@gramsetu.in", password_hash=pwd_citizen, mobile="9876543211", role=UserRole.CITIZEN, village_id=vil_dict["Anakoderu"])
        citizen3 = User(name="Srinivas Rao (Citizen)", email="citizen3@gramsetu.in", password_hash=pwd_citizen, mobile="9876543212", role=UserRole.CITIZEN, village_id=vil_dict["Bethapudi"])
        db.add_all([citizen1, citizen2, citizen3])
        db.flush()

        # Officers tied to new real villages
        officer_water1 = User(name="Rajesh Kumar (Water Officer A)", email="officer.water1@gramsetu.in", password_hash=pwd_officer, mobile="9111111111", role=UserRole.OFFICER, village_id=vil_dict["Vempa"], department_id=dept_dict["WATER"])
        officer_water2 = User(name="Suresh Varma (Water Officer B)", email="officer.water2@gramsetu.in", password_hash=pwd_officer, mobile="9111111112", role=UserRole.OFFICER, village_id=vil_dict["Vempa"], department_id=dept_dict["WATER"])

        officer_elec1 = User(name="Praveen Rao (Electricity Officer A)", email="officer.elec1@gramsetu.in", password_hash=pwd_officer, mobile="9222222221", role=UserRole.OFFICER, village_id=vil_dict["Anakoderu"], department_id=dept_dict["ELEC"])
        officer_elec2 = User(name="Kiran Reddy (Electricity Officer B)", email="officer.elec2@gramsetu.in", password_hash=pwd_officer, mobile="9222222222", role=UserRole.OFFICER, village_id=vil_dict["Anakoderu"], department_id=dept_dict["ELEC"])

        officer_roads1 = User(name="Venkatesh P (Roads Officer)", email="officer.roads1@gramsetu.in", password_hash=pwd_officer, mobile="9333333333", role=UserRole.OFFICER, village_id=vil_dict["Bethapudi"], department_id=dept_dict["ROADS"])
        officer_sanitation1 = User(name="Ramesh Naik (Sanitation Officer)", email="officer.sanitation1@gramsetu.in", password_hash=pwd_officer, mobile="9444444444", role=UserRole.OFFICER, village_id=vil_dict["Vempa"], department_id=dept_dict["SAN"])

        db.add_all([officer_water1, officer_water2, officer_elec1, officer_elec2, officer_roads1, officer_sanitation1])
        db.flush()

        # 5. Demo Complaints tied to new real villages
        now = datetime.utcnow()

        sample_complaints = [
            Complaint(
                reference_id="GS-2026-0001",
                citizen_id=citizen1.id,
                category_id=cat_dict["WATER_LEAK"],
                village_id=vil_dict["Vempa"],
                title="Burst water pipeline near Temple Street in Komatitippa North",
                description="Main drinking water distribution pipe burst near Sri Rama Temple in Komatitippa North hamlet under Vempa.",
                latitude=16.6010,
                longitude=81.5810,
                address_text="Temple Street, Komatitippa North, Vempa",
                priority=PriorityLevel.URGENT,
                status=ComplaintStatus.IN_PROGRESS,
                assigned_officer_id=officer_water1.id,
                ai_confidence=0.96,
                created_at=now - timedelta(hours=12)
            ),
            Complaint(
                reference_id="GS-2026-0002",
                citizen_id=citizen1.id,
                category_id=cat_dict["WATER_QUAL"],
                village_id=vil_dict["Vempa"],
                title="Muddy water coming in Srirampuram tap lines",
                description="Tap water has severe yellow discoloration and muddy residue for past 2 days in Srirampuram hamlet.",
                latitude=16.6020,
                longitude=81.5820,
                address_text="Bazaar Road, Srirampuram, Vempa",
                priority=PriorityLevel.HIGH,
                status=ComplaintStatus.RESOLVED,
                assigned_officer_id=officer_water1.id,
                ai_confidence=0.89,
                created_at=now - timedelta(days=3),
                updated_at=now - timedelta(days=1)
            ),
            Complaint(
                reference_id="GS-2026-0003",
                citizen_id=citizen2.id,
                category_id=cat_dict["ELEC_OUTAGE"],
                village_id=vil_dict["Anakoderu"],
                title="Sparking transformer near Main School",
                description="High voltage transformer near ZP High School emitting heavy sparks and loud popping sound.",
                latitude=16.5410,
                longitude=81.5210,
                address_text="School Road, Anakoderu",
                priority=PriorityLevel.URGENT,
                status=ComplaintStatus.ASSIGNED,
                assigned_officer_id=officer_elec1.id,
                ai_confidence=0.98,
                created_at=now - timedelta(hours=4)
            ),
            Complaint(
                reference_id="GS-2026-0004",
                citizen_id=citizen2.id,
                category_id=cat_dict["ELEC_STREET"],
                village_id=vil_dict["Anakoderu"],
                title="Entire West Street in darkness due to broken lights",
                description="4 consecutive street light poles broken after storm in Anakoderu.",
                latitude=16.5420,
                longitude=81.5220,
                address_text="West Street, Anakoderu",
                priority=PriorityLevel.MEDIUM,
                status=ComplaintStatus.IN_PROGRESS,
                assigned_officer_id=officer_elec1.id,
                ai_confidence=0.88,
                created_at=now - timedelta(hours=36)
            ),
            Complaint(
                reference_id="GS-2026-0005",
                citizen_id=citizen3.id,
                category_id=cat_dict["ROAD_POTHOLE"],
                village_id=vil_dict["Bethapudi"],
                title="Dangerous 2-foot deep pothole on Bus Stop road",
                description="Heavy rain caused a massive road cave-in right next to the main bus shelter in Bethapudi.",
                latitude=16.5310,
                longitude=81.5110,
                address_text="Bus Stand Road, Bethapudi",
                priority=PriorityLevel.HIGH,
                status=ComplaintStatus.ASSIGNED,
                assigned_officer_id=officer_roads1.id,
                ai_confidence=0.92,
                created_at=now - timedelta(hours=18)
            ),
            Complaint(
                reference_id="GS-2026-0006",
                citizen_id=citizen1.id,
                category_id=cat_dict["SAN_GARBAGE"],
                village_id=vil_dict["Vempa"],
                title="Overflowing garbage dump near Vegetable Market",
                description="Community dump bin overflowing with organic waste in Vempa village market yard.",
                latitude=16.6030,
                longitude=81.5830,
                address_text="Market Yard, Vempa",
                priority=PriorityLevel.MEDIUM,
                status=ComplaintStatus.ASSIGNED,
                assigned_officer_id=officer_sanitation1.id,
                ai_confidence=0.86,
                created_at=now - timedelta(hours=8)
            )
        ]

        db.add_all(sample_complaints)
        db.flush()

        # Add Status History & Officer Notes for demo complaints
        c1 = sample_complaints[0]
        db.add(ComplaintStatusHistory(complaint_id=c1.id, status=ComplaintStatus.SUBMITTED, note="Complaint submitted by citizen", changed_by_user_id=citizen1.id, timestamp=now - timedelta(hours=12)))
        db.add(ComplaintStatusHistory(complaint_id=c1.id, status=ComplaintStatus.ASSIGNED, note="Auto-assigned to Water Officer A via AI Load Balancer", changed_by_user_id=admin.id, timestamp=now - timedelta(hours=11)))
        db.add(ComplaintStatusHistory(complaint_id=c1.id, status=ComplaintStatus.IN_PROGRESS, note="Field inspection initiated. Valve closed to halt spill.", changed_by_user_id=officer_water1.id, timestamp=now - timedelta(hours=5)))
        db.add(OfficerNote(complaint_id=c1.id, officer_id=officer_water1.id, note_text="Field team dispatched with 4-inch replacement PVC pipe joint.", created_at=now - timedelta(hours=4)))

        c2 = sample_complaints[1]
        db.add(ComplaintStatusHistory(complaint_id=c2.id, status=ComplaintStatus.SUBMITTED, note="Complaint submitted", changed_by_user_id=citizen1.id, timestamp=now - timedelta(days=3)))
        db.add(ComplaintStatusHistory(complaint_id=c2.id, status=ComplaintStatus.RESOLVED, note="Filter backwashed and pipeline flushed. Clear water restored.", changed_by_user_id=officer_water1.id, timestamp=now - timedelta(days=1)))
        db.add(OfficerNote(complaint_id=c2.id, officer_id=officer_water1.id, note_text="Water turbidity tested at 1.2 NTU. Restored safe supply.", created_at=now - timedelta(days=1)))

        db.commit()
        print("Seed data successfully populated!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
