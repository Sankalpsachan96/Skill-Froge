# ==========================================
# STUDENT SKILLS EXCHANGE - MATCHING ENGINE
# ==========================================

from sb_client import sb


# ==========================================
# DEMO STUDENTS
# Used only when there are not enough
# real Supabase profiles for the prototype.
# ==========================================

DEMO_STUDENTS = [
    {
        "id": 101,
        "name": "Rahul Sharma",
        "role": "Full Stack Developer",
        "skills": ["React", "Node.js", "MongoDB", "JavaScript"],
        "needs": ["Python", "AI/ML"],
        "availability": "weekend",
        "bio": "Full stack developer interested in hackathons and student projects."
    },

    {
        "id": 102,
        "name": "Aman Verma",
        "role": "Frontend Developer",
        "skills": ["React", "HTML", "CSS", "JavaScript"],
        "needs": ["Python"],
        "availability": "weekend",
        "bio": "Frontend developer who loves building modern web interfaces."
    },

    {
        "id": 103,
        "name": "Priya Singh",
        "role": "Backend Developer",
        "skills": ["Python", "Django", "FastAPI", "SQL"],
        "needs": ["React"],
        "availability": "evening",
        "bio": "Backend developer interested in APIs and AI projects."
    },

    {
        "id": 104,
        "name": "Arjun Gupta",
        "role": "JavaScript Developer",
        "skills": ["JavaScript", "Node.js", "Express", "React"],
        "needs": ["Python"],
        "availability": "weekend",
        "bio": "JavaScript developer looking for hackathon collaborations."
    },

    {
        "id": 105,
        "name": "Sneha Patel",
        "role": "UI/UX Designer",
        "skills": ["Figma", "UI Design", "UX Design", "HTML", "CSS"],
        "needs": ["React"],
        "availability": "evening",
        "bio": "UI/UX designer interested in student startups and projects."
    }
]


# ==========================================
# NORMALIZE SKILLS
# ==========================================

def normalize_skills(skills):

    if not skills:
        return []

    if isinstance(skills, str):
        skills = [skills]

    return [
        str(skill).lower().strip()
        for skill in skills
        if str(skill).strip()
    ]


# ==========================================
# CALCULATE SKILL MATCH
# ==========================================

def calculate_match(required_skills, student_skills):

    required = set(
        normalize_skills(required_skills)
    )

    available = set(
        normalize_skills(student_skills)
    )

    if not required:
        return 0, []

    matched = required.intersection(available)

    score = round(
        (len(matched) / len(required)) * 100
    )

    return score, list(matched)


# ==========================================
# GET REAL STUDENTS FROM SUPABASE
# ==========================================

def get_supabase_students():

    try:

        response = (
            sb
            .table("profiles")
            .select(
                "id,auth_id,name,email,role,course,bio,"
                "skills,needs,availability"
            )
            .execute()
        )

        profiles = response.data or []

        students = []

        for profile in profiles:

            students.append({
                "id": profile.get("id"),
                "auth_id": profile.get("auth_id"),
                "name": profile.get("name") or "Student",
                "role": profile.get("role") or profile.get("course") or "Student",
                "skills": profile.get("skills") or [],
                "needs": profile.get("needs") or [],
                "availability": profile.get("availability") or "",
                "bio": profile.get("bio") or ""
            })

        return students

    except Exception as error:

        print(
            "⚠️ Supabase matching error:",
            error
        )

        return []


# ==========================================
# FIND MATCHES
# ==========================================

def find_matches(required_skills, availability=None):

    # Get actual students from Supabase
    real_students = get_supabase_students()

    # Start with real students
    students = real_students.copy()

    # Add demo students if required for prototype
    existing_names = {
        student["name"].lower()
        for student in students
    }

    for demo_student in DEMO_STUDENTS:

        if (
            demo_student["name"].lower()
            not in existing_names
        ):
            students.append(demo_student)

    matches = []

    for student in students:

        score, matched_skills = calculate_match(
            required_skills,
            student.get("skills", [])
        )

        # ----------------------------------
        # Availability bonus
        # ----------------------------------

        if (
            availability
            and student.get("availability")
            and availability.lower().strip()
            == student["availability"].lower().strip()
            and score > 0
        ):

            score = min(
                score + 5,
                100
            )

        matches.append({

            "id": student["id"],

            "auth_id": student.get(
                "auth_id"
            ),

            "name": student["name"],

            "role": student["role"],

            "course": student.get(
                "course",
                ""
            ),

            "skills": student["skills"],

            "needs": student.get(
                "needs",
                []
            ),

            "availability": student[
                "availability"
            ],

            "matched_skills": matched_skills,

            "match_percentage": score,

            "bio": student["bio"]

        })

    # ======================================
    # HIGHEST MATCH FIRST
    # ======================================

    matches.sort(
        key=lambda student:
            student["match_percentage"],
        reverse=True
    )

    return matches