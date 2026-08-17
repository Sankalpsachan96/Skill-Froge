function getStarted() {
    window.location.href = "signup.html";
}

function login() {
    window.location.href = "login.html";
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}