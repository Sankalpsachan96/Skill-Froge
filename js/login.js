// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL =
    "https://qzqklyprewremgwlvttv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_vLMC0RB1j2N6lUMeCxzu2A_d4iY9NDs";


// Create Supabase client
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// CHECK JAVASCRIPT LOADED
// ==========================================

console.log("LOGIN JS LOADED");


const loginForm =
    document.getElementById("loginForm");


// ==========================================
// LOGIN FORM
// ==========================================

if (!loginForm) {

    console.error(
        "ERROR: loginForm not found!"
    );

} else {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            // VERY IMPORTANT
            event.preventDefault();

            console.log(
                "LOGIN FORM SUBMITTED"
            );


            const button =
                document.querySelector(
                    ".login-btn"
                );


            button.disabled = true;

            button.textContent =
                "Logging in...";


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            console.log(
                "Attempting login:",
                email
            );


            // ==================================
            // SUPABASE LOGIN
            // ==================================

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email: email,

                            password: password

                        });


                // Login failed
                if (error) {

                    console.error(
                        "SUPABASE LOGIN ERROR:",
                        error
                    );

                    alert(
                        "Login failed!\n\n" +
                        error.message
                    );

                    button.disabled = false;

                    button.textContent =
                        "Login →";

                    return;
                }


                // ==================================
                // USER CHECK
                // ==================================

                if (!data || !data.user) {

                    alert(
                        "Login failed. User not found."
                    );

                    button.disabled = false;

                    button.textContent =
                        "Login →";

                    return;
                }


                const user =
                    data.user;


                console.log(
                    "LOGIN SUCCESS:",
                    user.email
                );


                // ==================================
                // GET PROFILE
                // ==================================

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabaseClient
                        .from("profiles")
                        .select("*")
                        .eq("auth_id", user.id)
                        .maybeSingle();


                if (profileError) {

                    console.warn(
                        "Profile fetch error:",
                        profileError
                    );

                }


                // ==================================
                // SAVE PROFILE FOR DASHBOARD
                // ==================================

                if (profile) {

                    const name =
                        profile.name ||
                        "Student";


                    const nameParts =
                        name.trim().split(" ");


                    const firstName =
                        nameParts.shift() ||
                        "Student";


                    const lastName =
                        nameParts.join(" ");


                    localStorage.setItem(
                        "studentProfile",
                        JSON.stringify({

                            id: user.id,

                            firstName:
                                firstName,

                            lastName:
                                lastName,

                            email:
                                profile.email ||
                                user.email,

                            college:
                                profile.college ||
                                "",

                            course:
                                profile.course ||
                                "",

                            year:
                                profile.year ||
                                "",

                            skills:
                                profile.skills ||
                                [],

                            learning:
                                profile.needs ||
                                []

                        })
                    );

                }


                // ==================================
                // GO TO DASHBOARD
                // ==================================

                console.log(
                    "Opening dashboard..."
                );


                window.location.href =
                    "dashboard.html";

            }


            // ==================================
            // UNEXPECTED ERROR
            // ==================================

            catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                alert(
                    "Something went wrong:\n\n" +
                    error.message
                );


                button.disabled = false;

                button.textContent =
                    "Login →";
            }

        }
    );

}