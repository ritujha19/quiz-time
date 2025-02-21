const socket = io();

// Initialize Swiper
    const swiper = new Swiper(".mySwiper", {
    
      });

      document.addEventListener("DOMContentLoaded", () => {
        console.log("JS Loaded");
    
        // Initialize Swiper
        const swiper = new Swiper(".mySwiper", {
          slidesPerView: 3,
          spaceBetween: 30,
          freeMode: true,
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
    
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
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
    
        // Avatar selection
        document.querySelectorAll(".swiper-slide img").forEach((img) => {
            img.addEventListener("click", function () {
                document.querySelectorAll(".swiper-slide img").forEach(i => i.classList.remove("selected"));
                this.classList.add("selected");
    
                // Store selected avatar in hidden input
                document.getElementById("profilePic").value = this.dataset.value;
            });
        });
    
        const socket = io();
    
        document.getElementById("joinForm").addEventListener("submit", (e) => {
            e.preventDefault();
    
            let quizCode = document.getElementById("quizCode").value;
            let playerName = document.getElementById("playerName").value;
            let profilePic = document.getElementById("profilePic").value;
    
            if (!profilePic) {
                alert("Please select an avatar!");
                return;
            }
    
            socket.emit("joinQuiz", { quizCode, playerName, profilePic });
    
            socket.on("updatePlayers", (players) => {
                console.log("Players in quiz:", players);
            });
    
            socket.on("startQuiz", () => {
                console.log("Quiz starting now...");
                window.location.href = `/quiz/${quizCode}`;
            });
        });
    });
        