import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import Base, Village, Department, User, UserRole
from app.auth import get_password_hash

def sync_expanded_officers():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Get maps of villages and departments
        villages = db.query(Village).all()
        departments = db.query(Department).all()

        if not villages or not departments:
            print("Villages or departments missing. Run full seed first.")
            return

        vil_dict = {v.name: v.id for v in villages}
        dept_dict = {d.code: d.id for d in departments}

        pwd_officer = get_password_hash("officer123")

        officers_data = [
            # Water Department (4 officers)
            {"name": "Rajesh Kumar (Water Officer A)", "email": "officer.water1@gramsetu.in", "mobile": "9111111111", "village": "Vempa", "dept": "WATER"},
            {"name": "Suresh Varma (Water Officer B)", "email": "officer.water2@gramsetu.in", "mobile": "9111111112", "village": "Vempa", "dept": "WATER"},
            {"name": "Naresh Reddy (Water Officer C)", "email": "officer.water3@gramsetu.in", "mobile": "9111111113", "village": "Annavaram", "dept": "WATER"},
            {"name": "K. Subbarao (Water Officer D)", "email": "officer.water4@gramsetu.in", "mobile": "9111111114", "village": "Bethapudi", "dept": "WATER"},

            # Electricity Department (4 officers)
            {"name": "Praveen Rao (Electricity Officer A)", "email": "officer.elec1@gramsetu.in", "mobile": "9222222221", "village": "Anakoderu", "dept": "ELEC"},
            {"name": "Kiran Reddy (Electricity Officer B)", "email": "officer.elec2@gramsetu.in", "mobile": "9222222222", "village": "Anakoderu", "dept": "ELEC"},
            {"name": "M. Jagadeesh (Electricity Officer C)", "email": "officer.elec3@gramsetu.in", "mobile": "9222222223", "village": "Kovvada", "dept": "ELEC"},
            {"name": "D. Ramana (Electricity Officer D)", "email": "officer.elec4@gramsetu.in", "mobile": "9222222224", "village": "Tundurru", "dept": "ELEC"},

            # Roads Department (4 officers)
            {"name": "Venkatesh P (Roads Officer A)", "email": "officer.roads1@gramsetu.in", "mobile": "9333333333", "village": "Bethapudi", "dept": "ROADS"},
            {"name": "Mahesh Kumar (Roads Officer B)", "email": "officer.roads2@gramsetu.in", "mobile": "9333333334", "village": "Narasimhapuram", "dept": "ROADS"},
            {"name": "Srinivas Rao (Roads Officer C)", "email": "officer.roads3@gramsetu.in", "mobile": "9333333335", "village": "Dirusumarru", "dept": "ROADS"},
            {"name": "Ch. Apparao (Roads Officer D)", "email": "officer.roads4@gramsetu.in", "mobile": "9333333336", "village": "Komarada", "dept": "ROADS"},

            # Sanitation Department (4 officers)
            {"name": "Ramesh Naik (Sanitation Officer A)", "email": "officer.sanitation1@gramsetu.in", "mobile": "9444444444", "village": "Vempa", "dept": "SAN"},
            {"name": "Lakshmi K (Sanitation Officer B)", "email": "officer.sanitation2@gramsetu.in", "mobile": "9444444445", "village": "Annavaram", "dept": "SAN"},
            {"name": "G. Prasad (Sanitation Officer C)", "email": "officer.sanitation3@gramsetu.in", "mobile": "9444444446", "village": "Taderu", "dept": "SAN"},
            {"name": "B. Satish (Sanitation Officer D)", "email": "officer.sanitation4@gramsetu.in", "mobile": "9444444447", "village": "Yenamadurru", "dept": "SAN"},

            # Health Department (3 officers)
            {"name": "Dr. Anitha Roy (Health Officer A)", "email": "officer.health1@gramsetu.in", "mobile": "9555555555", "village": "Kovvada", "dept": "HEALTH"},
            {"name": "Dr. B. Nagesh (Health Officer B)", "email": "officer.health2@gramsetu.in", "mobile": "9555555556", "village": "Yenamadurru", "dept": "HEALTH"},
            {"name": "Dr. Sunitha P (Health Officer C)", "email": "officer.health3@gramsetu.in", "mobile": "9555555557", "village": "Anakoderu", "dept": "HEALTH"},

            # Agriculture Department (3 officers)
            {"name": "Nageswara Rao (Agriculture Officer A)", "email": "officer.agri1@gramsetu.in", "mobile": "9666666666", "village": "Dirusumarru", "dept": "AGRI"},
            {"name": "K. Veerabhadra (Agriculture Officer B)", "email": "officer.agri2@gramsetu.in", "mobile": "9666666667", "village": "Bethapudi", "dept": "AGRI"},
            {"name": "T. Bhaskar (Agriculture Officer C)", "email": "officer.agri3@gramsetu.in", "mobile": "9666666668", "village": "Vempa", "dept": "AGRI"},

            # Education Department (3 officers)
            {"name": "Mary Kumari (Education & Anganwadi Officer A)", "email": "officer.edu1@gramsetu.in", "mobile": "9777777777", "village": "Komarada", "dept": "EDU"},
            {"name": "P. Ratnakar (Education Officer B)", "email": "officer.edu2@gramsetu.in", "mobile": "9777777778", "village": "Narasimhapuram", "dept": "EDU"},
            {"name": "V. Shanthi (Education Officer C)", "email": "officer.edu3@gramsetu.in", "mobile": "9777777779", "village": "Annavaram", "dept": "EDU"},

            # Veterinary Department (3 officers)
            {"name": "Dr. Raghava Raju (Veterinary Officer A)", "email": "officer.vet1@gramsetu.in", "mobile": "9888888888", "village": "Taderu", "dept": "VET"},
            {"name": "Dr. S. Koteswara (Veterinary Officer B)", "email": "officer.vet2@gramsetu.in", "mobile": "9888888889", "village": "Dirusumarru", "dept": "VET"},
            {"name": "Dr. M. Syamala (Veterinary Officer C)", "email": "officer.vet3@gramsetu.in", "mobile": "9888888890", "village": "Kovvada", "dept": "VET"},

            # Public Distribution System (3 officers)
            {"name": "Satyanarayana M (PDS & Pension Officer A)", "email": "officer.pds1@gramsetu.in", "mobile": "9999999991", "village": "Tundurru", "dept": "PDS"},
            {"name": "B. Rambabu (PDS Officer B)", "email": "officer.pds2@gramsetu.in", "mobile": "9999999993", "village": "Vempa", "dept": "PDS"},
            {"name": "K. Venkayya (PDS Officer C)", "email": "officer.pds3@gramsetu.in", "mobile": "9999999994", "village": "Bethapudi", "dept": "PDS"},

            # Environment & Forestry (3 officers)
            {"name": "Srinivas Varma (Environment & Forestry Officer A)", "email": "officer.env1@gramsetu.in", "mobile": "9999999992", "village": "Yenamadurru", "dept": "ENV"},
            {"name": "A. Vijay Kumar (Environment Officer B)", "email": "officer.env2@gramsetu.in", "mobile": "9999999995", "village": "Komarada", "dept": "ENV"},
            {"name": "R. Govind (Environment Officer C)", "email": "officer.env3@gramsetu.in", "mobile": "9999999996", "village": "Anakoderu", "dept": "ENV"},
        ]

        added_count = 0
        for item in officers_data:
            existing = db.query(User).filter(User.email == item["email"]).first()
            if not existing:
                vil_id = vil_dict.get(item["village"])
                dept_id = dept_dict.get(item["dept"])
                user = User(
                    name=item["name"],
                    email=item["email"],
                    password_hash=pwd_officer,
                    mobile=item["mobile"],
                    role=UserRole.OFFICER,
                    village_id=vil_id,
                    department_id=dept_id
                )
                db.add(user)
                added_count += 1

        db.commit()
        total_officers = db.query(User).filter(User.role == UserRole.OFFICER).count()
        print(f"Successfully added {added_count} new field officers! Total active field officers: {total_officers}")
    except Exception as e:
        db.rollback()
        print(f"Error syncing officers: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_expanded_officers()
