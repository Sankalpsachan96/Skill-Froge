/* ============================================================
   STUDENT SKILLS EXCHANGE
   dashboard.js
   Clean single-version
   ============================================================ */


/* ============================================================
   GLOBAL CONFIG
   ============================================================ */

const API_BASE =
    "http://127.0.0.1:8000";


let currentStudentProfile = null;

window.latestMutualMatches = [];



/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function getProfile() {

    try {

        return JSON.parse(
            localStorage.getItem("studentProfile")
        ) || {};

    } catch (error) {

        console.error(
            "Profile JSON error:",
            error
        );

        return {};

    }

}


function saveProfile(profile) {

    localStorage.setItem(
        "studentProfile",
        JSON.stringify(profile)
    );

}


function normalizeArray(value) {

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);

    }

    return [];

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}

function escapeVerificationText(value) {

    return escapeHTML(value);

}


function getFullName(profile) {

    if (profile.name) {
        return profile.name;
    }

    return (
        `${profile.firstName || ""} ` +
        `${profile.lastName || ""}`
    ).trim() || "Student";

}


function getInitials(profile) {

    const name =
        getFullName(profile);

    return name
        .split(" ")
        .filter(Boolean)
        .map(word => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();

}



/* ============================================================
   INITIAL PROFILE LOAD
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedProfile =
            localStorage.getItem(
                "studentProfile"
            );


        if (!savedProfile) {

            window.location.href =
                "signup.html";

            return;

        }


        currentStudentProfile =
            getProfile();


        initializeDashboard();


    }
);



/* ============================================================
   INITIALIZE DASHBOARD
   ============================================================ */

async function initializeDashboard() {

    console.log(
        "🚀 SkillForge dashboard initializing..."
    );


    // ========================================================
    // BASIC DASHBOARD
    // ========================================================

    renderProfile();

    renderSkills();

    updateExchangeSection();

    loadDemoMatches();

    setupLogout();

    setupOutsideModalClose();


    // ========================================================
    // CONNECTION DATA
    // ========================================================

    loadConnectedStudents();


    // ========================================================
    // SYNC PROFILE
    // ========================================================

    await syncProfileFromSupabase();


    // ========================================================
    // VERIFICATION CARD
    // ========================================================

    updateVerificationCard();


    // ========================================================
    // NEW USER AI VERIFICATION
    // ========================================================

    await handleVerificationGate();


    console.log(
        "✅ SkillForge dashboard initialized."
    );

}

// ============================================================
// 🔐 SKILLFORGE VERIFICATION GATE
// ============================================================

async function handleVerificationGate() {

    console.log(
        "🔐 Checking SkillForge verification status..."
    );


    // ========================================================
    // READ VERIFICATION STATE
    // ========================================================

    let verificationState = null;


    try {

        const saved =
            localStorage.getItem(
                "skillVerificationState"
            );


        if (saved) {

            verificationState =
                JSON.parse(saved);

        }

    }

    catch (error) {

        console.error(
            "Verification state error:",
            error
        );

    }


    // ========================================================
    // CHECK EXISTING VERIFIED RESULT
    // ========================================================

    const savedResult =
        localStorage.getItem(
            "skillVerification"
        );


    if (savedResult) {

        try {

            const result =
                JSON.parse(
                    savedResult
                );


            if (
                result &&
                result.verified === true
            ) {

                console.log(
                    "✅ Student already verified."
                );


                unlockStudentFeatures();


                return;

            }

        }

        catch (error) {

            console.error(
                "Saved verification result error:",
                error
            );

        }

    }


    // ========================================================
    // CHECK NEW USER FLAG
    // ========================================================

    const autoStart =
        localStorage.getItem(
            "autoStartSkillVerification"
        );


    if (
        autoStart !== "true"
    ) {

        console.log(
            "ℹ️ No automatic verification required."
        );


        return;

    }


    // ========================================================
    // GET PROFILE
    // ========================================================

    const profile =
        getProfile();


    const skills =
        Array.isArray(
            profile.skills
        )
            ? profile.skills
            : [];


    if (!skills.length) {

        console.warn(
            "⚠️ No skills found for verification."
        );


        return;

    }


    // ========================================================
    // DETERMINE SKILL
    // ========================================================

    let skill =
        localStorage.getItem(
            "verificationSkill"
        );


    if (!skill) {

        skill =
            skills[0];

    }


    // ========================================================
    // SAVE CURRENT SKILL
    // ========================================================

    localStorage.setItem(
        "verificationSkill",
        skill
    );


    // ========================================================
    // SHOW VERIFICATION NOTICE
    // ========================================================

    showVerificationGateMessage(
        skill
    );


    // ========================================================
    // START REAL AI TEST
    // ========================================================

    setTimeout(
        async function () {

            console.log(
                "🤖 Starting AI verification for:",
                skill
            );


            try {

                await startSkillVerification(
                    skill
                );

            }

            catch (error) {

                console.error(
                    "AI verification start error:",
                    error
                );


                alert(
                    "Unable to start AI skill verification.\n\n" +
                    "Please make sure the FastAPI server is running."
                );

            }

        },
        900
    );

}

// ============================================================
// VERIFICATION GATE MESSAGE
// ============================================================

function showVerificationGateMessage(
    skill
) {

    const existing =
        document.getElementById(
            "verificationGateMessage"
        );


    if (existing) {

        existing.remove();

    }


    const message =
        document.createElement(
            "div"
        );


    message.id =
        "verificationGateMessage";


    message.style.cssText = `

        position: fixed;

        top: 20px;

        left: 50%;

        transform: translateX(-50%);

        z-index: 999999;

        width: min(560px, 92%);

        padding: 18px 22px;

        background: #ffffff;

        border: 1px solid #dbeafe;

        border-radius: 18px;

        box-shadow:
            0 15px 45px
            rgba(15,23,42,.18);

        display: flex;

        align-items: center;

        gap: 14px;

        font-family:
            Inter,
            Arial,
            sans-serif;

    `;


    message.innerHTML = `

        <div style="
            width:44px;
            height:44px;
            border-radius:14px;
            background:#eff6ff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:22px;
            flex-shrink:0;
        ">
            🤖
        </div>


        <div style="
            flex:1;
        ">

            <strong style="
                display:block;
                color:#0f172a;
                font-size:15px;
                margin-bottom:4px;
            ">
                Skill verification required
            </strong>


            <span style="
                color:#64748b;
                font-size:13px;
                line-height:1.5;
            ">
                Complete the AI ${escapeHTML(skill)}
                skill test to unlock matching and connections.
            </span>

        </div>

    `;


    document.body.appendChild(
        message
    );


    setTimeout(
        function () {

            if (message) {

                message.remove();

            }

        },
        5000
    );

}

// ============================================================
// 🔓 UNLOCK STUDENT FEATURES
// ============================================================

function unlockStudentFeatures() {

    console.log(
        "🔓 Unlocking SkillForge features..."
    );

    localStorage.removeItem(
        "matchingLocked"
    );

    localStorage.removeItem(
        "sessionsLocked"
    );

    localStorage.removeItem(
        "connectionsLocked"
    );

    localStorage.setItem(
        "verificationComplete",
        "true"
    );

    const profile =
        getProfile();

    profile.verificationStatus =
        "verified";

    profile.verificationRequired =
        false;

    saveProfile(
        profile
    );

    updateVerificationCard();

    console.log(
        "✅ Matching unlocked."
    );

    console.log(
        "✅ Connections unlocked."
    );

    console.log(
        "✅ Sessions unlocked."
    );
}

// ============================================================
// 🔒 CHECK VERIFICATION
// ============================================================

function isStudentVerified() {

    const saved =
        localStorage.getItem(
            "skillVerification"
        );


    if (!saved) {

        return false;

    }


    try {

        const result =
            JSON.parse(
                saved
            );


        return (
            result &&
            result.verified === true
        );

    }

    catch (error) {

        console.error(
            "Verification check failed:",
            error
        );


        return false;

    }

}



/* ============================================================
   PROFILE UI
   ============================================================ */

function renderProfile() {

    const profile =
        getProfile();


    currentStudentProfile =
        profile;


    const fullName =
        getFullName(profile);


    const initials =
        getInitials(profile);


    const userName =
        document.getElementById(
            "userName"
        );


    if (userName) {

        userName.textContent =
            profile.firstName ||
            fullName;

    }


    const profileName =
        document.getElementById(
            "profileName"
        );


    if (profileName) {

        profileName.textContent =
            fullName;

    }


    const profileCollege =
        document.getElementById(
            "profileCollege"
        );


    if (profileCollege) {

        profileCollege.textContent =
            profile.college ||
            profile.institution ||
            "";

    }


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (profileAvatar) {

        profileAvatar.textContent =
            initials;

    }


    const largeAvatar =
        document.getElementById(
            "largeAvatar"
        );


    if (largeAvatar) {

        largeAvatar.textContent =
            initials;

    }


    const fullNameElement =
        document.getElementById(
            "fullName"
        );


    if (fullNameElement) {

        fullNameElement.textContent =
            fullName;

    }


    const courseInfo =
        document.getElementById(
            "courseInfo"
        );


    if (courseInfo) {

        const course =
            profile.course || "";

        const year =
            profile.year || "";

        courseInfo.textContent =
            year
                ? `${course} • ${year}`
                : course;

    }


    const collegeInfo =
        document.getElementById(
            "collegeInfo"
        );


    if (collegeInfo) {

        collegeInfo.textContent =
            profile.college ||
            profile.institution ||
            "";

    }

}



/* ============================================================
   SKILLS
   ============================================================ */

function renderSkills() {

    const profile =
        getProfile();


    const skills =
        normalizeArray(
            profile.skills
        );


    /*
     * Supabase uses "needs".
     * Frontend uses "learning".
     */

    const learning =
        normalizeArray(
            profile.learning ||
            profile.needs
        );


    const skillsContainer =
        document.getElementById(
            "skillsContainer"
        );


    const learningContainer =
        document.getElementById(
            "learningContainer"
        );


    if (skillsContainer) {

        skillsContainer.innerHTML =
            "";


        if (skills.length) {

            skills.forEach(
                skill => {

                    const tag =
                        document.createElement(
                            "span"
                        );

                    tag.className =
                        "skill-tag";

                    tag.textContent =
                        skill;

                    skillsContainer
                        .appendChild(tag);

                }
            );

        } else {

            skillsContainer.innerHTML =
                `<span class="skill-tag">
                    Add your skills
                </span>`;

        }

    }


    if (learningContainer) {

        learningContainer.innerHTML =
            "";


        if (learning.length) {

            learning.forEach(
                skill => {

                    const tag =
                        document.createElement(
                            "span"
                        );

                    tag.className =
                        "skill-tag";

                    tag.textContent =
                        skill;

                    learningContainer
                        .appendChild(tag);

                }
            );

        } else {

            learningContainer.innerHTML =
                `<span class="skill-tag">
                    Add learning goals
                </span>`;

        }

    }

}



/* ============================================================
   EXCHANGE SECTION
   ============================================================ */

function updateExchangeSection() {

    const profile =
        getProfile();


    const skills =
        normalizeArray(
            profile.skills
        );


    const learning =
        normalizeArray(
            profile.learning ||
            profile.needs
        );


    const canElement =
        document.getElementById(
            "exchangeCan"
        );


    const wantElement =
        document.getElementById(
            "exchangeWant"
        );


    if (canElement) {

        canElement.textContent =
            skills.length
                ? skills.join(", ")
                : "Add your skills";

    }


    if (wantElement) {

        wantElement.textContent =
            learning.length
                ? learning.join(", ")
                : "Add learning goals";

    }

}



/* ============================================================
   SUPABASE PROFILE SYNC
   ============================================================ */

async function syncProfileFromSupabase() {

    const profile =
        getProfile();


    if (!profile.email) {

        console.warn(
            "No email in studentProfile."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/profile/` +
                encodeURIComponent(
                    profile.email
                )
            );


        if (!response.ok) {

            console.warn(
                "Supabase profile API:",
                response.status
            );

            return;

        }


        const data =
            await response.json();


        const serverProfile =
            data.profile;


        if (!serverProfile) {

            return;

        }


        /*
         * Keep local profile structure.
         */

        profile.skills =
            normalizeArray(
                serverProfile.skills
            );


        profile.learning =
            normalizeArray(
                serverProfile.needs
            );


        if (serverProfile.name) {

            profile.name =
                serverProfile.name;

        }


        if (serverProfile.email) {

            profile.email =
                serverProfile.email;

        }


        if (serverProfile.role) {

            profile.role =
                serverProfile.role;

        }


        if (serverProfile.course) {

            profile.course =
                serverProfile.course;

        }


        if (serverProfile.bio) {

            profile.bio =
                serverProfile.bio;

        }


        if (serverProfile.availability) {

            profile.availability =
                serverProfile.availability;

        }


        saveProfile(profile);


        currentStudentProfile =
            profile;


        renderProfile();

        renderSkills();

        updateExchangeSection();


        console.log(
            "✅ Profile synced from Supabase"
        );


    } catch (error) {

        console.warn(
            "Supabase profile sync failed:",
            error
        );

    }

}



/* ============================================================
   CAN MODAL
   ============================================================ */

function openCanModal() {

    const modal =
        document.getElementById(
            "canModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closeCanModal() {

    const modal =
        document.getElementById(
            "canModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}



/* ============================================================
   WANT MODAL
   ============================================================ */

function openWantModal() {

    const modal =
        document.getElementById(
            "wantModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closeWantModal() {

    const modal =
        document.getElementById(
            "wantModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}



/* ============================================================
   NEED MODAL
   ============================================================ */

function openNeedModal() {

    const modal =
        document.getElementById(
            "needModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closeNeedModal() {

    const modal =
        document.getElementById(
            "needModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}



/* ============================================================
   SAVE SKILLS
   ============================================================ */

function saveSkills() {

    const input =
        document.getElementById(
            "canInput"
        );


    if (!input) {

        return;

    }


    const value =
        input.value.trim();


    if (!value) {

        alert(
            "Please add at least one skill."
        );

        return;

    }


    const skills =
        value
            .split(",")
            .map(
                skill =>
                    skill.trim()
            )
            .filter(Boolean);


    const profile =
        getProfile();


    profile.skills =
        [
            ...normalizeArray(
                profile.skills
            ),
            ...skills
        ];


    profile.skills =
        [
            ...new Set(
                profile.skills
            )
        ];


    saveProfile(profile);


    closeCanModal();

    renderSkills();

    updateExchangeSection();


    input.value = "";


    /*
     * Save to backend/Supabase
     * through mutual exchange endpoint
     * only when both sides exist.
     */

    if (
        profile.email &&
        profile.learning &&
        profile.learning.length
    ) {

        saveExchangeProfile();

    }

}



/* ============================================================
   SAVE LEARNING
   ============================================================ */

function saveLearning() {

    const input =
        document.getElementById(
            "wantInput"
        );


    if (!input) {

        return;

    }


    const value =
        input.value.trim();


    if (!value) {

        alert(
            "Please add at least one learning goal."
        );

        return;

    }


    const learning =
        value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    const profile =
        getProfile();


    profile.learning =
        [
            ...normalizeArray(
                profile.learning ||
                profile.needs
            ),
            ...learning
        ];


    profile.learning =
        [
            ...new Set(
                profile.learning
            )
        ];


    /*
     * Keep compatibility with
     * Supabase's "needs" field.
     */

    profile.needs =
        [...profile.learning];


    saveProfile(profile);


    closeWantModal();

    renderSkills();

    updateExchangeSection();


    input.value = "";


    if (
        profile.email &&
        profile.skills &&
        profile.skills.length
    ) {

        saveExchangeProfile();

    }

}



/* ============================================================
   SAVE SIMPLE REQUIREMENT
   ============================================================ */

function saveNeed() {

    const input =
        document.getElementById(
            "needInput"
        );


    if (!input) {

        return;

    }


    const requirement =
        input.value.trim();


    if (!requirement) {

        alert(
            "Please tell us what you need."
        );

        return;

    }


    localStorage.setItem(
        "studentNeed",
        requirement
    );


    closeNeedModal();


    findMatches();

}



/* ============================================================
   SAVE EXCHANGE PROFILE TO SUPABASE
   ============================================================ */

async function saveExchangeProfile() {

    const profile =
        getProfile();


    const skills =
        normalizeArray(
            profile.skills
        );


    const needs =
        normalizeArray(
            profile.learning ||
            profile.needs
        );


    if (
        !profile.email ||
        !skills.length ||
        !needs.length
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/mutual-exchange`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            profile.email,

                        skills:
                            skills,

                        needs:
                            needs

                    })

                }
            );


        if (!response.ok) {

            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            console.warn(
                "Exchange profile save:",
                data.detail
            );


            return;

        }


        const data =
            await response.json();


        /*
         * Keep returned matches available.
         */

        window.latestMutualMatches =
            data.matches || [];


        console.log(
            "✅ Exchange profile saved"
        );


    } catch (error) {

        console.warn(
            "Exchange profile save failed:",
            error
        );

    }

}



/* ============================================================
   REAL MUTUAL EXCHANGE
   ============================================================ */

async function findMutualExchange() {

    const profile =
        getProfile();


    const skills =
        normalizeArray(
            profile.skills
        );


    const needs =
        normalizeArray(
            profile.learning ||
            profile.needs
        );


    if (!skills.length) {

        alert(
            "Please add at least one skill you can teach."
        );

        return;

    }


    if (!needs.length) {

        alert(
            "Please add at least one skill you want to learn."
        );

        return;

    }


    const button =
        document.querySelector(
            ".find-exchange-btn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "🤖 Finding mutual matches...";

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/mutual-exchange`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        email:
                            profile.email,

                        skills:
                            skills,

                        needs:
                            needs

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to find mutual matches."
            );

        }


        window.latestMutualMatches =
            data.matches || [];


        showMutualMatches(
            data.matches || []
        );


    } catch (error) {

        console.error(
            "Mutual Exchange Error:",
            error
        );


        alert(
            "Unable to connect to the mutual exchange engine.\n\n" +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Find Mutual Exchange →";

        }

    }

}


/* ============================================================
   SHOW MUTUAL MATCHES
   ============================================================ */

function showMutualMatches(matches) {

    const old =
        document.getElementById(
            "mutualResults"
        );


    if (old) {

        old.remove();

    }


    if (!matches.length) {

        alert(
            "😔 No mutual skill exchange found yet.\n\n" +
            "Try adding more skills or learning goals."
        );

        return;

    }


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "mutualResults";


    section.className =
        "dashboard-card";


    section.style.cssText = `
        margin:24px auto;
        width:min(1200px,92%);
    `;


    section.innerHTML = `

        <div style="
            margin-bottom:20px;
        ">

            <span class="card-label">
                🤖 AI MUTUAL MATCHING
            </span>

            <h2>
                Students who complete your skill loop
            </h2>

            <p>
                They can teach what you want to learn,
                and you can teach what they want.
            </p>

        </div>


        <div>

            ${matches.map(
                student => {

                    const canTeach =
                        normalizeArray(
                            student.can_teach_you
                        );


                    const teachThem =
                        normalizeArray(
                            student.you_can_teach_them
                        );


                    const avatar =
                        student.profile_pic ||
                        student.profilePic ||
                        student.avatar;


                    return `

                        <div
                            class="mutual-student-card"
                            data-student-id="${student.id}"
                            data-email="${escapeHTML(student.email || "")}"
                            style="
                                border:1px solid #e5e7eb;
                                border-radius:16px;
                                padding:20px;
                                margin-bottom:15px;
                                background:#fff;
                            "
                        >

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:15px;
                            ">

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:14px;
                                ">

                                    <div
                                        class="mutual-profile-avatar"
                                        data-student-id="${student.id}"
                                        style="
                                            width:55px;
                                            height:55px;
                                            border-radius:50%;
                                            display:flex;
                                            align-items:center;
                                            justify-content:center;
                                            background:#2563eb;
                                            color:#fff;
                                            font-weight:700;
                                            cursor:pointer;
                                            overflow:hidden;
                                        "
                                        title="View Profile"
                                    >

                                        ${
                                            avatar
                                                ? `
                                                    <img
                                                        src="${escapeHTML(avatar)}"
                                                        style="
                                                            width:100%;
                                                            height:100%;
                                                            object-fit:cover;
                                                        "
                                                    >
                                                `
                                                : escapeHTML(
                                                    (student.name || "S")
                                                        .charAt(0)
                                                        .toUpperCase()
                                                )
                                        }

                                    </div>


                                    <div>

                                        <h3 style="
                                            margin:0;
                                        ">
                                            ${escapeHTML(
                                                student.name ||
                                                "Student"
                                            )}
                                        </h3>

                                        <p style="
                                            margin:5px 0;
                                            color:#64748b;
                                        ">
                                            ${escapeHTML(
                                                student.role ||
                                                "Student"
                                            )}
                                        </p>

                                    </div>

                                </div>


                                <strong style="
                                    color:#16a34a;
                                    font-size:20px;
                                ">
                                    ${student.match_percentage || 0}%
                                </strong>

                            </div>


                            <div style="
                                margin-top:16px;
                            ">

                                <strong>
                                    🎓 Can teach you:
                                </strong>

                                <div style="
                                    margin-top:8px;
                                ">

                                    ${
                                        canTeach.length
                                            ? canTeach
                                                .map(
                                                    skill =>
                                                        `<span class="skill-tag">
                                                            ${escapeHTML(skill)}
                                                        </span>`
                                                )
                                                .join("")
                                            : "<span>—</span>"
                                    }

                                </div>

                            </div>


                            <div style="
                                margin-top:12px;
                            ">

                                <strong>
                                    🤝 You can teach them:
                                </strong>

                                <div style="
                                    margin-top:8px;
                                ">

                                    ${
                                        teachThem.length
                                            ? teachThem
                                                .map(
                                                    skill =>
                                                        `<span class="skill-tag">
                                                            ${escapeHTML(skill)}
                                                        </span>`
                                                )
                                                .join("")
                                            : "<span>—</span>"
                                    }

                                </div>

                            </div>


                            ${
                                student.bio
                                    ? `
                                        <p style="
                                            color:#64748b;
                                            margin-top:12px;
                                        ">
                                            ${escapeHTML(
                                                student.bio
                                            )}
                                        </p>
                                    `
                                    : ""
                            }


                            <button
                                type="button"
                                class="mutual-connect-btn"
                                data-student-id="${student.id}"
                                style="
                                    margin-top:18px;
                                    width:100%;
                                    padding:12px;
                                    border:none;
                                    border-radius:10px;
                                    background:#2563eb;
                                    color:#fff;
                                    font-weight:700;
                                    cursor:pointer;
                                "
                            >
                                Connect with
                                ${escapeHTML(
                                    student.name ||
                                    "Student"
                                )}
                                →
                            </button>

                        </div>

                    `;

                }
            ).join("")}

        </div>

    `;


   const main =
    document.querySelector(".dashboard-main");

if (main) {

    main.appendChild(section);

} else {

    document.body.appendChild(section);

}


    /*
     * Connect buttons
     */

    section
        .querySelectorAll(
            ".mutual-connect-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.studentId
                            );


                        const student =
                            matches.find(
                                item =>
                                    Number(item.id) ===
                                    id
                            );


                        if (student) {

                            connectStudent(
                                student.id,
                                student.name,
                                student.email
                            );

                        }

                    }
                );

            }
        );


    /*
     * Profile avatars
     */

    section
        .querySelectorAll(
            ".mutual-profile-avatar"
        )
        .forEach(
            avatar => {

                avatar.addEventListener(
                    "click",
                    function () {

                        const id =
                            Number(
                                this.dataset.studentId
                            );


                        const student =
                            matches.find(
                                item =>
                                    Number(item.id) ===
                                    id
                            );


                        if (student) {

                            openStudentProfile(
                                student
                            );

                        }

                    }
                );

            }
        );


    section.scrollIntoView({
        behavior: "smooth"
    });

}



/* ============================================================
   CONNECT STUDENT
   ============================================================ */

async function connectStudent(
    studentId,
    studentName,
    receiverEmail = ""
) {

    const profile =
        getProfile();


    const senderEmail =
        profile.email;


    if (!senderEmail) {

        alert(
            "Your email is missing from your profile."
        );

        return;

    }



    /*
     * If email wasn't passed,
     * find student in latest matches.
     */

    if (!receiverEmail) {

        const student =
            window.latestMutualMatches.find(
                item =>
                    String(item.id) ===
                    String(studentId)
            );


        if (student) {

            receiverEmail =
                student.email;

        }

    }


    if (!receiverEmail) {

        alert(
            "Unable to identify this student's email."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/connection-request`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        sender_email:
                            senderEmail,

                        receiver_email:
                            receiverEmail

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to send connection request."
            );

        }


        if (data.success) {

            alert(
                `✅ Connection request sent to ${studentName}!`
            );

        } else {

            alert(
                data.message ||
                "Connection request already exists."
            );

        }


    } catch (error) {

        console.error(
            "Connection Error:",
            error
        );


        alert(
            "❌ Could not send connection request.\n\n" +
            error.message
        );

    }

}


function loadDemoMatches() {
    // Demo matches disabled.
}


/* ============================================================
   AI REQUIREMENT MATCHING
   ============================================================ */

async function findMatches() {

    const need =
        localStorage.getItem(
            "studentNeed"
        );


    if (!need) {

        openNeedModal();

        return;

    }


    const button =
        document.querySelector(
            ".find-match-btn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "AI is finding matches...";

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/find-matches`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        requirement:
                            need

                    })

                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.detail ||
                `Server error: ${response.status}`
            );

        }


        const data =
            await response.json();


        localStorage.setItem(
            "aiRequirement",
            JSON.stringify(
                data.analysis
            )
        );


        localStorage.setItem(
            "studentMatches",
            JSON.stringify(
                data.matches
            )
        );


        showMatches(
            data.matches || []
        );


    } catch (error) {

        console.error(
            "AI Matching Error:",
            error
        );


        alert(
            "Unable to connect to AI right now.\n\n" +
            error.message
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Find AI Matches →";

        }

    }

}



/* ============================================================
   AI MATCH RESULTS
   ============================================================ */

function showMatches(matches) {

    if (
        !matches ||
        !matches.length
    ) {

        alert(
            "😕 No suitable students found yet."
        );

        return;

    }


    const oldSection =
        document.getElementById(
            "aiMatchSection"
        );


    if (oldSection) {

        oldSection.remove();

    }


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "aiMatchSection";


    section.className =
        "ai-match-section";


    section.innerHTML = `

        <div class="match-header">

            <span class="match-ai-icon">
                🤖
            </span>

            <div>

                <p class="match-eyebrow">
                    AI MATCHING ENGINE
                </p>

                <h2>
                    Students who match your requirement
                </h2>

                <p>
                    Ranked using skills and availability.
                </p>

            </div>

        </div>


        <div class="match-grid">

            ${matches.map(
                student => {

                    const skills =
                        normalizeArray(
                            student.skills
                        );


                    const matched =
                        normalizeArray(
                            student.matched_skills
                        );


                    return `

                        <div class="match-card">

                            <div class="match-card-top">

                                <div
                                    class="student-avatar profile-clickable"
                                    data-student-id="${student.id}"
                                    title="View Profile"
                                >

                                    ${
                                        student.profile_pic ||
                                        student.profilePic ||
                                        student.avatar
                                            ? `
                                                <img
                                                    src="${
                                                        student.profile_pic ||
                                                        student.profilePic ||
                                                        student.avatar
                                                    }"
                                                    alt="${escapeHTML(
                                                        student.name
                                                    )}"
                                                >
                                            `
                                            : escapeHTML(
                                                (
                                                    student.name ||
                                                    "S"
                                                )
                                                .charAt(0)
                                                .toUpperCase()
                                            )
                                    }

                                </div>


                                <div class="student-info">

                                    <h3>
                                        ${escapeHTML(
                                            student.name ||
                                            "Student"
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHTML(
                                            student.role ||
                                            "Student"
                                        )}
                                    </p>

                                </div>


                                <div class="match-score">

                                    ${
                                        student.match_percentage ||
                                        0
                                    }%

                                    <span>
                                        Match
                                    </span>

                                </div>

                            </div>


                            <div class="match-skills">

                                ${skills
                                    .map(
                                        skill => {

                                            const isMatched =
                                                matched.some(
                                                    item =>
                                                        String(item)
                                                            .toLowerCase() ===
                                                        String(skill)
                                                            .toLowerCase()
                                                );


                                            return `

                                                <span
                                                    class="${
                                                        isMatched
                                                            ? "skill matched"
                                                            : "skill"
                                                    }"
                                                >

                                                    ${
                                                        isMatched
                                                            ? "✓ "
                                                            : ""
                                                    }

                                                    ${escapeHTML(
                                                        skill
                                                    )}

                                                </span>

                                            `;

                                        }
                                    )
                                    .join("")
                                }

                            </div>


                            <div class="match-details">

                                <p>
                                    🕒
                                    ${escapeHTML(
                                        student.availability ||
                                        "Flexible"
                                    )}
                                </p>


                                <p>
                                    🎯
                                    ${matched.length}
                                    required skill(s) matched
                                </p>

                            </div>


                            <p class="match-bio">

                                ${escapeHTML(
                                    student.bio ||
                                    ""
                                )}

                            </p>


                            <button
                                type="button"
                                class="connect-btn"
                                data-student-id="${student.id}"
                            >
                                Connect →
                            </button>

                        </div>

                    `;

                }
            ).join("")}

        </div>

    `;


    const matchContainer =
    document.getElementById("matches");

if (matchContainer) {

    matchContainer.appendChild(
        section
    );

} else {

    document.body.appendChild(
        section
    );

}


    section
    .querySelectorAll(
        ".match-card"
    )
    .forEach(
        card => {

            card.style.cursor =
                "pointer";


            card.addEventListener(
                "click",
                event => {

                    /*
                     * Connect button ka click
                     * profile open nahi karega.
                     */
                    if (
                        event.target.closest(
                            ".connect-btn"
                        )
                    ) {
                        return;
                    }


                    const id =
                        Number(
                            card
                                .querySelector(
                                    ".student-avatar"
                                )
                                ?.dataset
                                .studentId
                        );


                    const student =
                        matches.find(
                            item =>
                                Number(item.id) ===
                                id
                        );


                    if (student) {

                        openStudentProfile(
                            student
                        );

                    }

                }
            );

        }
    );


    section
        .querySelectorAll(
            ".connect-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.studentId
                            );


                        const student =
                            matches.find(
                                item =>
                                    Number(item.id) ===
                                    id
                            );


                        if (student) {

                            connectStudent(
                                student.id,
                                student.name,
                                student.email
                            );

                        }

                    }
                );

            }
        );


    section.scrollIntoView({
        behavior: "smooth"
    });

}



/* ============================================================
   STUDENT PROFILE MODAL
   ============================================================ */

function openStudentProfile(student) {

    const old =
        document.getElementById(
            "studentProfileModal"
        );

    if (old) {
        old.remove();
    }


    const skills =
        normalizeArray(
            student.skills
        );

    const needs =
        normalizeArray(
            student.needs ||
            student.learning
        );

    const avatar =
        student.profile_pic ||
        student.profilePic ||
        student.avatar;


    const matchScore =
        student.score ||
        student.match_score ||
        student.matchScore ||
        "";


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studentProfileModal";


    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;

        display: flex;
        align-items: center;
        justify-content: center;

        background:
            rgba(15, 23, 42, 0.72);

        backdrop-filter: blur(8px);

        padding: 24px;

        animation:
            profileFadeIn .2s ease;
    `;


    modal.innerHTML = `

        <style>

            @keyframes profileFadeIn {

                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }

            }


            @keyframes profileSlideUp {

                from {
                    opacity: 0;
                    transform:
                        translateY(25px)
                        scale(.98);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0)
                        scale(1);
                }

            }


            #studentProfileModal
            .student-profile-card {

                width:
                    min(650px, 100%);

                max-height:
                    90vh;

                overflow-y:
                    auto;

                background:
                    #ffffff;

                border-radius:
                    28px;

                position:
                    relative;

                box-shadow:
                    0 30px 90px
                    rgba(0,0,0,.30);

                animation:
                    profileSlideUp .25s ease;

                color:
                    #172033;
            }


            #studentProfileModal
            .profile-header {

                padding:
                    34px 34px 26px;

                text-align:
                    center;

                background:
                    linear-gradient(
                        135deg,
                        #eef2ff,
                        #f8fafc
                    );

                border-radius:
                    28px 28px 0 0;
            }


            #studentProfileModal
            .profile-avatar {

                width:
                    96px;

                height:
                    96px;

                margin:
                    0 auto 14px;

                border-radius:
                    50%;

                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    center;

                overflow:
                    hidden;

                background:
                    #6366f1;

                color:
                    white;

                font-size:
                    34px;

                font-weight:
                    800;

                border:
                    4px solid white;

                box-shadow:
                    0 8px 25px
                    rgba(99,102,241,.25);
            }


            #studentProfileModal
            .profile-avatar img {

                width:
                    100%;

                height:
                    100%;

                object-fit:
                    cover;
            }


            #studentProfileModal
            .profile-name {

                margin:
                    0;

                font-size:
                    27px;

                font-weight:
                    800;
            }


            #studentProfileModal
            .profile-role {

                margin:
                    7px 0 0;

                color:
                    #64748b;

                font-size:
                    14px;
            }


            #studentProfileModal
            .profile-match {

                display:
                    inline-flex;

                align-items:
                    center;

                gap:
                    6px;

                margin-top:
                    14px;

                padding:
                    7px 13px;

                border-radius:
                    999px;

                background:
                    #ecfdf5;

                color:
                    #15803d;

                font-size:
                    13px;

                font-weight:
                    700;
            }


            #studentProfileModal
            .profile-close {

                position:
                    absolute;

                top:
                    16px;

                right:
                    16px;

                width:
                    38px;

                height:
                    38px;

                border:
                    none;

                border-radius:
                    50%;

                background:
                    rgba(255,255,255,.9);

                color:
                    #334155;

                font-size:
                    21px;

                cursor:
                    pointer;

                z-index:
                    5;
            }


            #studentProfileModal
            .profile-close:hover {

                background:
                    #e2e8f0;
            }


            #studentProfileModal
            .profile-body {

                padding:
                    28px 34px 34px;
            }


            #studentProfileModal
            .profile-info-grid {

                display:
                    grid;

                grid-template-columns:
                    1fr 1fr;

                gap:
                    14px;

                margin-bottom:
                    24px;
            }


            #studentProfileModal
            .profile-info {

                padding:
                    15px;

                border:
                    1px solid #e2e8f0;

                border-radius:
                    14px;

                background:
                    #f8fafc;
            }


            #studentProfileModal
            .profile-info-label {

                font-size:
                    11px;

                color:
                    #94a3b8;

                font-weight:
                    700;

                text-transform:
                    uppercase;

                letter-spacing:
                    .5px;

                margin-bottom:
                    5px;
            }


            #studentProfileModal
            .profile-info-value {

                font-size:
                    14px;

                color:
                    #334155;

                font-weight:
                    600;
            }


            #studentProfileModal
            .profile-section {

                margin-top:
                    22px;
            }


            #studentProfileModal
            .profile-section h4 {

                margin:
                    0 0 10px;

                font-size:
                    14px;

                color:
                    #1e293b;
            }


            #studentProfileModal
            .profile-about {

                color:
                    #64748b;

                font-size:
                    14px;

                line-height:
                    1.65;

                margin:
                    0;
            }


            #studentProfileModal
            .profile-tags {

                display:
                    flex;

                flex-wrap:
                    wrap;

                gap:
                    8px;
            }


            #studentProfileModal
            .profile-tag {

                padding:
                    7px 11px;

                border-radius:
                    999px;

                background:
                    #f1f5f9;

                color:
                    #475569;

                font-size:
                    12px;

                font-weight:
                    600;
            }


            #studentProfileModal
            .profile-actions {

                display:
                    flex;

                gap:
                    12px;

                margin-top:
                    30px;
            }


            #studentProfileModal
            .profile-connect {

                flex:
                    1;

                height:
                    48px;

                border:
                    none;

                border-radius:
                    12px;

                background:
                    #6366f1;

                color:
                    white;

                font-size:
                    14px;

                font-weight:
                    700;

                cursor:
                    pointer;

                transition:
                    .2s;
            }


            #studentProfileModal
            .profile-connect:hover {

                transform:
                    translateY(-1px);

                box-shadow:
                    0 8px 20px
                    rgba(99,102,241,.25);
            }


            #studentProfileModal
            .profile-back {

                width:
                    110px;

                height:
                    48px;

                border:
                    1px solid #e2e8f0;

                border-radius:
                    12px;

                background:
                    white;

                color:
                    #475569;

                font-weight:
                    700;

                cursor:
                    pointer;
            }


            @media (max-width: 600px) {

                #studentProfileModal {

                    padding:
                        12px;
                }


                #studentProfileModal
                .student-profile-card {

                    max-height:
                        94vh;

                    border-radius:
                        22px;
                }


                #studentProfileModal
                .profile-header {

                    padding:
                        28px 20px 22px;
                }


                #studentProfileModal
                .profile-body {

                    padding:
                        22px 20px 25px;
                }


                #studentProfileModal
                .profile-info-grid {

                    grid-template-columns:
                        1fr;
                }


                #studentProfileModal
                .profile-actions {

                    flex-direction:
                        column;
                }


                #studentProfileModal
                .profile-back {

                    width:
                        100%;
                }

            }

        </style>


        <div
            class="student-profile-card"
        >

            <button
                type="button"
                class="profile-close"
                id="closeStudentProfileBtn"
            >
                ×
            </button>


            <div
                class="profile-header"
            >

                <div
                    class="profile-avatar"
                >

                    ${
                        avatar
                            ? `
                                <img
                                    src="${escapeHTML(avatar)}"
                                    alt="Profile"
                                >
                            `
                            :
                            escapeHTML(
                                (
                                    student.name ||
                                    "S"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )
                    }

                </div>


                <h2
                    class="profile-name"
                >
                    ${escapeHTML(
                        student.name ||
                        "Student"
                    )}
                </h2>


                <p
                    class="profile-role"
                >
                    ${escapeHTML(
                        student.role ||
                        "Student"
                    )}
                </p>


                ${
                    matchScore
                        ? `
                            <div
                                class="profile-match"
                            >
                                ✦
                                ${escapeHTML(
                                    String(
                                        matchScore
                                    )
                                )}
                                Match
                            </div>
                        `
                        : ""
                }

            </div>


            <div
                class="profile-body"
            >

                <div
                    class="profile-info-grid"
                >

                    <div
                        class="profile-info"
                    >

                        <div
                            class="profile-info-label"
                        >
                            Course
                        </div>

                        <div
                            class="profile-info-value"
                        >
                            ${escapeHTML(
                                student.course ||
                                "Not provided"
                            )}
                        </div>

                    </div>


                    <div
                        class="profile-info"
                    >

                        <div
                            class="profile-info-label"
                        >
                            Availability
                        </div>

                        <div
                            class="profile-info-value"
                        >
                            ${escapeHTML(
                                student.availability ||
                                "Not provided"
                            )}
                        </div>

                    </div>


                    <div
                        class="profile-info"
                    >

                        <div
                            class="profile-info-label"
                        >
                            Exchange
                        </div>

                        <div
                            class="profile-info-value"
                        >
                            Skill Exchange
                        </div>

                    </div>

                </div>


                ${
                    student.bio
                        ? `
                            <div
                                class="profile-section"
                            >

                                <h4>
                                    About
                                </h4>

                                <p
                                    class="profile-about"
                                >
                                    ${escapeHTML(
                                        student.bio
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }


                <div
                    class="profile-section"
                >

                    <h4>
                        💡 Can Teach
                    </h4>

                    <div
                        class="profile-tags"
                    >

                        ${
                            skills.length
                                ? skills
                                    .map(
                                        skill =>
                                            `
                                            <span
                                                class="profile-tag"
                                            >
                                                ${escapeHTML(
                                                    skill
                                                )}
                                            </span>
                                            `
                                    )
                                    .join("")
                                :
                                    `
                                    <span
                                        class="profile-about"
                                    >
                                        No skills added
                                    </span>
                                    `
                        }

                    </div>

                </div>


                <div
                    class="profile-section"
                >

                    <h4>
                        🎯 Wants To Learn
                    </h4>

                    <div
                        class="profile-tags"
                    >

                        ${
                            needs.length
                                ? needs
                                    .map(
                                        skill =>
                                            `
                                            <span
                                                class="profile-tag"
                                            >
                                                ${escapeHTML(
                                                    skill
                                                )}
                                            </span>
                                            `
                                    )
                                    .join("")
                                :
                                    `
                                    <span
                                        class="profile-about"
                                    >
                                        No learning goals added
                                    </span>
                                    `
                        }

                    </div>

                </div>


                <div
                    class="profile-actions"
                >

                    <button
                        type="button"
                        class="profile-back"
                        id="profileBackBtn"
                    >
                        ← Back
                    </button>


                    <button
                        type="button"
                        class="profile-connect"
                        id="profileConnectBtn"
                    >
                        Connect →
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeStudentProfileBtn"
        )
        ?.addEventListener(
            "click",
            closeStudentProfile
        );


    document
        .getElementById(
            "profileBackBtn"
        )
        ?.addEventListener(
            "click",
            closeStudentProfile
        );


    document
        .getElementById(
            "profileConnectBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                connectStudent(
                    student.id,
                    student.name,
                    student.email || ""
                );

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeStudentProfile();

            }

        }
    );

}

function closeStudentProfile() {

    const modal =
        document.getElementById(
            "studentProfileModal"
        );


    if (modal) {

        modal.remove();

    }

}



/* ============================================================
   CONNECTION REQUESTS
   ============================================================ */

async function loadConnectionRequests() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/requests`
            );


        if (!response.ok) {

            console.warn(
                "Request API:",
                response.status
            );

            return;

        }


        const data =
            await response.json();


        renderConnectionRequests(
            data.requests || []
        );


    } catch (error) {

        console.warn(
            "Connection request loading failed:",
            error
        );

    }

}



/* ============================================================
   RENDER REQUESTS
   ============================================================ */

function renderConnectionRequests(
    requests
) {

    const old =
        document.getElementById(
            "connectionRequestsSection"
        );


    if (old) {

        old.remove();

    }


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "connectionRequestsSection";


    section.style.cssText = `
    width:100%;
    box-sizing:border-box;
    margin:24px 0 0 0;
    padding:28px;

    background:#ffffff;
    border-radius:20px;

    border:1px solid #e5e7eb;
    box-shadow:0 8px 25px rgba(0,0,0,.05);
`;


    section.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:24px;
        ">

            <div>

                <div style="
                    font-size:13px;
                    font-weight:700;
                    color:#2563eb;
                ">
                    CONNECTIONS
                </div>

                <h2>
                    Connection Requests
                </h2>

                <p>
                    Students who want to connect with you.
                </p>

            </div>


            <div style="
                background:#eff6ff;
                color:#2563eb;
                padding:10px 16px;
                border-radius:20px;
                font-weight:700;
            ">
                ${requests.length}
                Pending
            </div>

        </div>


        <div id="requestsList">

            ${
                requests.length === 0

                    ? `
                        <div style="
                            padding:35px;
                            text-align:center;
                            color:#6b7280;
                        ">

                            <div style="
                                font-size:40px;
                            ">
                                📭
                            </div>

                            <h3>
                                No pending requests
                            </h3>

                            <p>
                                New connection requests will appear here.
                            </p>

                        </div>
                    `

                    : requests.map(
                        request => `

                            <div
                                id="request-${request.request_id}"
                                style="
                                    display:flex;
                                    align-items:center;
                                    justify-content:space-between;
                                    gap:20px;
                                    padding:20px;
                                    margin-bottom:14px;
                                    border:1px solid #e5e7eb;
                                    border-radius:18px;
                                    background:#fafafa;
                                "
                            >

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:16px;
                                ">

                                    <div style="
                                        width:52px;
                                        height:52px;
                                        border-radius:50%;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        background:#2563eb;
                                        color:#fff;
                                        font-size:20px;
                                        font-weight:700;
                                    ">
                                        ${escapeHTML(
                                            (
                                                request.name ||
                                                "S"
                                            )
                                            .charAt(0)
                                        )}
                                    </div>


                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                request.name ||
                                                "Student"
                                            )}
                                        </h3>

                                        <p>
                                            ${escapeHTML(
                                                request.role ||
                                                "Student"
                                            )}
                                        </p>

                                        <p style="
                                            font-size:13px;
                                        ">
                                            ${normalizeArray(
                                                request.skills
                                            )
                                            .map(
                                                escapeHTML
                                            )
                                            .join(" • ")}
                                        </p>

                                    </div>

                                </div>


                                <div style="
                                    display:flex;
                                    gap:10px;
                                ">

                                    <button
                                        type="button"
                                        class="accept-request-btn"
                                        data-request-id="${request.request_id}"
                                        data-student-id="${request.student_id}"
                                        data-student-name="${escapeHTML(request.name || "Student")}"
                                        style="
                                            border:none;
                                            padding:11px 20px;
                                            border-radius:10px;
                                            background:#16a34a;
                                            color:#fff;
                                            font-weight:700;
                                            cursor:pointer;
                                        "
                                    >
                                        ✓ Accept
                                    </button>


                                    <button
                                        type="button"
                                        class="reject-request-btn"
                                        data-request-id="${request.request_id}"
                                        style="
                                            border:none;
                                            padding:11px 20px;
                                            border-radius:10px;
                                            background:#fee2e2;
                                            color:#dc2626;
                                            font-weight:700;
                                            cursor:pointer;
                                        "
                                    >
                                        ✕ Reject
                                    </button>

                                </div>

                            </div>

                        `
                    ).join("")
            }

        </div>

    `;


    const connections =
    document.getElementById("connections");

if (connections) {

    connections.appendChild(section);

}


    section
        .querySelectorAll(
            ".accept-request-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        acceptRequest(
                            Number(
                                button.dataset.requestId
                            ),
                            Number(
                                button.dataset.studentId
                            ),
                            button.dataset.studentName
                        );

                    }
                );

            }
        );


    section
        .querySelectorAll(
            ".reject-request-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        rejectRequest(
                            Number(
                                button.dataset.requestId
                            )
                        );

                    }
                );

            }
        );

}



/* ============================================================
   ACCEPT REQUEST
   ============================================================ */

async function acceptRequest(
    requestId,
    studentId,
    studentName
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/requests/${requestId}/accept`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to accept request."
            );

        }


        let connections =
            JSON.parse(
                localStorage.getItem(
                    "connectedStudents"
                ) || "[]"
            );


        if (
            !connections.some(
                student =>
                    Number(student.id) ===
                    Number(studentId)
            )
        ) {

            connections.push({

                id:
                    Number(studentId),

                name:
                    studentName,

                role:
                    "Student",

                connectedAt:
                    new Date()
                        .toISOString()

            });

        }


        localStorage.setItem(
            "connectedStudents",
            JSON.stringify(
                connections
            )
        );


        const card =
            document.getElementById(
                `request-${requestId}`
            );


        if (card) {

            card.remove();

        }


        loadConnectedStudents();


        alert(
            `✅ You are now connected with ${studentName}!`
        );


    } catch (error) {

        console.error(
            "Accept request error:",
            error
        );


        alert(
            "Unable to accept request.\n\n" +
            error.message
        );

    }

}



/* ============================================================
   REJECT REQUEST
   ============================================================ */

async function rejectRequest(
    requestId
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/requests/${requestId}/reject`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to reject request."
            );

        }


        const card =
            document.getElementById(
                `request-${requestId}`
            );


        if (card) {

            card.remove();

        }


        alert(
            "Request rejected."
        );


    } catch (error) {

        console.error(
            "Reject request error:",
            error
        );


        alert(
            "Unable to reject request.\n\n" +
            error.message
        );

    }

}



/* ============================================================
   CONNECTED STUDENTS
   ============================================================ */

function loadConnectedStudents() {

    const container =
        document.getElementById(
            "connectedStudents"
        );


    if (!container) {

        return;

    }


    const students =
        JSON.parse(
            localStorage.getItem(
                "connectedStudents"
            ) || "[]"
        );


    container.innerHTML =
        "";


    if (!students.length) {

        container.innerHTML = `
            <p>
                No connected students yet.
            </p>
        `;

        return;

    }


    students.forEach(
        student => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "connected-student";


            card.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            student.name ||
                            "Student"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            student.role ||
                            "Student"
                        )}
                    </small>

                </div>


                <button
                    type="button"
                    class="chat-student-btn"
                    data-student-id="${student.id}"
                    data-student-name="${escapeHTML(student.name || "Student")}"
                >
                    Chat →
                </button>

            `;


            card
                .querySelector(
                    ".chat-student-btn"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        openChat(
                            Number(
                                student.id
                            ),
                            student.name
                        );

                    }
                );


            container.appendChild(
                card
            );

        }
    );

}



/* ============================================================
   CHAT
   ============================================================ */

function openChat(
    studentId,
    studentName
) {

    const old =
        document.getElementById(
            "chatModal"
        );


    if (old) {
        old.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "chatModal";


    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;

        display: flex;
        align-items: center;
        justify-content: center;

        padding: 20px;

        background:
            rgba(15, 23, 42, 0.72);

        backdrop-filter:
            blur(8px);
    `;


    modal.innerHTML = `

        <style>

            #chatModal
            .chat-card {

                width:
                    min(760px, 100%);

                height:
                    min(720px, 88vh);

                background:
                    #ffffff;

                border-radius:
                    24px;

                overflow:
                    hidden;

                display:
                    flex;

                flex-direction:
                    column;

                box-shadow:
                    0 30px 80px
                    rgba(0,0,0,.28);

                animation:
                    chatOpen .2s ease;
            }


            @keyframes chatOpen {

                from {
                    opacity: 0;
                    transform:
                        translateY(15px)
                        scale(.98);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0)
                        scale(1);
                }

            }


            #chatModal
            .chat-header {

                height:
                    76px;

                flex-shrink:
                    0;

                display:
                    flex;

                align-items:
                    center;

                gap:
                    12px;

                padding:
                    0 20px;

                background:
                    #ffffff;

                border-bottom:
                    1px solid #e5e7eb;
            }


            #chatModal
            .chat-back {

                width:
                    40px;

                height:
                    40px;

                border:
                    none;

                border-radius:
                    50%;

                background:
                    #f1f5f9;

                color:
                    #334155;

                font-size:
                    20px;

                cursor:
                    pointer;

                flex-shrink:
                    0;
            }


            #chatModal
            .chat-back:hover {

                background:
                    #e2e8f0;
            }


            #chatModal
            .chat-avatar {

                width:
                    44px;

                height:
                    44px;

                border-radius:
                    50%;

                background:
                    #2563eb;

                color:
                    #ffffff;

                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    center;

                font-weight:
                    800;

                font-size:
                    17px;

                flex-shrink:
                    0;
            }


            #chatModal
            .chat-user {

                flex:
                    1;

                min-width:
                    0;
            }


            #chatModal
            .chat-user-name {

                display:
                    block;

                font-size:
                    16px;

                font-weight:
                    750;

                color:
                    #172033;

                white-space:
                    nowrap;

                overflow:
                    hidden;

                text-overflow:
                    ellipsis;
            }


            #chatModal
            .chat-status {

                display:
                    block;

                margin-top:
                    3px;

                font-size:
                    12px;

                color:
                    #16a34a;
            }


            #chatModal
            .chat-close {

                width:
                    40px;

                height:
                    40px;

                border:
                    none;

                border-radius:
                    50%;

                background:
                    #f1f5f9;

                color:
                    #334155;

                font-size:
                    20px;

                cursor:
                    pointer;

                flex-shrink:
                    0;
            }


            #chatModal
            .chat-close:hover {

                background:
                    #e2e8f0;
            }


            #chatModal
            #chatMessages {

                flex:
                    1;

                min-height:
                    0;

                overflow-y:
                    auto;

                padding:
                    24px;

                background:
                    #f8fafc;

                display:
                    flex;

                flex-direction:
                    column;
            }


            #chatModal
            #chatMessages::-webkit-scrollbar {

                width:
                    7px;
            }


            #chatModal
            #chatMessages::-webkit-scrollbar-thumb {

                background:
                    #cbd5e1;

                border-radius:
                    20px;
            }


            #chatModal
            .chat-empty {

                margin:
                    auto;

                text-align:
                    center;

                color:
                    #94a3b8;

                font-size:
                    14px;
            }


            #chatModal
            .chat-footer {

                flex-shrink:
                    0;

                display:
                    flex;

                align-items:
                    center;

                gap:
                    10px;

                padding:
                    14px 16px;

                background:
                    #ffffff;

                border-top:
                    1px solid #e5e7eb;
            }


            #chatModal
            #chatInput {

                flex:
                    1;

                min-width:
                    0;

                height:
                    48px;

                padding:
                    0 16px;

                border:
                    1px solid #dbe2ea;

                border-radius:
                    14px;

                outline:
                    none;

                font-size:
                    14px;

                color:
                    #172033;

                background:
                    #f8fafc;
            }


            #chatModal
            #chatInput:focus {

                border-color:
                    #6366f1;

                background:
                    #ffffff;

                box-shadow:
                    0 0 0 3px
                    rgba(99,102,241,.10);
            }


            #chatModal
            #sendChatBtn {

                height:
                    48px;

                padding:
                    0 22px;

                border:
                    none;

                border-radius:
                    14px;

                background:
                    #2563eb;

                color:
                    #ffffff;

                font-size:
                    14px;

                font-weight:
                    700;

                cursor:
                    pointer;

                transition:
                    .2s;
            }


            #chatModal
            #sendChatBtn:hover {

                transform:
                    translateY(-1px);

                box-shadow:
                    0 8px 18px
                    rgba(37,99,235,.22);
            }


            @media (max-width: 600px) {

                #chatModal {

                    padding:
                        0;
                }


                #chatModal
                .chat-card {

                    width:
                        100%;

                    height:
                        100vh;

                    max-height:
                        none;

                    border-radius:
                        0;
                }


                #chatModal
                .chat-header {

                    height:
                        68px;

                    padding:
                        0 12px;
                }


                #chatModal
                #chatMessages {

                    padding:
                        16px;
                }


                #chatModal
                .chat-footer {

                    padding:
                        10px;
                }


                #chatModal
                #sendChatBtn {

                    padding:
                        0 16px;
                }

            }

        </style>


        <div
            class="chat-card"
        >

            <div
                class="chat-header"
            >

                <button
                    type="button"
                    class="chat-back"
                    id="chatBackBtn"
                >
                    ←
                </button>


                <div
                    class="chat-avatar"
                >
                    ${escapeHTML(
                        (
                            studentName ||
                            "S"
                        )
                        .charAt(0)
                        .toUpperCase()
                    )}
                </div>


                <div
                    class="chat-user"
                >

                    <span
                        class="chat-user-name"
                    >
                        ${escapeHTML(
                            studentName ||
                            "Student"
                        )}
                    </span>

                    <span
                        class="chat-status"
                    >
                        ● Connected
                    </span>

                </div>


                <button
                    type="button"
                    class="chat-close"
                    id="closeChatBtn"
                >
                    ×
                </button>

            </div>


            <div
                id="chatMessages"
            >

                <div
                    class="chat-empty"
                >
                    Loading messages...
                </div>

            </div>


            <div
                class="chat-footer"
            >

                <input
                    id="chatInput"
                    type="text"
                    autocomplete="off"
                    placeholder="Type a message..."
                >


                <button
                    type="button"
                    id="sendChatBtn"
                >
                    Send
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeChatBtn"
        )
        ?.addEventListener(
            "click",
            closeChat
        );


    document
        .getElementById(
            "chatBackBtn"
        )
        ?.addEventListener(
            "click",
            closeChat
        );


    document
        .getElementById(
            "sendChatBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                sendChatMessage(
                    studentId,
                    studentName
                );

            }
        );


    document
        .getElementById(
            "chatInput"
        )
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendChatMessage(
                        studentId,
                        studentName
                    );

                }

            }
        );


    loadChatMessages(
        studentId
    );

}


async function loadChatMessages(
    studentId
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {

        return;

    }


    try {

    console.log(
        "💬 Chat studentId:",
        studentId
    );

    console.log(
        "💬 Chat URL:",
        `${API_BASE}/api/messages/${studentId}`
    );

    const response =
        await fetch(
            `${API_BASE}/api/messages/${studentId}`
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load messages."
            );

        }


        renderChatMessages(
            data.messages || []
        );


    } catch (error) {

        console.error(
            "Chat loading error:",
            error
        );


        container.innerHTML =
            `<p>Unable to load messages.</p>`;

    }

}


function renderChatMessages(
    messages
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return;
    }


    const profile =
        getProfile();


    /*
     * Current student's numeric ID.
     *
     * studentId is preferred because
     * profiles.id is numeric.
     */

    const currentId = 999;


    if (
        !messages ||
        messages.length === 0
    ) {

        container.innerHTML = `

            <div style="
                margin:auto;
                text-align:center;
                color:#94a3b8;
                font-size:14px;
            ">

                <div style="
                    font-size:38px;
                    margin-bottom:10px;
                ">
                    👋
                </div>

                <strong>
                    Start the conversation
                </strong>

                <div style="
                    margin-top:5px;
                ">
                    Send your first message.
                </div>

            </div>

        `;

        return;

    }


    function formatTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    try {

        let value =
            String(timestamp).trim();

        /*
         * Supabase/PostgreSQL timestamps sometimes
         * arrive without timezone information.
         *
         * Treat timezone-less timestamps as UTC.
         */

        if (
            !value.endsWith("Z") &&
            !/[+-]\d{2}:\d{2}$/.test(value)
        ) {

            value =
                value.replace(" ", "T") +
                "Z";

        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata",

                hour:
                    "numeric",

                minute:
                    "2-digit",

                hour12:
                    true
            }
        ).format(date);

    }

    catch (error) {

        console.error(
            "Chat time formatting error:",
            error
        );

        return "";

    }

}


    function formatDate(
        timestamp
    ) {

        if (!timestamp) {
            return "";
        }


        const date =
            new Date(
                timestamp
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        const today =
            new Date();


        const yesterday =
            new Date();


        yesterday.setDate(
            today.getDate() - 1
        );


        if (
            date.toDateString() ===
            today.toDateString()
        ) {

            return "Today";

        }


        if (
            date.toDateString() ===
            yesterday.toDateString()
        ) {

            return "Yesterday";

        }


        return date.toLocaleDateString(
            [],
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );

    }


    let lastDate = "";


    container.innerHTML =
        messages
            .map(
                message => {

                    const mine =
                        Number(
                            message.sender_id
                        ) ===
                        currentId;


                    const messageDate =
                        formatDate(
                            message.created_at
                        );


                    let dateDivider =
                        "";


                    if (
                        messageDate &&
                        messageDate !==
                            lastDate
                    ) {

                        lastDate =
                            messageDate;


                        dateDivider = `

                            <div style="
                                display:flex;
                                justify-content:center;
                                margin:14px 0;
                            ">

                                <span style="
                                    padding:5px 12px;
                                    border-radius:20px;
                                    background:#e2e8f0;
                                    color:#64748b;
                                    font-size:11px;
                                    font-weight:600;
                                ">
                                    ${messageDate}
                                </span>

                            </div>

                        `;

                    }


                    return `

                        ${dateDivider}


                        <div style="
                            display:flex;
                            justify-content:
                                ${
                                    mine
                                        ? "flex-end"
                                        : "flex-start"
                                };
                            margin-bottom:8px;
                            padding:0 4px;
                        ">

                            <div style="
                                max-width:72%;
                                min-width:60px;

                                padding:
                                    9px 12px 7px;

                                border-radius:
                                    ${
                                        mine
                                            ? "16px 16px 4px 16px"
                                            : "16px 16px 16px 4px"
                                    };

                                background:
                                    ${
                                        mine
                                            ? "#2563eb"
                                            : "#ffffff"
                                    };

                                color:
                                    ${
                                        mine
                                            ? "#ffffff"
                                            : "#172033"
                                    };

                                box-shadow:
                                    0 2px 6px
                                    rgba(15,23,42,.06);

                                word-break:
                                    break-word;
                            ">

                                <div style="
                                    font-size:14px;
                                    line-height:1.45;
                                ">

                                    ${escapeHTML(
    message.message
)}

                                </div>


                                <div style="
                                    display:flex;
                                    justify-content:flex-end;
                                    align-items:center;
                                    gap:4px;

                                    margin-top:4px;

                                    font-size:10px;

                                    opacity:.7;
                                ">

                                    ${
                                        formatTime(
                                            message.created_at
                                        )
                                    }

                                    ${
                                        mine
                                            ? "✓✓"
                                            : ""
                                    }

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container.scrollTop =
        container.scrollHeight;

}


async function sendChatMessage(studentId) {

    const input =
        document.getElementById("chatInput");

    if (!input) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/api/messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        // IMPORTANT:
                        // Backend currently uses 999
                        sender_id: 999,

                        receiver_id:
                            Number(studentId),

                        message:
                            message
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "SEND RESPONSE:",
            data
        );


        if (!response.ok) {

            let errorMessage =
                "Unable to send message.";

            if (Array.isArray(data.detail)) {

                errorMessage =
                    data.detail
                        .map(
                            item =>
                                item.msg ||
                                JSON.stringify(item)
                        )
                        .join("\n");

            } else if (
                typeof data.detail === "string"
            ) {

                errorMessage =
                    data.detail;

            } else if (data.detail) {

                errorMessage =
                    JSON.stringify(
                        data.detail
                    );

            }


            throw new Error(
                errorMessage
            );
        }


        input.value = "";


        await loadChatMessages(
            studentId
        );


        input.focus();


    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );


        alert(
            "Unable to send message.\n\n" +
            error.message
        );

    }

}


function closeChat() {

    const modal =
        document.getElementById(
            "chatModal"
        );


    if (modal) {

        modal.remove();

    }

}



/* ============================================================
   LOGOUT
   ============================================================ */

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) {

        return;

    }


    logoutBtn.onclick =
        function () {

            localStorage.removeItem(
                "studentProfile"
            );


            localStorage.removeItem(
                "studentNeed"
            );


            localStorage.removeItem(
                "aiRequirement"
            );


            localStorage.removeItem(
                "studentMatches"
            );


            window.location.href =
                "index.html";

        };

}



/* ============================================================
   OUTSIDE MODAL CLOSE
   ============================================================ */

function setupOutsideModalClose() {

    document.addEventListener(
        "click",
        function (event) {

            const modals = [
                "needModal",
                "canModal",
                "wantModal"
            ];


            modals.forEach(
                id => {

                    const modal =
                        document.getElementById(
                            id
                        );


                    if (
                        modal &&
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }
    );

}



/* ============================================================
   ESCAPE KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeStudentProfile();

            closeChat();

        }

    }
);
/* ============================================================
   🤖 AI SKILL VERIFICATION
   ============================================================ */

const SKILL_API = "http://127.0.0.1:8000";

let aiVerification = {
    skill: "Python",
    currentQuestion: 0,
    totalQuestions: 5,
    difficulty: "Basic",
    questions: [],
    answers: [],
    loading: false
};


/* ============================================================
   START AI VERIFICATION
   ============================================================ */

async function startSkillVerification(skill = "Python") {

    aiVerification = {
        skill: skill,
        currentQuestion: 0,
        totalQuestions: 5,
        difficulty: "Basic",
        questions: [],
        answers: [],
        loading: false
    };

    const oldModal =
        document.getElementById(
            "skillVerificationModal"
        );

    if (oldModal) {
        oldModal.remove();
    }

    createVerificationModal();

    await getNextAIQuestion();
}


/* ============================================================
   CREATE VERIFICATION MODAL
   ============================================================ */

function createVerificationModal() {

    const modal =
        document.createElement("div");

    modal.id =
        "skillVerificationModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:1000000;
        background:rgba(15,23,42,.68);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        backdrop-filter:blur(7px);
    `;

    modal.innerHTML = `

        <div style="
            width:min(700px,100%);
            max-height:92vh;
            overflow-y:auto;
            background:white;
            border-radius:25px;
            padding:30px;
            box-shadow:0 30px 90px rgba(15,23,42,.30);
        ">

            <div style="
                display:flex;
align-items:center;
justify-content:space-between;
gap:20px;
flex-wrap:wrap;
width:100%;
box-sizing:border-box;
            ">

                <div>

                    <div style="
                        color:#2563eb;
                        font-size:12px;
                        font-weight:800;
                        letter-spacing:1.3px;
                    ">
                        ✦ GROQ AI SKILL VERIFICATION
                    </div>

                    <h2 style="
                        margin:8px 0 5px;
                        color:#0f172a;
                    ">
                        ${escapeVerificationText(
                            aiVerification.skill
                        )}
                        Skill Test
                    </h2>

                    <p
                        id="verificationProgress"
                        style="
                            margin:0;
                            color:#64748b;
                            font-size:14px;
                        "
                    >
                        Preparing AI question...
                    </p>

                </div>

                <button
                    type="button"
                    onclick="closeSkillVerification()"
                    style="
                        border:none;
                        background:#f1f5f9;
                        width:38px;
                        height:38px;
                        border-radius:50%;
                        font-size:22px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <div
                id="aiVerificationStatus"
                style="
                    margin-top:20px;
                    padding:11px 14px;
                    border-radius:12px;
                    background:#eff6ff;
                    color:#1d4ed8;
                    font-size:13px;
                    font-weight:600;
                "
            >
                🤖 AI is generating your question...
            </div>


            <div style="
                height:7px;
                background:#e2e8f0;
                border-radius:999px;
                overflow:hidden;
                margin:20px 0;
            ">

                <div
                    id="verificationProgressBar"
                    style="
                        height:100%;
                        width:0%;
                        background:#2563eb;
                        border-radius:999px;
                        transition:.4s;
                    "
                ></div>

            </div>


            <div
                id="verificationQuestion"
            ></div>


            <button
                id="verificationNextBtn"
                type="button"
                onclick="submitAIAnswer()"
                disabled
                style="
                    width:100%;
                    margin-top:24px;
                    padding:15px;
                    border:none;
                    border-radius:13px;
                    background:#94a3b8;
                    color:white;
                    font-size:15px;
                    font-weight:700;
                    cursor:not-allowed;
                "
            >
                Loading AI Question...
            </button>

        </div>
    `;

    document.body.appendChild(modal);
}


/* ============================================================
   GET AI QUESTION
   ============================================================ */

async function getNextAIQuestion() {

    if (
        aiVerification.currentQuestion >=
        aiVerification.totalQuestions
    ) {

        await finishAIVerification();

        return;
    }


    aiVerification.loading = true;

    updateAIStatus(
        "🤖 Groq AI is generating a new question..."
    );

    setVerificationButton(
        "Generating AI Question...",
        true
    );


    try {

        const previousQuestions =
            aiVerification.questions.map(
                question =>
                    question.question
            );


        const response =
            await fetch(
                `${SKILL_API}/api/skill-verification/start`,
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        skill:
                            aiVerification.skill,

                        difficulty:
                            aiVerification.difficulty,

                        previous_questions:
                            previousQuestions

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to generate AI question."
            );

        }


        if (
            !data.success ||
            !data.question
        ) {

            throw new Error(
                "Invalid AI question response."
            );

        }


        const question =
            data.question;


        aiVerification.questions.push(
            question
        );


        aiVerification.loading =
            false;


        renderAIQuestion(
            question
        );


    } catch (error) {

        console.error(
            "AI Question Error:",
            error
        );


        aiVerification.loading =
            false;


        updateAIStatus(
            "❌ AI could not generate the question."
        );


        setVerificationButton(
            "Try Again",
            false
        );


        const button =
            document.getElementById(
                "verificationNextBtn"
            );


        if (button) {

            button.onclick =
                getNextAIQuestion;

        }

    }
}


/* ============================================================
   RENDER QUESTION
   ============================================================ */

function renderAIQuestion(question) {

    const questionBox =
        document.getElementById(
            "verificationQuestion"
        );

    const progress =
        document.getElementById(
            "verificationProgress"
        );

    const progressBar =
        document.getElementById(
            "verificationProgressBar"
        );


    const number =
        aiVerification.currentQuestion + 1;


    if (progress) {

        progress.textContent =
            `Question ${number} of ${
                aiVerification.totalQuestions
            } • ${
                question.difficulty
            }`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${
                (
                    number /
                    aiVerification.totalQuestions
                ) * 100
            }%`;

    }


    updateAIStatus(
        `🤖 AI generated a ${
            question.difficulty
        } level question`
    );


    if (!questionBox) {
        return;
    }


    questionBox.innerHTML = `

        <div style="
            padding:23px;
            border:1px solid #e2e8f0;
            border-radius:18px;
            background:#f8fafc;
        ">

            <span style="
                font-size:11px;
                font-weight:800;
                color:#64748b;
                letter-spacing:1px;
            ">
                AI GENERATED QUESTION
            </span>


            <h3 style="
                margin:15px 0 20px;
                color:#0f172a;
                font-size:19px;
                line-height:1.55;
            ">
                ${escapeVerificationText(
                    question.question
                )}
            </h3>


            <div style="
                display:grid;
                gap:10px;
            ">

                ${
                    question.options
                        .map(
                            (option,index) => `

                                <label
                                    class="ai-answer-option"
                                    style="
                                        display:flex;
                                        align-items:center;
                                        gap:12px;
                                        padding:14px;
                                        border:1px solid #e2e8f0;
                                        border-radius:12px;
                                        background:white;
                                        cursor:pointer;
                                    "
                                >

                                    <input
                                        type="radio"
                                        name="aiSkillAnswer"
                                        value="${index}"
                                        onchange="
                                            enableAIAnswerButton()
                                        "
                                    >

                                    <span style="
                                        color:#334155;
                                        font-size:14px;
                                    ">
                                        ${escapeVerificationText(
                                            option
                                        )}
                                    </span>

                                </label>
                            `
                        )
                        .join("")
                }

            </div>

        </div>
    `;


    setVerificationButton(
        "Submit Answer →",
        true
    );

    /*
     * Important:
     * button should remain disabled until
     * an option is selected.
     */
}


/* ============================================================
   ENABLE SUBMIT
   ============================================================ */

function enableAIAnswerButton() {

    const button =
        document.getElementById(
            "verificationNextBtn"
        );


    if (!button) {
        return;
    }


    button.disabled =
        false;

    button.style.background =
        "#2563eb";

    button.style.cursor =
        "pointer";

    button.textContent =
        "Submit Answer →";
}


/* ============================================================
   SUBMIT ANSWER
   ============================================================ */

async function submitAIAnswer() {

    if (
        aiVerification.loading
    ) {
        return;
    }


    const selected =
        document.querySelector(
            'input[name="aiSkillAnswer"]:checked'
        );


    if (!selected) {

        alert(
            "Please select an answer first."
        );

        return;
    }


    const question =
        aiVerification.questions[
            aiVerification.currentQuestion
        ];


    const studentAnswer =
        Number(
            selected.value
        );


    aiVerification.loading =
        true;


    setVerificationButton(
        "🤖 AI is evaluating...",
        true
    );


    updateAIStatus(
        "🤖 Groq AI is evaluating your answer..."
    );


    try {

        const response =
            await fetch(
                `${SKILL_API}/api/skill-verification/answer`,
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        skill:
                            aiVerification.skill,

                        question:
                            question.question,

                        options:
                            question.options,

                        correct_answer:
                            question.correct_answer,

                        student_answer:
                            studentAnswer,

                        difficulty:
                            question.difficulty

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "AI evaluation failed."
            );

        }


        const evaluation =
            data.evaluation;


        aiVerification.answers.push({

            question:
                question.question,

            difficulty:
                question.difficulty,

            student_answer:
                question.options[
                    studentAnswer
                ],

            correct_answer:
                question.options[
                    question.correct_answer
                ],

            correct:
                evaluation.correct,

            score:
                evaluation.score,

            skill_level_signal:
                evaluation.skill_level_signal,

            feedback:
                evaluation.feedback

        });


        showAIAnswerFeedback(
            evaluation
        );


    } catch (error) {

        console.error(
            "AI Evaluation Error:",
            error
        );


        aiVerification.loading =
            false;


        updateAIStatus(
            "❌ AI evaluation failed."
        );


        setVerificationButton(
            "Try Again",
            false
        );


        const button =
            document.getElementById(
                "verificationNextBtn"
            );


        if (button) {

            button.onclick =
                submitAIAnswer;

        }

    }
}


/* ============================================================
   AFTER ANSWER
   ============================================================ */

function showAIAnswerFeedback(
    evaluation
) {

    /*
     * Don't show correct/incorrect
     * during the test.
     */

    aiVerification.loading =
        false;


    /*
     * Adaptive difficulty
     */

    if (
        evaluation.skill_level_signal ===
        "advanced"
    ) {

        aiVerification.difficulty =
            "Advanced";

    }
    else if (
        evaluation.skill_level_signal ===
        "intermediate"
    ) {

        aiVerification.difficulty =
            "Intermediate";

    }
    else {

        if (
            evaluation.score >= 80 &&
            aiVerification.difficulty ===
            "Basic"
        ) {

            aiVerification.difficulty =
                "Intermediate";

        }

        else if (
            evaluation.score >= 80 &&
            aiVerification.difficulty ===
            "Intermediate"
        ) {

            aiVerification.difficulty =
                "Advanced";

        }

    }


    /*
     * Next question
     */

    if (
        aiVerification.currentQuestion <
        aiVerification.totalQuestions - 1
    ) {

        aiVerification.currentQuestion++;


        setVerificationButton(
            "Generating next AI question...",
            true
        );


        updateAIStatus(
            "🤖 AI is preparing your next question..."
        );


        setTimeout(
            () => {

                getNextAIQuestion();

            },
            500
        );


    } else {

        setVerificationButton(
            "Generating final AI assessment...",
            true
        );


        updateAIStatus(
            "🤖 AI is analyzing your complete performance..."
        );


        setTimeout(
            () => {

                finishAIVerification();

            },
            700
        );

    }

}


/* ============================================================
   FINAL AI ASSESSMENT
   ============================================================ */

async function finishAIVerification() {

    if (
        aiVerification.loading
    ) {

        return;

    }


    aiVerification.loading =
        true;


    setVerificationButton(
        "🤖 AI is calculating final score...",
        true
    );


    updateAIStatus(
        "🤖 Groq AI is analyzing your complete performance..."
    );


    try {

        const response =
            await fetch(
                `${SKILL_API}/api/skill-verification/final`,
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        skill:
                            aiVerification.skill,

                        answers:
                            aiVerification.answers

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Final AI evaluation failed."
            );

        }


        const result =
            data.verification;


        localStorage.setItem(
            "skillVerification",
            JSON.stringify({

                ...result,

                verifiedAt:
                    new Date().toISOString()

            })
        );

        // ========================================================
// VERIFICATION COMPLETE
// ========================================================

if (
    result &&
    result.verified === true
) {

    unlockStudentFeatures();

}


// ========================================================
// REMOVE AUTO START FLAG
// ========================================================

localStorage.removeItem(
    "autoStartSkillVerification"
);


        showFinalAIResult(
            result
        );


    } catch (error) {

        console.error(
            "Final AI Error:",
            error
        );


        aiVerification.loading =
            false;


        updateAIStatus(
            "❌ Final AI evaluation failed."
        );


        setVerificationButton(
            "Try Again",
            false
        );


        const button =
            document.getElementById(
                "verificationNextBtn"
            );


        if (button) {

            button.onclick =
                finishAIVerification;

        }

    }
}



/* ============================================================
   FINAL RESULT
   ============================================================ */

function showFinalAIResult(result) {

    const modal =
        document.getElementById(
            "skillVerificationModal"
        );


    if (!modal) {
        return;
    }


    modal.innerHTML = `

        <div style="
            width:min(650px,100%);
            background:white;
            border-radius:26px;
            padding:34px;
            text-align:center;
            box-shadow:0 30px 90px rgba(15,23,42,.30);
        ">

            <div style="
                width:78px;
                height:78px;
                margin:0 auto 15px;
                border-radius:50%;
                background:#dcfce7;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:39px;
            ">
                ${
                    result.verified
                        ? "🏆"
                        : "📊"
                }
            </div>


            <div style="
                color:#16a34a;
                font-size:12px;
                font-weight:800;
                letter-spacing:1.2px;
            ">
                ${
                    result.verified
                        ? "AI VERIFIED"
                        : "AI ASSESSED"
                }
            </div>


            <h2 style="
                margin:8px 0;
                color:#0f172a;
            ">
                ${escapeVerificationText(
                    result.skill
                )}

                ${
                    result.verified
                        ? " Skill Verified"
                        : " Skill Assessment"
                }
            </h2>


            <div style="
                font-size:58px;
                font-weight:850;
                color:#2563eb;
                margin:20px 0 5px;
            ">
                ${result.overall_score}%
            </div>


            <p style="
                margin:0;
                color:#64748b;
            ">
                AI Confidence:
                <strong>
                    ${result.ai_confidence}%
                </strong>
            </p>


            <div style="
                display:inline-block;
                margin-top:15px;
                padding:8px 15px;
                border-radius:999px;
                background:#eff6ff;
                color:#1d4ed8;
                font-size:13px;
                font-weight:800;
            ">
                ${escapeVerificationText(
                    result.level
                )}
                Level
            </div>


            <div style="
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:10px;
                margin:25px 0;
            ">

                <div style="
                    padding:15px;
                    border-radius:14px;
                    background:#f8fafc;
                ">
                    <strong>
                        ${result.knowledge_score}%
                    </strong>

                    <small style="
                        display:block;
                        color:#64748b;
                    ">
                        Knowledge
                    </small>
                </div>


                <div style="
                    padding:15px;
                    border-radius:14px;
                    background:#f8fafc;
                ">
                    <strong>
                        ${result.problem_solving_score}%
                    </strong>

                    <small style="
                        display:block;
                        color:#64748b;
                    ">
                        Problem Solving
                    </small>
                </div>


                <div style="
                    padding:15px;
                    border-radius:14px;
                    background:#f8fafc;
                ">
                    <strong>
                        ${result.practical_score}%
                    </strong>

                    <small style="
                        display:block;
                        color:#64748b;
                    ">
                        Practical
                    </small>
                </div>

            </div>


            <div style="
                padding:14px;
                border-radius:13px;
                background:#f8fafc;
                color:#475569;
                font-size:13px;
                line-height:1.5;
                text-align:left;
            ">

                <strong>
                    🤖 AI Assessment
                </strong>

                <br>

                ${escapeVerificationText(
                    result.summary || ""
                )}

            </div>


            <button
                type="button"
                onclick="
                    closeSkillVerification();
                    updateVerificationCard();
                "
                style="
                    width:100%;
                    margin-top:20px;
                    padding:15px;
                    border:none;
                    border-radius:13px;
                    background:#2563eb;
                    color:white;
                    font-size:15px;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                Continue to AI Matching →
            </button>

        </div>
    `;
}


/* ============================================================
   UI HELPERS
   ============================================================ */

function updateAIStatus(message) {

    const status =
        document.getElementById(
            "aiVerificationStatus"
        );


    if (status) {

        status.textContent =
            message;

    }

}


function setVerificationButton(
    text,
    disabled
) {

    const button =
        document.getElementById(
            "verificationNextBtn"
        );


    if (!button) {
        return;
    }


    button.textContent =
        text;


    button.disabled =
        disabled;


    if (disabled) {

        button.style.background =
            "#94a3b8";

        button.style.cursor =
            "not-allowed";

    } else {

        button.style.background =
            "#2563eb";

        button.style.cursor =
            "pointer";

    }

}


// ============================================================
// CLOSE VERIFICATION MODAL
// ============================================================

function closeSkillVerification() {

    const modal =
        document.getElementById(
            "skillVerificationModal"
        );


    if (modal) {

        modal.remove();

    }


    // ========================================================
    // CHECK IF VERIFICATION IS ACTUALLY COMPLETE
    // ========================================================

    if (!isStudentVerified()) {

    console.log(
        "🔒 Verification incomplete."
    );

    const profile =
        getProfile();

    const teachSkills =
        normalizeArray(
            profile.skills
        );

    // Lock only if the student has
    // a skill they want to teach.
    if (teachSkills.length > 0) {

        localStorage.setItem(
            "matchingLocked",
            "true"
        );

        localStorage.setItem(
            "sessionsLocked",
            "true"
        );

        localStorage.setItem(
            "connectionsLocked",
            "true"
        );

    }

}
}

/* ============================================================
   UPDATE VERIFICATION CARD
   ============================================================ */

function updateVerificationCard() {

    const score =
        document.getElementById(
            "verificationScore"
        );


    const status =
        document.getElementById(
            "verificationStatus"
        );


    if (!score || !status) {
        return;
    }


    const saved =
        localStorage.getItem(
            "skillVerification"
        );


    if (!saved) {

        score.textContent =
            "—";

        status.textContent =
            "Not verified yet";

        return;

    }


    try {

        const result =
            JSON.parse(saved);


        score.textContent =
            `${result.overall_score}%`;


        status.textContent =
            result.verified
                ? `✓ ${result.skill} Verified`
                : `${result.level} Level`;


    } catch (error) {

        console.error(
            "Verification data error:",
            error
        );

    }

}


/* ============================================================
   LOAD SAVED VERIFICATION
   ============================================================ */

setTimeout(
    function () {

        updateVerificationCard();

    },
    300
);
/* =========================================================
   SKILLFORGE — APP NAVIGATION
   Safe navigation layer
   Does NOT replace existing dashboard functionality
   ========================================================= */

(function () {

    document.addEventListener("DOMContentLoaded", function () {

        const sidebar = document.querySelector(".sidebar");
        const main = document.querySelector(".dashboard-main");
        const nav = document.querySelector(".side-nav");

        if (!sidebar || !main || !nav) {
            console.warn("SkillForge navigation: required elements not found.");
            return;
        }


        /* =====================================================
           SIDEBAR TOGGLE BUTTON
        ===================================================== */

        let toggle = document.getElementById("sidebarToggle");

        if (!toggle) {

            toggle = document.createElement("button");

            toggle.id = "sidebarToggle";

            toggle.type = "button";

            toggle.className = "sidebar-toggle";

            toggle.setAttribute(
                "aria-label",
                "Toggle navigation"
            );

            toggle.innerHTML = "☰";

            sidebar.prepend(toggle);
        }


        toggle.addEventListener("click", function () {

            document.body.classList.toggle(
                "sidebar-collapsed"
            );

        });



        /* =====================================================
           MOBILE OVERLAY
        ===================================================== */

        let overlay =
            document.getElementById("sidebarOverlay");

        if (!overlay) {

            overlay =
                document.createElement("div");

            overlay.id =
                "sidebarOverlay";

            overlay.className =
                "sidebar-overlay";

            document.body.appendChild(
                overlay
            );
        }


        overlay.addEventListener(
            "click",
            function () {

                document.body.classList.remove(
                    "sidebar-open"
                );

            }
        );



        /* =====================================================
           NAVIGATION ITEMS
        ===================================================== */

        const links =
            nav.querySelectorAll("a");


        links.forEach(function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const text =
                        link.textContent
                            .trim()
                            .toLowerCase();


                    /*
                     * Active navigation
                     */

                    links.forEach(function (item) {

                        item.classList.remove(
                            "active"
                        );

                    });


                    link.classList.add(
                        "active"
                    );


                    /*
                     * Decide which screen to show
                     */

                    if (
                        text.includes("dashboard")
                    ) {

                        showDashboardHome();

                    }

                    else if (
                        text.includes("find matches")
                    ) {

                        showMatchesScreen();

                    }

                    else if (
                        text.includes("skill exchange")
                    ) {

                        showExchangeScreen();

                    }

                    else if (
                        text.includes("connections")
                    ) {

                        showConnectionsScreen();

                    }

                    else if (
                        text.includes("doubt")
                    ) {

                        showComingSoon(
                            "Doubt Hub",
                            "Ask questions, share solutions and learn from other students."
                        );

                    }

                    else if (
                        text.includes("opportunities")
                    ) {

                        showComingSoon(
                            "Opportunities",
                            "Discover hackathons, competitions, internships and student opportunities."
                        );

                    }

                    else if (
                        text.includes("settings")
                    ) {

                        showComingSoon(
                            "Settings",
                            "Manage your account and application preferences."
                        );

                    }


                    /*
                     * On mobile / collapsed navigation
                     */

                    if (
                        window.innerWidth <= 900
                    ) {

                        document.body.classList.remove(
                            "sidebar-open"
                        );

                    }

                }

            );

        });



        /* =====================================================
           CREATE ADDITIONAL APP VIEWS
        ===================================================== */

        createExtraViews();


        /*
         * Start on dashboard
         */

        showDashboardHome();

    });



    /* =========================================================
       VIEW HELPERS
    ========================================================= */

    function getSection(id) {

        return document.getElementById(id);

    }


    function hideMainSections() {

    const sections = [
        "matches",
        "exchange",
        "connections",
        "verification",
        "messagesView",
        "sessionsView",
        "historyView",
        "genericAppView",
        "dynamicAppScreen"
    ];

    sections.forEach(function (id) {

        const element =
            document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }

    });


    const grid =
        document.querySelector(
            ".dashboard-grid"
        );

    if (grid) {
        grid.style.display = "none";
    }


    const quick =
        document.querySelector(
            ".quick-actions"
        );

    if (quick) {
        quick.style.display = "none";
    }
}



    /* =========================================================
       DASHBOARD HOME
    ========================================================= */

    window.showDashboardHome =
    function () {

        hideMainSections();


        const grid =
            document.querySelector(
                ".dashboard-grid"
            );

        if (grid) {
            grid.style.display = "grid";
        }


        const quick =
            document.querySelector(
                ".quick-actions"
            );

        if (quick) {
            quick.style.display = "grid";
        }


        const verification =
            document.getElementById(
                "verification"
            );

        if (verification) {
            verification.style.display = "block";
        }


        updatePageTitle(
            "Dashboard",
            "Find the right people. Learn. Collaborate. Grow."
        );

    };



    /* =========================================================
       PROFILE
    ========================================================= */

    window.showProfileScreen =
        function () {

            hideMainSections();


            const grid =
                document.querySelector(
                    ".dashboard-grid"
                );


            if (!grid) {
                return;
            }


            grid.style.display =
                "grid";


            const profile =
                document.querySelector(
                    ".profile-card"
                );


            const ai =
                document.querySelector(
                    ".ai-card"
                );


            const quick =
                document.querySelector(
                    ".quick-actions"
                );


            if (quick) {

                quick.style.display =
                    "none";

            }


            if (profile) {

                profile.style.display =
                    "block";

            }


            if (ai) {

                ai.style.display =
                    "none";

            }


            updatePageTitle(
                "My Profile",
                "Manage your student profile, skills and learning goals."
            );

        };



    /* =========================================================
       MATCHES
    ========================================================= */

    window.showMatchesScreen =
        function () {

            hideMainSections();


            const section =
                getSection("matches");


            if (section) {

                section.style.display =
                    "block";

            }


            /*
             * Use the REAL matching function.
             */

            if (
                typeof window.findMutualExchange ===
                "function"
            ) {

                window.findMutualExchange();

            }

            else if (
                typeof window.findMatches ===
                "function"
            ) {

                window.findMatches();

            }


            updatePageTitle(
                "Find Matches",
                "Discover students whose skills and goals match yours."
            );

        };



    /* =========================================================
       SKILL EXCHANGE
    ========================================================= */

    window.showExchangeScreen =
        function () {

            hideMainSections();


            const section =
                getSection("exchange");


            if (section) {

                section.style.display =
                    "block";

            }


            updatePageTitle(
                "Skill Exchange",
                "Share what you can teach and what you want to learn."
            );

        };



    /* =========================================================
       CONNECTIONS
    ========================================================= */

    window.showConnectionsScreen =
        function () {

            hideMainSections();


            const section =
                getSection(
                    "connections"
                );


            if (section) {

                section.style.display =
                    "block";

            }


            if (
                typeof window.loadConnectionRequests ===
                "function"
            ) {

                window.loadConnectionRequests();

            }


            if (
                typeof window.loadConnectedStudents ===
                "function"
            ) {

                window.loadConnectedStudents();

            }


            updatePageTitle(
                "Connections",
                "Manage your student network and accepted connections."
            );

        };



    /* =========================================================
       EXTRA APP VIEWS
    ========================================================= */

    function createExtraViews() {

        const main =
            document.querySelector(
                ".dashboard-main"
            );


        if (!main) {
            return;
        }


        createSimpleView(
            "messagesView",
            "Messages",
            "Chat with students after you connect.",
            "💬"
        );


        createSessionView();


        createSimpleView(
            "historyView",
            "History",
            "See your previous skill exchanges, sessions and activity.",
            "▣"
        );

    }

    function createSessionView() {

    if (document.getElementById("sessionsView")) {
        return;
    }

    const main =
        document.querySelector(".dashboard-main");

    if (!main) return;

    const section =
        document.createElement("section");

    section.id = "sessionsView";
    section.className = "dashboard-card";
    section.style.display = "none";

    section.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:20px;
            margin-bottom:25px;
            flex-wrap:wrap;
        ">

            <div>
                <span style="
                    color:#2563eb;
                    font-size:12px;
                    font-weight:800;
                    letter-spacing:1px;
                ">
                    LIVE LEARNING
                </span>

                <h2 style="
                    margin:6px 0;
                    color:#0f172a;
                ">
                    Live Sessions
                </h2>

                <p style="
                    margin:0;
                    color:#64748b;
                ">
                    Book a private learning session with your connection.
                </p>
            </div>

            <button
                type="button"
                onclick="openBookSessionModal()"
                style="
                    border:none;
                    background:#2563eb;
                    color:white;
                    padding:12px 18px;
                    border-radius:12px;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                + Book Session
            </button>

        </div>


        <!-- UPCOMING -->

        <div style="
            padding:20px;
            border:1px solid #e2e8f0;
            border-radius:18px;
            margin-bottom:20px;
        ">

            <h3 style="margin:0 0 15px;">
                📅 Upcoming Sessions
            </h3>

            <div id="upcomingSessions">

                <div style="
                    text-align:center;
                    padding:30px;
                    color:#94a3b8;
                ">
                    No sessions booked yet.
                </div>

            </div>

        </div>


        <!-- NOTES -->

        <div style="
            padding:20px;
            border:1px solid #e2e8f0;
            border-radius:18px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
            ">

                <div>
                    <h3 style="margin:0;">
                        📚 Session Notes & Resources
                    </h3>

                    <p style="
                        margin:5px 0 0;
                        color:#64748b;
                        font-size:13px;
                    ">
                        Upload notes, PDFs or study material.
                    </p>
                </div>

                <label style="
                    background:#eff6ff;
                    color:#2563eb;
                    padding:10px 14px;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                ">

                    + Upload

                    <input
                        type="file"
                        id="sessionNotesUpload"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                        hidden
                    >

                </label>

            </div>

            <div
                id="sessionNotesList"
                style="margin-top:15px;"
            >

                <p style="
                    color:#94a3b8;
                    text-align:center;
                    padding:20px;
                ">
                    No notes uploaded yet.
                </p>

            </div>

        </div>

    `;

    main.appendChild(section);


    const upload =
        section.querySelector(
            "#sessionNotesUpload"
        );

    upload?.addEventListener(
        "change",
        handleSessionNotesUpload
    );
}

function openBookSessionModal() {

    const old =
        document.getElementById(
            "bookSessionModal"
        );

    if (old) old.remove();


    const connections =
        window.latestMutualMatches || [];


    const modal =
        document.createElement("div");

    modal.id =
        "bookSessionModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(15,23,42,.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
    `;


    modal.innerHTML = `

        <div style="
            width:min(500px,100%);
            background:white;
            border-radius:22px;
            padding:28px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">

                <h2 style="margin:0;">
                    📅 Book Live Session
                </h2>

                <button
                    type="button"
                    onclick="document.getElementById('bookSessionModal')?.remove()"
                    style="
                        border:none;
                        background:#f1f5f9;
                        width:36px;
                        height:36px;
                        border-radius:50%;
                        font-size:20px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <p style="
                color:#64748b;
                margin-bottom:20px;
            ">
                Choose who you want to learn or teach with.
            </p>


            <label>
                <strong>Student</strong>

                <select
                    id="sessionStudent"
                    style="
                        width:100%;
                        margin-top:7px;
                        padding:12px;
                        border:1px solid #dbe3ef;
                        border-radius:10px;
                    "
                >

                    <option value="">
                        Select a connected student
                    </option>

                    ${connections.map(student => `
                        <option
                            value="${student.email || student.id}"
                        >
                            ${escapeText(
                                student.name || "Student"
                            )}
                        </option>
                    `).join("")}

                </select>

            </label>


            <label style="
                display:block;
                margin-top:15px;
            ">

                <strong>Session Topic</strong>

                <input
                    id="sessionTopic"
                    type="text"
                    placeholder="e.g. React Basics"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        margin-top:7px;
                        padding:12px;
                        border:1px solid #dbe3ef;
                        border-radius:10px;
                    "
                >

            </label>


            <label style="
                display:block;
                margin-top:15px;
            ">

                <strong>Date</strong>

                <input
                    id="sessionDate"
                    type="date"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        margin-top:7px;
                        padding:12px;
                        border:1px solid #dbe3ef;
                        border-radius:10px;
                    "
                >

            </label>


            <label style="
                display:block;
                margin-top:15px;
            ">

                <strong>Time Slot</strong>

                <select
                    id="sessionTime"
                    style="
                        width:100%;
                        margin-top:7px;
                        padding:12px;
                        border:1px solid #dbe3ef;
                        border-radius:10px;
                    "
                >

                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>12:00 PM</option>
                    <option>02:00 PM</option>
                    <option>03:00 PM</option>
                    <option>04:00 PM</option>
                    <option>05:00 PM</option>
                    <option>06:00 PM</option>
                    <option>07:00 PM</option>

                </select>

            </label>


            <button
                type="button"
                onclick="bookDemoSession()"
                style="
                    width:100%;
                    margin-top:22px;
                    border:none;
                    background:#2563eb;
                    color:white;
                    padding:13px;
                    border-radius:12px;
                    font-weight:800;
                    cursor:pointer;
                "
            >
                Book Session →
            </button>

        </div>

    `;

    document.body.appendChild(modal);
}

function bookDemoSession() {

    const student =
        document.getElementById(
            "sessionStudent"
        )?.value;

    const topic =
        document.getElementById(
            "sessionTopic"
        )?.value.trim();

    const date =
        document.getElementById(
            "sessionDate"
        )?.value;

    const time =
        document.getElementById(
            "sessionTime"
        )?.value;


    if (!student || !topic || !date) {

        alert(
            "Please select a student, topic and date."
        );

        return;
    }


    const session = {

        id:
            Date.now(),

        student:
            student,

        topic:
            topic,

        date:
            date,

        time:
            time,

        status:
            "Booked",

        createdAt:
            new Date().toISOString()

    };


    const sessions =
        JSON.parse(
            localStorage.getItem(
                "skillforgeSessions"
            ) || "[]"
        );


    sessions.push(session);


    localStorage.setItem(
        "skillforgeSessions",
        JSON.stringify(sessions)
    );


    document
        .getElementById(
            "bookSessionModal"
        )
        ?.remove();


    renderBookedSessions();

    alert(
        "✅ Session booked successfully!"
    );
}

function renderBookedSessions() {

    const container =
        document.getElementById(
            "upcomingSessions"
        );

    if (!container) return;


    const sessions =
        JSON.parse(
            localStorage.getItem(
                "skillforgeSessions"
            ) || "[]"
        );


    if (!sessions.length) {

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:30px;
                color:#94a3b8;
            ">
                No sessions booked yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        sessions.map(session => `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                padding:16px;
                margin-bottom:12px;
                background:#f8fafc;
                border-radius:14px;
                flex-wrap:wrap;
            ">

                <div>

                    <strong>
                        ${escapeText(session.topic)}
                    </strong>

                    <div style="
                        color:#64748b;
                        font-size:13px;
                        margin-top:5px;
                    ">
                        👤 ${escapeText(session.student)}
                    </div>

                    <div style="
                        color:#64748b;
                        font-size:13px;
                    ">
                        📅 ${session.date}
                        &nbsp; • &nbsp;
                        ⏰ ${session.time}
                    </div>

                </div>


                <button
                    type="button"
                    onclick="openLiveSession('${session.id}')"
                    style="
                        border:none;
                        background:#16a34a;
                        color:white;
                        padding:10px 15px;
                        border-radius:10px;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    🎥 Join Live
                </button>

            </div>

        `).join("");
}

function handleSessionNotesUpload(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    const list =
        document.getElementById(
            "sessionNotesList"
        );

    if (!list) return;


    const item =
        document.createElement("div");

    item.style.cssText = `
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:12px;
        background:#f8fafc;
        border-radius:10px;
        margin-top:8px;
    `;

    item.innerHTML = `

        <span>
            📄 ${escapeText(file.name)}
        </span>

        <small style="color:#64748b;">
            ${(file.size / 1024).toFixed(1)} KB
        </small>

    `;

    list.querySelector("p")?.remove();

    list.appendChild(item);

    event.target.value = "";
}

function openLiveSession(sessionId) {

    const modal =
        document.createElement("div");

    modal.id =
        "liveSessionModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:999999;
        background:#020617;
        display:flex;
        flex-direction:column;
    `;


    modal.innerHTML = `

        <div style="
            padding:15px 20px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            color:white;
            background:#0f172a;
        ">

            <div>
                <strong>
                    🎥 SkillForge Live Session
                </strong>

                <small style="
                    display:block;
                    color:#94a3b8;
                    margin-top:3px;
                ">
                    Session #${sessionId}
                </small>
            </div>

            <span style="
                color:#22c55e;
                font-weight:700;
            ">
                ● LIVE
            </span>

        </div>


        <div style="
            flex:1;
            display:grid;
            grid-template-columns:2fr 1fr;
            gap:15px;
            padding:15px;
            min-height:0;
        ">

            <div style="
                background:#111827;
                border-radius:18px;
                position:relative;
                overflow:hidden;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#94a3b8;
            ">

                <video
                    id="remoteVideo"
                    autoplay
                    playsinline
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        background:#111827;
                    "
                ></video>

                <div style="
                    position:absolute;
                    font-size:60px;
                    opacity:.35;
                ">
                    👤
                </div>

            </div>


            <div style="
                background:#0f172a;
                border-radius:18px;
                display:flex;
                flex-direction:column;
                overflow:hidden;
            ">

                <div style="
                    padding:15px;
                    color:white;
                    border-bottom:1px solid #1e293b;
                    font-weight:700;
                ">
                    💬 Session Chat
                </div>

                <div
                    id="liveSessionChat"
                    style="
                        flex:1;
                        overflow:auto;
                        padding:15px;
                        color:#cbd5e1;
                    "
                >
                    <p style="color:#64748b;">
                        Session chat is ready.
                    </p>
                </div>

                <div style="
                    display:flex;
                    gap:8px;
                    padding:10px;
                ">

                    <input
                        id="liveChatInput"
                        placeholder="Message..."
                        style="
                            flex:1;
                            padding:10px;
                            border-radius:8px;
                            border:1px solid #334155;
                            background:#1e293b;
                            color:white;
                        "
                    >

                    <button
                        type="button"
                        onclick="sendLiveSessionChat()"
                        style="
                            border:none;
                            background:#2563eb;
                            color:white;
                            border-radius:8px;
                            padding:10px 14px;
                        "
                    >
                        Send
                    </button>

                </div>

            </div>

        </div>


        <div style="
            padding:15px;
            display:flex;
            justify-content:center;
            gap:10px;
            flex-wrap:wrap;
            background:#0f172a;
        ">

            <button
                type="button"
                onclick="toggleLiveMic(this)"
                style="
                    border:none;
                    padding:12px 18px;
                    border-radius:10px;
                    cursor:pointer;
                "
            >
                🎤 Mic
            </button>

            <button
                type="button"
                onclick="toggleLiveCamera(this)"
                style="
                    border:none;
                    padding:12px 18px;
                    border-radius:10px;
                    cursor:pointer;
                "
            >
                📹 Camera
            </button>

            <button
                type="button"
                onclick="startSessionRecording()"
                style="
                    border:none;
                    background:#334155;
                    color:white;
                    padding:12px 18px;
                    border-radius:10px;
                    cursor:pointer;
                "
            >
                ⏺ Record
            </button>

            <button
                type="button"
                onclick="closeLiveSession()"
                style="
                    border:none;
                    background:#dc2626;
                    color:white;
                    padding:12px 22px;
                    border-radius:10px;
                    font-weight:800;
                    cursor:pointer;
                "
            >
                📞 End Session
            </button>

        </div>

    `;

    document.body.appendChild(modal);


    startLocalPreview();
}

let skillForgeLocalStream = null;

async function startLocalPreview() {

    try {

        skillForgeLocalStream =
            await navigator.mediaDevices.getUserMedia({
                video:true,
                audio:true
            });

        const video =
            document.getElementById(
                "remoteVideo"
            );

        if (video) {

            video.srcObject =
                skillForgeLocalStream;

        }

    } catch (error) {

        console.warn(
            "Camera unavailable:",
            error
        );

    }
}


function toggleLiveMic(button) {

    if (!skillForgeLocalStream) return;

    const track =
        skillForgeLocalStream.getAudioTracks()[0];

    if (!track) return;

    track.enabled =
        !track.enabled;

    button.textContent =
        track.enabled
            ? "🎤 Mic"
            : "🔇 Muted";
}


function toggleLiveCamera(button) {

    if (!skillForgeLocalStream) return;

    const track =
        skillForgeLocalStream.getVideoTracks()[0];

    if (!track) return;

    track.enabled =
        !track.enabled;

    button.textContent =
        track.enabled
            ? "📹 Camera"
            : "🚫 Camera Off";
}


function startSessionRecording() {

    alert(
        "⏺ Recording option is available in the session UI. Recording backend will be enabled in the production version."
    );
}


function sendLiveSessionChat() {

    const input =
        document.getElementById(
            "liveChatInput"
        );

    const chat =
        document.getElementById(
            "liveSessionChat"
        );

    if (!input || !chat) return;

    const message =
        input.value.trim();

    if (!message) return;

    const item =
        document.createElement("div");

    item.style.cssText = `
        background:#1e293b;
        padding:9px 11px;
        border-radius:9px;
        margin-bottom:8px;
    `;

    item.textContent =
        message;

    chat.appendChild(item);

    input.value = "";

    chat.scrollTop =
        chat.scrollHeight;
}


function closeLiveSession() {

    if (skillForgeLocalStream) {

        skillForgeLocalStream
            .getTracks()
            .forEach(track => track.stop());

        skillForgeLocalStream =
            null;
    }

    document
        .getElementById(
            "liveSessionModal"
        )
        ?.remove();
}



    function createSimpleView(
        id,
        title,
        description,
        icon
    ) {

        if (
            document.getElementById(id)
        ) {
            return;
        }


        const section =
            document.createElement(
                "section"
            );


        section.id = id;

        section.className =
            "dashboard-card app-placeholder-view";


        section.style.display =
            "none";


        section.innerHTML = `

            <div class="placeholder-icon">
                ${icon}
            </div>

            <span class="card-label">
                SKILLFORGE
            </span>

            <h2>
                ${title}
            </h2>

            <p>
                ${description}
            </p>

            <span class="placeholder-note">
                This module is ready for the prototype flow.
            </span>

        `;


        const main =
            document.querySelector(
                ".dashboard-main"
            );


        main.appendChild(
            section
        );

    }



    /* =========================================================
       COMING SOON
    ========================================================= */

    window.showComingSoon =
        function (
            title,
            description
        ) {

            hideMainSections();


            [
                "messagesView",
                "sessionsView",
                "historyView"
            ]
                .forEach(function (id) {

                    const element =
                        document.getElementById(
                            id
                        );

                    if (element) {

                        element.style.display =
                            "none";

                    }

                });


            let view =
                document.getElementById(
                    "genericAppView"
                );


            if (!view) {

                view =
                    document.createElement(
                        "section"
                    );

                view.id =
                    "genericAppView";

                view.className =
                    "dashboard-card app-placeholder-view";


                const main =
                    document.querySelector(
                        ".dashboard-main"
                    );


                main.appendChild(
                    view
                );

            }


            view.style.display =
                "block";


            view.innerHTML = `

                <div class="placeholder-icon">
                    ✦
                </div>

                <span class="card-label">
                    SKILLFORGE
                </span>

                <h2>
                    ${escapeText(title)}
                </h2>

                <p>
                    ${escapeText(description)}
                </p>

                <span class="placeholder-note">
                    Coming soon in the full platform.
                </span>

            `;


            updatePageTitle(
                title,
                description
            );

        };



    /* =========================================================
       PAGE HEADER
    ========================================================= */

    function updatePageTitle(
        title,
        subtitle
    ) {

        const heading =
            document.querySelector(
                ".dashboard-header h1"
            );


        const subtitleElement =
            document.querySelector(
                ".header-subtitle"
            );


        if (heading) {

            const user =
                document.getElementById(
                    "userName"
                );


            const name =
                user
                    ? user.textContent
                    : "Student";


            if (
                title === "Dashboard"
            ) {

                heading.innerHTML =
                    `Good morning, <span id="userName">${escapeText(name)}</span> 👋`;

            }

            else {

                heading.textContent =
                    title;

            }

        }


        if (subtitleElement) {

            subtitleElement.textContent =
                subtitle;

        }

    }



    /* =========================================================
       SAFE TEXT
    ========================================================= */

    function escapeText(value) {

        return String(value || "")
            .replace(
                /[&<>"']/g,
                function (char) {

                    return {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#039;"

                    }[char];

                }
            );

    }



    /* =========================================================
       EXTRA NAVIGATION SUPPORT
       ========================================================= */

    window.openAppView =
        function (view) {

            switch (view) {

                case "profile":
                    showProfileScreen();
                    break;

                case "matches":
                    showMatchesScreen();
                    break;

                case "exchange":
                    showExchangeScreen();
                    break;

                case "connections":
                    showConnectionsScreen();
                    break;

                case "messages":

                    const messages =
                        document.getElementById(
                            "messagesView"
                        );

                    hideMainSections();

                    if (messages) {
                        messages.style.display =
                            "block";
                    }

                    updatePageTitle(
                        "Messages",
                        "Chat with your connections."
                    );

                    break;


                case "sessions":

    const sessions =
        document.getElementById(
            "sessionsView"
        );

    hideMainSections();

    if (sessions) {

        sessions.style.display =
            "block";

        renderBookedSessions();

    }

    updatePageTitle(
        "Sessions",
        "Book, join and manage your live skill-exchange sessions."
    );

    break;

            }

        };

})();
/* ============================================================
   SKILLFORGE — PITCH EMERGENCY FIX
   DO NOT DELETE EXISTING CODE
   ============================================================ */

(function () {

    "use strict";


    function hideAllScreens() {

        const selectors = [

            ".quick-actions",

            ".dashboard-grid",

            "#verification",

            "#matches",

            "#exchange",

            "#connections",

            "#mutualResults",

            "#dynamicSkillForgeScreen",

            "#messagesView",

            "#sessionsView",

            "#historyView"

        ];


        selectors.forEach(
            function (selector) {

                document
                    .querySelectorAll(selector)
                    .forEach(
                        function (element) {

                            element.style.setProperty(
                                "display",
                                "none",
                                "important"
                            );

                        }
                    );

            }
        );


        document
            .querySelectorAll(
                ".skillforge-dynamic-screen"
            )
            .forEach(
                function (element) {

                    element.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );

                }
            );

    }



    function setActive(link) {

        document
            .querySelectorAll(
                ".side-nav a"
            )
            .forEach(
                function (item) {

                    item.classList.remove(
                        "active"
                    );

                }
            );


        if (link) {

            link.classList.add(
                "active"
            );

        }

    }



    function setHeader(
        title,
        subtitle
    ) {

        const heading =
            document.querySelector(
                ".dashboard-header h1"
            );

        const description =
            document.querySelector(
                ".header-subtitle"
            );


        if (heading) {

            heading.textContent =
                title;

        }


        if (description) {

            description.textContent =
                subtitle;

        }

    }



    /* =========================================================
       DASHBOARD
       ========================================================= */

    function openDashboard(link) {

        hideAllScreens();

        setActive(link);


        const quick =
            document.querySelector(
                ".quick-actions"
            );

        const grid =
            document.querySelector(
                ".dashboard-grid"
            );

        const verification =
            document.getElementById(
                "verification"
            );


        if (quick) {

            quick.style.setProperty(
                "display",
                "grid",
                "important"
            );

        }


        if (grid) {

            grid.style.setProperty(
                "display",
                "grid",
                "important"
            );


            /*
             * Restore dashboard children.
             */

            grid
                .querySelectorAll(
                    ":scope > *"
                )
                .forEach(
                    function (item) {

                        item.style.removeProperty(
                            "display"
                        );

                    }
                );

        }


        if (verification) {

            verification.style.setProperty(
                "display",
                "block",
                "important"
            );

        }


        setHeader(
            "Dashboard",
            "Find the right people. Learn. Collaborate. Grow."
        );

    }



    /* =========================================================
       PROFILE
       ========================================================= */

    function openProfile(link) {

        hideAllScreens();

        setActive(link);


        const grid =
            document.querySelector(
                ".dashboard-grid"
            );

        const profile =
            document.querySelector(
                ".profile-card"
            );


        /*
         * Grid MUST remain visible because
         * profile-card is inside it.
         */

        if (grid) {

            grid.style.setProperty(
                "display",
                "block",
                "important"
            );


            /*
             * Hide every dashboard card.
             */

            grid
                .querySelectorAll(
                    ":scope > *"
                )
                .forEach(
                    function (item) {

                        item.style.setProperty(
                            "display",
                            "none",
                            "important"
                        );

                    }
                );

        }


        /*
         * Show ONLY profile.
         */

        if (profile) {

            profile.style.setProperty(
                "display",
                "block",
                "important"
            );

        }


        setHeader(
            "My Profile",
            "Manage your student profile, skills and learning goals."
        );

    }



    /* =========================================================
       MATCHES
       ========================================================= */

    function openMatches(link) {

        hideAllScreens();

        setActive(link);


        const matches =
            document.getElementById(
                "matches"
            );


        if (matches) {

            matches.style.setProperty(
                "display",
                "block",
                "important"
            );

        }


        setHeader(
            "Find Matches",
            "Discover students whose skills and goals match yours."
        );

    }



    /* =========================================================
       EXCHANGE
       ========================================================= */

    function openExchange(link) {

        hideAllScreens();

        setActive(link);


        const exchange =
            document.getElementById(
                "exchange"
            );


        if (exchange) {

            exchange.style.setProperty(
                "display",
                "block",
                "important"
            );

        }


        setHeader(
            "Skill Exchange",
            "Share what you can teach and what you want to learn."
        );

    }



    /* =========================================================
       CONNECTIONS
       ========================================================= */

    function openConnections(link) {

        hideAllScreens();

        setActive(link);


        const connections =
            document.getElementById(
                "connections"
            );


        if (connections) {

            connections.style.setProperty(
                "display",
                "block",
                "important"
            );

        }


        setHeader(
            "Connections",
            "Manage your student network and connection requests."
        );


        /*
         * Existing connection functions.
         */

        try {

            if (
                typeof window.loadConnectionRequests ===
                "function"
            ) {

                window.loadConnectionRequests();

            }

        }

        catch (error) {

            console.warn(
                "Requests:",
                error
            );

        }


        try {

            if (
                typeof window.loadConnectedStudents ===
                "function"
            ) {

                window.loadConnectedStudents();

            }

        }

        catch (error) {

            console.warn(
                "Connections:",
                error
            );

        }

    }



    /* =========================================================
       OTHER SCREENS
       ========================================================= */

    function openSimpleScreen(
        title,
        subtitle,
        link,
        icon
    ) {

        hideAllScreens();

        setActive(link);


        let screen =
            document.getElementById(
                "pitchEmergencyScreen"
            );


        if (!screen) {

            screen =
                document.createElement(
                    "section"
                );

            screen.id =
                "pitchEmergencyScreen";

            screen.className =
                "dashboard-card";


            const main =
                document.querySelector(
                    ".dashboard-main"
                );


            if (main) {

                main.appendChild(
                    screen
                );

            }

        }


        screen.innerHTML = `

            <div style="
                min-height:520px;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                text-align:center;
                padding:40px;
            ">

                <div style="
                    font-size:48px;
                    margin-bottom:20px;
                ">
                    ${icon}
                </div>

                <div style="
                    font-size:11px;
                    font-weight:800;
                    letter-spacing:2px;
                    margin-bottom:10px;
                ">
                    SKILLFORGE
                </div>

                <h2 style="
                    margin:0 0 12px;
                    font-size:32px;
                ">
                    ${title}
                </h2>

                <p style="
                    max-width:550px;
                    line-height:1.7;
                ">
                    ${subtitle}
                </p>

            </div>

        `;


        screen.style.setProperty(
            "display",
            "block",
            "important"
        );


        setHeader(
            title,
            subtitle
        );

    }



    /* =========================================================
       SIDEBAR CLICK
       ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest(
                    ".side-nav a"
                );


            if (!link) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            const text =
                (
                    link.textContent ||
                    ""
                )
                .trim()
                .toLowerCase();


            console.log(
                "🔥 PITCH NAV:",
                text
            );


            if (
                text.includes(
                    "dashboard"
                )
            ) {

                openDashboard(link);

                return;

            }


            if (
                text.includes(
                    "profile"
                )
            ) {

                openProfile(link);

                return;

            }


            if (
                text.includes(
                    "find matches"
                )
            ) {

                openMatches(link);

                return;

            }


            if (
                text.includes(
                    "skill exchange"
                )
            ) {

                openExchange(link);

                return;

            }


            if (
                text.includes(
                    "connections"
                )
            ) {

                openConnections(link);

                return;

            }


            if (
                text.includes(
                    "messages"
                )
            ) {

                openSimpleScreen(
                    "Messages",
                    "Chat with students after connecting with them.",
                    link,
                    "💬"
                );

                return;

            }


            if (
                text.includes(
                    "sessions"
                )
            ) {

                openSimpleScreen(
                    "Sessions",
                    "Manage your upcoming and completed skill-exchange sessions.",
                    link,
                    "◷"
                );

                return;

            }


            if (
                text.includes(
                    "history"
                )
            ) {

                openSimpleScreen(
                    "History",
                    "View your previous skill exchanges and activity.",
                    link,
                    "▣"
                );

                return;

            }


            if (
                text.includes(
                    "doubt"
                )
            ) {

                openSimpleScreen(
                    "Doubt Hub",
                    "Ask questions and learn from other students.",
                    link,
                    "?"
                );

                return;

            }


            if (
                text.includes(
                    "opportun"
                )
            ) {

                openSimpleScreen(
                    "Opportunities",
                    "Discover hackathons, competitions and internships.",
                    link,
                    "✦"
                );

                return;

            }


            if (
                text.includes(
                    "setting"
                )
            ) {

                openSimpleScreen(
                    "Settings",
                    "Manage your account and application preferences.",
                    link,
                    "⚙"
                );

                return;

            }

        },
        true
    );



    /* =========================================================
       S LOGO — FORCE CLICKABLE
       ========================================================= */

    function setupPitchLogo() {

        const logo =
            document.querySelector(
                ".sidebar .logo-mark"
            );


        if (!logo) {

            return;

        }


        logo.style.setProperty(
            "cursor",
            "pointer",
            "important"
        );


        logo.setAttribute(
            "role",
            "button"
        );


        logo.setAttribute(
            "tabindex",
            "0"
        );


        logo.onclick =
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                document.body.classList.toggle(
                    "skillforge-sidebar-collapsed"
                );

            };


        logo.onkeydown =
            function (event) {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    document.body.classList.toggle(
                        "skillforge-sidebar-collapsed"
                    );

                }

            };

    }



    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupPitchLogo
        );

    }

    else {

        setupPitchLogo();

    }


    console.log(
        "✅ SKILLFORGE PITCH EMERGENCY FIX ACTIVE"
    );


})();
/* ============================================================
   SKILLFORGE — EMERGENCY CHAT TIME FIX
   PASTE AT VERY END OF dashboard.js
   ============================================================ */

(function () {

    "use strict";


    /* =========================================================
       IST TIME
       ========================================================= */

    window.skillForgeChatTime = function (dateValue) {

        const date =
            dateValue
                ? new Date(dateValue)
                : new Date();


        if (isNaN(date.getTime())) {

            return "";

        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone: "Asia/Kolkata",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }
        ).format(date);

    };



    /* =========================================================
       CREATE TIME ELEMENT
       ========================================================= */

    window.addChatTime = function (
        messageElement,
        timestamp
    ) {

        if (!messageElement) {
            return;
        }


        /* Don't duplicate */

        if (
            messageElement.querySelector(
                ".chat-message-time"
            )
        ) {

            return;

        }


        const time =
            document.createElement(
                "span"
            );


        time.className =
            "chat-message-time";


        time.textContent =
            window.skillForgeChatTime(
                timestamp
            );


        time.style.cssText = `
            display:block;
            font-size:10px;
            margin-top:5px;
            opacity:.65;
            text-align:right;
            white-space:nowrap;
        `;


        messageElement.appendChild(
            time
        );

    };



    /* =========================================================
       FIX EXISTING CHAT MESSAGES
       ========================================================= */

    window.fixChatTimes = function () {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            return;

        }


        const messages =
            container.querySelectorAll(
                "[data-message-id], .chat-message, .message, .chat-bubble"
            );


        messages.forEach(
            function (message) {

                if (
                    message.querySelector(
                        ".chat-message-time"
                    )
                ) {

                    return;

                }


                /*
                 * Try to find timestamp from
                 * common attributes.
                 */

                const timestamp =
                    message.dataset.timestamp ||
                    message.dataset.createdAt ||
                    message.getAttribute(
                        "data-created-at"
                    ) ||
                    new Date();


                addChatTime(
                    message,
                    timestamp
                );

            }
        );

    };



    /* =========================================================
       OBSERVE NEW MESSAGES
       ========================================================= */

    function watchChat() {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            return;

        }


        fixChatTimes();


        if (
            container.dataset.timeWatcher ===
            "true"
        ) {

            return;

        }


        container.dataset.timeWatcher =
            "true";


        const observer =
            new MutationObserver(
                function () {

                    fixChatTimes();

                }
            );


        observer.observe(
            container,
            {
                childList: true,
                subtree: true
            }
        );

    }



    /* =========================================================
       WHATSAPP STYLE MESSAGE ALIGNMENT
       ========================================================= */

    window.fixChatAlignment =
    function () {

        const container =
            document.getElementById(
                "chatMessages"
            );


        if (!container) {

            return;

        }


        const profile =
            typeof getProfile ===
            "function"
                ? getProfile()
                : null;


        const myId =
            profile?.id ||
            profile?.student_id ||
            profile?.email ||
            "999";


        const messages =
            container.querySelectorAll(
                "[data-sender-id], [data-sender], .chat-message, .message, .chat-bubble"
            );


        messages.forEach(
            function (message) {

                const sender =
                    message.dataset.senderId ||
                    message.dataset.sender ||
                    message.getAttribute(
                        "data-sender-id"
                    );


                if (!sender) {

                    return;

                }


                const mine =
                    String(sender) ===
                    String(myId);


                message.style.maxWidth =
                    "75%";


                message.style.marginBottom =
                    "10px";


                if (mine) {

                    message.style.marginLeft =
                        "auto";

                    message.style.marginRight =
                        "0";

                }

                else {

                    message.style.marginLeft =
                        "0";

                    message.style.marginRight =
                        "auto";

                }

            }
        );

    };



    /* =========================================================
       WATCH FOR CHAT MODAL
       ========================================================= */

    const globalObserver =
        new MutationObserver(
            function () {

                const chat =
                    document.getElementById(
                        "chatMessages"
                    );


                if (chat) {

                    watchChat();

                    fixChatAlignment();

                }

            }
        );


    globalObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );



    /* =========================================================
       PERIODIC SAFETY CHECK
       ========================================================= */

    setInterval(
        function () {

            if (
                document.getElementById(
                    "chatMessages"
                )
            ) {

                fixChatTimes();

                fixChatAlignment();

            }

        },
        1000
    );


    console.log(
        "✅ SkillForge emergency chat time fix loaded"
    );

})();