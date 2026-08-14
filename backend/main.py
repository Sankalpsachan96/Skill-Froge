from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import (
    analyze_requirement,
    generate_skill_question,
    evaluate_skill_answer,
    calculate_skill_verification
)
from matching import find_matches
from database import initialize_database
from database import get_connection
from sb_client import sb


app = FastAPI(
    title="Student Skills Exchange API",
    version="1.0.0"
)
initialize_database()


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request body structure
class RequirementRequest(BaseModel):
    requirement: str


# Home / health check
@app.get("/")
def home():
    return {
        "message": "Student Skills Exchange API is running 🚀"
    }


# AI requirement analysis
@app.post("/api/analyze-requirement")
def analyze(request: RequirementRequest):

    requirement = request.requirement.strip()

    if not requirement:
        raise HTTPException(
            status_code=400,
            detail="Requirement cannot be empty."
        )

    try:

        result = analyze_requirement(requirement)

        return {
            "success": True,
            "requirement": requirement,
            "analysis": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.post("/api/find-matches")
def get_matches(request: RequirementRequest):

    requirement = request.requirement.strip()

    if not requirement:
        raise HTTPException(
            status_code=400,
            detail="Requirement cannot be empty."
        )

    try:

        # First let AI understand the requirement
        analysis = analyze_requirement(
            requirement
        )

        required_skills = analysis.get(
            "skills",
            []
        )

        availability = analysis.get(
            "availability",
            ""
        )

        # Find matching students
        matches = find_matches(
            required_skills,
            availability
        )

        # Only show useful matches
        useful_matches = [
            student
            for student in matches
            if student["match_percentage"] > 0
        ]

        return {
            "success": True,
            "requirement": requirement,
            "analysis": analysis,
            "matches": useful_matches[:5]
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )   
@app.post("/api/connect")
def send_connection_request(receiver_id: int):

    connection = get_connection()
    cursor = connection.cursor()

    # Prototype sender
    sender_id = 999

    # Check whether request already exists
    cursor.execute("""
        SELECT id
        FROM connection_requests
        WHERE sender_id = ?
        AND receiver_id = ?
    """, (sender_id, receiver_id))

    existing_request = cursor.fetchone()

    if existing_request:
        connection.close()

        return {
            "success": False,
            "message": "Connection request already sent."
        }

    # Create new request
    cursor.execute("""
        INSERT INTO connection_requests
        (sender_id, receiver_id, status)
        VALUES (?, ?, 'pending')
    """, (sender_id, receiver_id))

    connection.commit()
    connection.close()

    return {
        "success": True,
        "message": "Connection request sent successfully."
    }    
# ================= CONNECTION REQUESTS =================

@app.get("/api/requests")
def get_connection_requests():

    connection = get_connection()
    cursor = connection.cursor()

    current_user_id = 999

    cursor.execute("""
        SELECT
            id,
            sender_id,
            receiver_id,
            status,
            created_at
        FROM connection_requests
        WHERE receiver_id = ?
        AND status = 'pending'
        ORDER BY id DESC
    """, (current_user_id,))

    requests = cursor.fetchall()

    connection.close()

    # Prototype student data
    student_map = {
        1: {
            "id": 1,
            "name": "Rahul Sharma",
            "role": "Backend Developer",
            "skills": ["Python", "Django", "FastAPI"],
            "availability": "Evening",
            "bio": "Backend developer interested in AI and web projects."
        },

        2: {
            "id": 2,
            "name": "Priya Verma",
            "role": "AI/ML Developer",
            "skills": ["Python", "AI/ML", "Git"],
            "availability": "Evening",
            "bio": "AI/ML student interested in practical projects."
        },

        3: {
            "id": 3,
            "name": "Aman Gupta",
            "role": "Frontend Developer",
            "skills": ["JavaScript", "HTML", "CSS"],
            "availability": "Weekend",
            "bio": "Frontend developer interested in web development."
        }
    }

    result = []

    for request in requests:

        sender = student_map.get(
            request["sender_id"]
        )

        if not sender:
            continue

        result.append({
            "request_id": request["id"],
            "student_id": sender["id"],
            "name": sender["name"],
            "role": sender["role"],
            "skills": sender["skills"],
            "availability": sender["availability"],
            "bio": sender["bio"],
            "status": request["status"]
        })

    return {
        "success": True,
        "requests": result
    }


# ================= ACCEPT REQUEST =================

@app.post("/api/requests/{request_id}/accept")
def accept_connection_request(request_id: int):

    connection = get_connection()
    cursor = connection.cursor()

    current_user_id = 999

    cursor.execute("""
        UPDATE connection_requests
        SET status = 'accepted'
        WHERE id = ?
        AND receiver_id = ?
        AND status = 'pending'
    """, (
        request_id,
        current_user_id
    ))

    connection.commit()

    updated = cursor.rowcount

    connection.close()

    if updated == 0:

        raise HTTPException(
            status_code=404,
            detail="Request not found."
        )

    return {
        "success": True,
        "message": "Connection accepted."
    }


# ================= REJECT REQUEST =================

@app.post("/api/requests/{request_id}/reject")
def reject_connection_request(request_id: int):

    connection = get_connection()
    cursor = connection.cursor()

    current_user_id = 999

    cursor.execute("""
        UPDATE connection_requests
        SET status = 'rejected'
        WHERE id = ?
        AND receiver_id = ?
        AND status = 'pending'
    """, (
        request_id,
        current_user_id
    ))

    connection.commit()

    updated = cursor.rowcount

    connection.close()

    if updated == 0:

        raise HTTPException(
            status_code=404,
            detail="Request not found."
        )

    return {
        "success": True,
        "message": "Connection rejected."
    }
@app.post("/api/demo-request")
def create_demo_request():

    connection = get_connection()
    cursor = connection.cursor()

    # Prototype:
    # Rahul (1) is sending a request to current user (999)
    sender_id = 1
    receiver_id = 999

    cursor.execute("""
        SELECT id
        FROM connection_requests
        WHERE sender_id = ?
        AND receiver_id = ?
        AND status = 'pending'
    """, (sender_id, receiver_id))

    existing = cursor.fetchone()

    if existing:
        connection.close()

        return {
            "success": False,
            "message": "Demo request already exists."
        }

    cursor.execute("""
        INSERT INTO connection_requests
        (sender_id, receiver_id, status)
        VALUES (?, ?, 'pending')
    """, (
        sender_id,
        receiver_id
    ))

    connection.commit()

    request_id = cursor.lastrowid

    connection.close()

    return {
        "success": True,
        "request_id": request_id,
        "message": "Demo connection request created."
    }
# ================= CHAT =================

from pydantic import BaseModel


class MessageRequest(BaseModel):
    sender_id: int
    receiver_id: int
    message: str


# SEND MESSAGE
@app.post("/api/messages")
def send_message(data: MessageRequest):

    message = data.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO messages
        (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
    """, (
        data.sender_id,
        data.receiver_id,
        message
    ))

    connection.commit()

    message_id = cursor.lastrowid

    connection.close()

    return {
        "success": True,
        "message_id": message_id,
        "message": "Message sent successfully."
    }


# GET CHAT
@app.get("/api/messages/{student_id}")
def get_messages(student_id: int):

    current_user_id = 999

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            sender_id,
            receiver_id,
            message,
            created_at
        FROM messages
        WHERE
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
        ORDER BY id ASC
    """, (
        current_user_id,
        student_id,
        student_id,
        current_user_id
    ))

    messages = cursor.fetchall()

    connection.close()

    return {
        "success": True,
        "messages": [
            dict(message)
            for message in messages
        ]
    }
# ============================================================
# 🤖 AI SKILL VERIFICATION
# ============================================================

class SkillVerificationStartRequest(BaseModel):
    skill: str
    difficulty: str = "Basic"
    previous_questions: list[str] = []


class SkillVerificationAnswerRequest(BaseModel):
    skill: str
    question: str
    options: list[str]
    correct_answer: int
    student_answer: int
    difficulty: str = "Basic"


class SkillVerificationFinalRequest(BaseModel):
    skill: str
    answers: list


# ============================================================
# START AI VERIFICATION
# ============================================================

@app.post("/api/skill-verification/start")
def start_skill_verification(
    request: SkillVerificationStartRequest
):

    skill = request.skill.strip()

    if not skill:

        raise HTTPException(
            status_code=400,
            detail="Skill cannot be empty."
        )

    try:

        question = generate_skill_question(
            skill=skill,
            difficulty=request.difficulty,
            previous_questions=request.previous_questions
        )

        if "error" in question:

            raise HTTPException(
                status_code=500,
                detail=question["error"]
            )

        return {

            "success": True,

            "question": question

        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Skill verification error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# EVALUATE ONE ANSWER
# ============================================================

@app.post("/api/skill-verification/answer")
def answer_skill_verification(
    request: SkillVerificationAnswerRequest
):

    try:

        result = evaluate_skill_answer(

            skill=request.skill,

            question=request.question,

            options=request.options,

            correct_answer=request.correct_answer,

            student_answer=request.student_answer,

            difficulty=request.difficulty

        )

        if "error" in result:

            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )

        return {

            "success": True,

            "evaluation": result

        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "Answer evaluation error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# FINAL AI VERIFICATION
# ============================================================

@app.post("/api/skill-verification/final")
def final_skill_verification(
    request: SkillVerificationFinalRequest
):

    if not request.skill.strip():

        raise HTTPException(
            status_code=400,
            detail="Skill cannot be empty."
        )


    if not request.answers:

        raise HTTPException(
            status_code=400,
            detail="No verification answers provided."
        )


    try:

        result = calculate_skill_verification(

            skill=request.skill,

            answers=request.answers

        )


        if "error" in result:

            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )


        return {

            "success": True,

            "verification": result

        }


    except HTTPException:

        raise

    except Exception as e:

        print(
            "Final verification error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    # ============================================================
# GET CURRENT STUDENT PROFILE
# ============================================================

@app.get("/api/profile/{email}")
def get_student_profile(email: str):

    try:

        response = (
            sb.table("profiles")
            .select(
                "id,auth_id,name,email,role,course,bio,skills,needs,availability"
            )
            .eq("email", email)
            .single()
            .execute()
        )

        profile = response.data

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        return {
            "success": True,
            "profile": profile
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "Profile fetch error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
# ============================================================
# MUTUAL SKILL EXCHANGE
# ============================================================

class ExchangeRequest(BaseModel):
    email: str
    skills: list[str]
    needs: list[str]


@app.post("/api/mutual-exchange")
def mutual_exchange(request: ExchangeRequest):

    my_skills = [
        skill.strip().lower()
        for skill in request.skills
        if skill.strip()
    ]

    my_needs = [
        skill.strip().lower()
        for skill in request.needs
        if skill.strip()
    ]

    if not my_skills:
        raise HTTPException(
            status_code=400,
            detail="Please add skills you can teach."
        )

    if not my_needs:
        raise HTTPException(
            status_code=400,
            detail="Please add skills you want to learn."
        )

    try:

        # ----------------------------------------------------
        # Save current user's skills and learning needs
        # ----------------------------------------------------

        sb.table("profiles").update({
            "skills": request.skills,
            "needs": request.needs
        }).eq(
            "email",
            request.email
        ).execute()


        # ----------------------------------------------------
        # Get all other student profiles
        # ----------------------------------------------------

        response = (
            sb.table("profiles")
            .select(
                "id,auth_id,name,email,role,course,bio,skills,needs,availability"
            )
            .neq(
                "email",
                request.email
            )
            .execute()
        )

        students = response.data or []

        matches = []


        # ----------------------------------------------------
        # Calculate mutual matches
        # ----------------------------------------------------

        for student in students:

            student_skills = [
                str(skill).strip().lower()
                for skill in (student.get("skills") or [])
            ]

            student_needs = [
                str(skill).strip().lower()
                for skill in (student.get("needs") or [])
            ]


            # What THEY can teach YOU
            teach_match = [
                skill
                for skill in my_needs
                if skill in student_skills
            ]


            # What YOU can teach THEM
            learn_match = [
                skill
                for skill in my_skills
                if skill in student_needs
            ]


            # No mutual match
            if not teach_match and not learn_match:
                continue


            # ------------------------------------------------
            # 50% = what they can teach you
            # 50% = what you can teach them
            # ------------------------------------------------

            teach_score = (
                len(teach_match) / len(my_needs)
            ) * 50


            learn_score = (
                len(learn_match) / len(my_skills)
            ) * 50


            score = round(
                teach_score + learn_score
            )


            matches.append({
                "id": student["id"],
                "name": student.get(
                    "name",
                    "Student"
                ),
                "email": student.get(
                    "email",
                    ""
                ),
                "role": student.get(
                    "role",
                    "Student"
                ),
                "course": student.get(
                    "course",
                    ""
                ),
                "bio": student.get(
                    "bio",
                    ""
                ),
                "skills": student.get(
                    "skills"
                ) or [],
                "needs": student.get(
                    "needs"
                ) or [],
                "availability": student.get(
                    "availability",
                    ""
                ),

                # Skills they can teach me
                "can_teach_you": teach_match,

                # Skills I can teach them
                "you_can_teach_them": learn_match,

                # Final match percentage
                "match_percentage": score
            })


        # ----------------------------------------------------
        # Highest match first
        # ----------------------------------------------------

        matches.sort(
            key=lambda x: x["match_percentage"],
            reverse=True
        )


        return {
            "success": True,
            "matches": matches[:5]
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CONNECTION REQUEST
# ============================================================

class ConnectionRequest(BaseModel):
    sender_email: str
    receiver_email: str


@app.post("/api/connection-request")
def send_connection_request(
    request: ConnectionRequest
):

    try:

        # ----------------------------------------------------
        # Find sender
        # ----------------------------------------------------

        sender_response = (
            sb.table("profiles")
            .select(
                "id,name,email"
            )
            .eq(
                "email",
                request.sender_email
            )
            .single()
            .execute()
        )

        sender = sender_response.data


        if not sender:

            raise HTTPException(
                status_code=404,
                detail="Sender profile not found."
            )


        # ----------------------------------------------------
        # Find receiver
        # ----------------------------------------------------

        receiver_response = (
            sb.table("profiles")
            .select(
                "id,name,email"
            )
            .eq(
                "email",
                request.receiver_email
            )
            .single()
            .execute()
        )

        receiver = receiver_response.data


        if not receiver:

            raise HTTPException(
                status_code=404,
                detail="Receiver profile not found."
            )


        # ----------------------------------------------------
        # Prevent self connection
        # ----------------------------------------------------

        if sender["id"] == receiver["id"]:

            raise HTTPException(
                status_code=400,
                detail="You cannot connect with yourself."
            )


        # ----------------------------------------------------
        # Check if request already exists
        # ----------------------------------------------------

        existing_response = (
            sb.table("connection_requests")
            .select(
                "id,status"
            )
            .eq(
                "sender_id",
                sender["id"]
            )
            .eq(
                "receiver_id",
                receiver["id"]
            )
            .execute()
        )

        existing = existing_response.data or []


        if existing:

            existing_request = existing[0]

            return {
                "success": False,
                "message": (
                    "Connection request already exists."
                ),
                "status": existing_request["status"]
            }


        # ----------------------------------------------------
        # Insert new connection request
        # ----------------------------------------------------

        result = (
            sb.table("connection_requests")
            .insert({
                "sender_id": sender["id"],
                "receiver_id": receiver["id"],
                "status": "pending"
            })
            .execute()
        )


        return {
            "success": True,
            "message": (
                f"Connection request sent to "
                f"{receiver['name']}."
            ),
            "status": "pending",
            "request": result.data
        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )