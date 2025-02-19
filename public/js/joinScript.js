const socket = io();

    // Initialize Swiper
    const swiper = new Swiper('mySwiper', {
        loop: true,
        cssMode: true,
        grabCursor: true,
        spaceBetween : 15,
        watchOverflow: false,
      
        // If we need pagination
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
          dynamicBullets: true
        },
      
        // Navigation arrows
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
    
        keyboard: {
            enabled: true,
            onlyInViewport: false,
          },
    
        // Responsive breakpoints 
        breakpoints: 'window',
        breakpoints: {
            0: {
                slidesPerView: 1
            },
            768: {
                slidesPerView: 1
            },
            1024: {
                slidesPerView: 2
            }
        },
      });

    // Avatar Selection Logic
    const selectedAvatar = document.getElementById("selectedAvatar").querySelector("img");
    const avatarName = document.getElementById("avatarName");
    const profilePicInput = document.getElementById("profilePic");

    document.querySelectorAll(".swiper-slide").forEach(slide => {
        slide.addEventListener("click", function () {
            let avatarSrc = this.getAttribute("data-avatar");
            let avatarText = this.getAttribute("data-name");

            selectedAvatar.src = avatarSrc;
            avatarName.textContent = avatarText;
            profilePicInput.value = avatarSrc; // Store selected avatar in hidden input
        });
    });

    // Handle Form Submission
    document.getElementById("join-form").addEventListener("submit", (e) => {
        e.preventDefault();
        let quizCode = document.getElementById("quizCode").value;
        let playerName = document.getElementById("playerName").value;
        let profilePic = profilePicInput.value;

        socket.emit("joinQuiz", { quizCode, playerName, profilePic });

        socket.on("updatePlayers", (players) => {
            console.log("Players in quiz:", players);
        });

        socket.on("startQuiz", () => {
            console.log("Quiz starting now...");
            window.location.href = `/quiz/${quizCode}`;
        });
    });