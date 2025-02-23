const toggleButton = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const body = document.body;
const joinbtn = document.getElementById("join-btn");
const createbtn = document.getElementById("create-btn");

// Check if dark mode is already enabled
if (localStorage.getItem("theme") === "dark") {
    body.classList.replace("bg-body-secondary", "bg-body-dark"); 
    body.classList.replace("text-dark", "text-light");
    icon.classList.replace("fa-moon", "fa-sun"); 
    joinbtn.classList.replace("btn-dark", "btn-light");
    joinbtn.classList.replace("text-light", "text-dark");
    createbtn.classList.replace("btn-secondary", "btn-light");
}

// Toggle function
toggleButton.addEventListener("click", () => {
    if (body.classList.contains("bg-body-secondary")) {
        body.classList.replace("bg-body-secondary", "bg-dark");
        body.classList.replace("text-dark", "text-light");
        localStorage.setItem("theme", "dark");
        icon.classList.replace("fa-moon", "fa-sun");
        joinbtn.classList.replace("btn-dark", "btn-light");
        joinbtn.classList.replace("text-light", "text-dark");
        createbtn.classList.replace("btn-secondary", "btn-light");
    } else {
        body.classList.replace("bg-dark", "bg-body-secondary");
        body.classList.replace("text-light", "text-dark");
        localStorage.setItem("theme", "light");
        icon.classList.replace("fa-sun", "fa-moon");
        joinbtn.classList.replace("btn-light", "btn-dark");
        joinbtn.classList.replace("text-dark", "text-light");
        createbtn.classList.replace("btn-light", "btn-secondary");
    }
});
