// ============================================================
// SKILLFORGE - SIGNUP.JS
// REAL SUPABASE SIGNUP + PROFILE DATA + AI VERIFICATION FLOW
// ============================================================


// ============================================================
// SUPABASE CONFIG
// ============================================================

const SUPABASE_URL =
    "https://qzqklyprewremgwlvttv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_vLMC0RB1j2N6lUMeCxzu2A_d4iY9NDs";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ============================================================
// BACKEND
// ============================================================

const API_BASE =
    "http://127.0.0.1:8000";


// ============================================================
// HELPERS
// ============================================================

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value.trim();
}


function getArrayValue(id) {

    const value =
        getValue(id);

    return value
        .split(",")
        .map(
            item => item.trim()
        )
        .filter(
            item => item.length > 0
        );

}


function showMessage(
    message,
    type = "info"
) {

    const messageBox =
        document.getElementById(
            "signupMessage"
        );


    if (!messageBox) {

        alert(message);

        return;
    }


    messageBox.textContent =
        message;


    messageBox.className =
        "signup-message " +
        type;


    messageBox.style.display =
        "block";

}


function setButtonState(
    loading
) {

    const button =
        document.getElementById(
            "signupButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (loading) {

        button.innerHTML = `
            <span>
                Creating account...
            </span>

            <span class="button-arrow">
                •••
            </span>
        `;

    }

    else {

        button.innerHTML = `
            <span>
                Create account
            </span>

            <span class="button-arrow">
                →
            </span>
        `;

    }

}


// ============================================================
// VALIDATION
// ============================================================

function validateSignupData(
    data
) {

    if (!data.firstName) {

        return "Please enter your first name.";

    }


    if (!data.lastName) {

        return "Please enter your last name.";

    }


    if (!data.email) {

        return "Please enter your email address.";

    }


    if (!data.password) {

        return "Please create a password.";

    }


    if (data.password.length < 6) {

        return (
            "Password must be at least 6 characters long."
        );

    }


    if (!data.college) {

        return "Please enter your college/university.";

    }


    if (!data.course) {

        return "Please select your course.";

    }


    if (!data.year) {

        return "Please select your year.";

    }


    if (!data.skills.length) {

        return (
            "Please add at least one skill you can teach."
        );

    }


    if (!data.learning.length) {

        return (
            "Please add at least one skill you want to learn."
        );

    }


    return null;

}


// ============================================================
// SAVE LOCAL PROFILE
// ============================================================

function saveLocalProfile(
    user,
    data
) {

    const profile = {

        id:
            user.id,

        auth_id:
            user.id,

        firstName:
            data.firstName,

        lastName:
            data.lastName,

        name:
            `${data.firstName} ${data.lastName}`,

        email:
            data.email,

        college:
            data.college,

        course:
            data.course,

        year:
            data.year,

        availability:
            data.year,

        skills:
            data.skills,

        learning:
            data.learning,

        needs:
            data.learning,

        role:
            "Student",

        profileComplete:
            true,

        verificationRequired:
            true,

        verificationStatus:
            "pending"

    };


    localStorage.setItem(
        "studentProfile",
        JSON.stringify(profile)
    );


    return profile;

}


// ============================================================
// PREPARE AI VERIFICATION
// ============================================================

function prepareVerification(
    skills
) {

    /*
     * First skill will be verified first.
     *
     * Example:
     *
     * skills =
     * ["Python", "HTML", "CSS"]
     *
     * First test:
     * Python
     */

    const firstSkill =
        skills[0];


    const verificationState = {

        required:
            true,

        status:
            "pending",

        skill:
            firstSkill,

        allSkills:
            skills,

        currentSkillIndex:
            0,

        started:
            false,

        verified:
            false,

        score:
            null,

        createdAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "skillVerificationState",
        JSON.stringify(
            verificationState
        )
    );


    /*
     * This flag tells dashboard:
     *
     * "This is a brand-new user.
     * Start AI test automatically."
     */

    localStorage.setItem(
        "autoStartSkillVerification",
        "true"
    );


    /*
     * Matching must remain locked
     * until verification is completed.
     */

    localStorage.setItem(
        "matchingLocked",
        "true"
    );


    /*
     * Sessions must remain locked.
     */

    localStorage.setItem(
        "sessionsLocked",
        "true"
    );


    /*
     * Connections can also remain locked
     * until verification.
     */

    localStorage.setItem(
        "connectionsLocked",
        "true"
    );

}


// ============================================================
// OPTIONAL BACKEND PROFILE CHECK
// ============================================================

async function verifyProfileWasCreated(
    email
) {

    try {

        const response =
            await fetch(
                API_BASE +
                "/api/profile/" +
                encodeURIComponent(
                    email
                )
            );


        if (!response.ok) {

            console.warn(
                "Profile API returned:",
                response.status
            );

            return false;

        }


        const result =
            await response.json();


        console.log(
            "✅ Profile created in backend:",
            result
        );


        return true;

    }

    catch (error) {

        /*
         * Don't fail signup if the
         * backend profile check is unavailable.
         */

        console.warn(
            "Profile verification request failed:",
            error
        );


        return false;

    }

}


// ============================================================
// REDIRECT AFTER SIGNUP
// ============================================================

function redirectAfterSignup(
    sessionExists
) {

    /*
     * If Supabase immediately created
     * a session, go directly to dashboard.
     */

    if (sessionExists) {

        window.location.href =
            "dashboard.html";

        return;

    }


    /*
     * If email confirmation is enabled,
     * keep the verification flag in
     * localStorage and send user to login.
     *
     * After login we will consume the flag.
     */

    window.location.href =
        "login.html";

}


// ============================================================
// MAIN SIGNUP
// ============================================================

async function handleSignup(
    event
) {

    event.preventDefault();


    setButtonState(
        true
    );


    showMessage(
        "Creating your SkillForge account...",
        "info"
    );


    // ========================================================
    // GET FORM DATA
    // ========================================================

    const data = {

        firstName:
            getValue(
                "firstName"
            ),

        lastName:
            getValue(
                "lastName"
            ),

        email:
            getValue(
                "email"
            ).toLowerCase(),

        password:
            document.getElementById(
                "password"
            )?.value || "",

        college:
            getValue(
                "college"
            ),

        course:
            getValue(
                "course"
            ),

        year:
            getValue(
                "year"
            ),

        skills:
            getArrayValue(
                "skills"
            ),

        learning:
            getArrayValue(
                "learning"
            )

    };


    // ========================================================
    // VALIDATE
    // ========================================================

    const validationError =
        validateSignupData(
            data
        );


    if (validationError) {

        showMessage(
            validationError,
            "error"
        );


        setButtonState(
            false
        );


        return;

    }


    try {

        // ====================================================
        // CREATE AUTH ACCOUNT
        // ====================================================

        const {
            data: authData,
            error: authError
        } =
            await supabaseClient.auth.signUp({

                email:
                    data.email,

                password:
                    data.password,

                options: {

                    data: {

                        name:
                            `${data.firstName} ${data.lastName}`,

                        first_name:
                            data.firstName,

                        last_name:
                            data.lastName,

                        college:
                            data.college,

                        course:
                            data.course,

                        year:
                            data.year,

                        availability:
                            data.year,

                        skills:
                            data.skills,

                        needs:
                            data.learning,

                        learning:
                            data.learning,

                        role:
                            "Student"

                    }

                }

            });


        // ====================================================
        // AUTH ERROR
        // ====================================================

        if (authError) {

            throw authError;

        }


        const user =
            authData?.user;


        if (!user) {

            throw new Error(
                "Supabase did not return a user."
            );

        }


        // ====================================================
        // SAVE LOCAL PROFILE
        // ====================================================

        const profile =
            saveLocalProfile(
                user,
                data
            );


        console.log(
            "✅ Local profile saved:",
            profile
        );


        // ====================================================
        // PREPARE VERIFICATION
        // ====================================================

        prepareVerification(
            data.skills
        );


        // ====================================================
        // SAVE FIRST SKILL
        // ====================================================

        localStorage.setItem(
            "verificationSkill",
            data.skills[0]
        );


        // ====================================================
        // SAVE REGISTRATION STATE
        // ====================================================

        localStorage.setItem(
            "registrationCompleted",
            "true"
        );


        localStorage.setItem(
            "newStudent",
            "true"
        );


        // ====================================================
        // OPTIONAL PROFILE CHECK
        // ====================================================

        /*
         * Give database trigger a moment
         * to create the profile.
         */

        setTimeout(
            async function () {

                await verifyProfileWasCreated(
                    data.email
                );

            },
            500
        );


        // ====================================================
        // SUCCESS
        // ====================================================

        showMessage(
            "Account created successfully! Redirecting...",
            "success"
        );


        console.log(
            "========================================"
        );

        console.log(
            "✅ SKILLFORGE ACCOUNT CREATED"
        );

        console.log(
            "User:",
            user.id
        );

        console.log(
            "Email:",
            data.email
        );

        console.log(
            "Skills:",
            data.skills
        );

        console.log(
            "Learning:",
            data.learning
        );

        console.log(
            "Verification skill:",
            data.skills[0]
        );

        console.log(
            "========================================"
        );


        // ====================================================
        // REDIRECT
        // ====================================================

        setTimeout(
            function () {

                redirectAfterSignup(
                    Boolean(
                        authData.session
                    )
                );

            },
            700
        );


    }

    catch (error) {

        console.error(
            "❌ Signup error:",
            error
        );


        /*
         * If something failed before
         * verification state was created,
         * don't leave the user locked.
         */

        localStorage.removeItem(
            "autoStartSkillVerification"
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


        let message =
            error?.message ||
            "Unable to create your account.";


        /*
         * Friendlier Supabase messages.
         */

        if (
            message
                .toLowerCase()
                .includes(
                    "user already registered"
                )
        ) {

            message =
                "This email is already registered. Please login instead.";

        }


        if (
            message
                .toLowerCase()
                .includes(
                    "password should be at least"
                )
        ) {

            message =
                "Please use a stronger password.";

        }


        showMessage(
            "Signup failed: " +
            message,
            "error"
        );


        setButtonState(
            false
        );

    }

}


// ============================================================
// CONNECT FORM
// ============================================================

function initializeSignup() {

    const form =
        document.getElementById(
            "signupForm"
        );


    if (!form) {

        console.error(
            "SkillForge: signupForm not found."
        );

        return;

    }


    /*
     * Prevent duplicate listeners.
     */

    if (
        form.dataset.initialized ===
        "true"
    ) {

        return;

    }


    form.dataset.initialized =
        "true";


    form.addEventListener(
        "submit",
        handleSignup
    );


    console.log(
        "✅ SkillForge signup initialized."
    );

}


// ============================================================
// PAGE LOAD
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSignup
    );

}

else {

    initializeSignup();

}