// Array to store questions
let questions = [];

// Add event listener to the form submit event
document.getElementById("createQuizForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form reload

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    // Validate inputs
    if (!title || !description || questions.length === 0) {
        alert("Please fill in all fields and add at least one question.");
        return;
    }

    // Prepare quiz data
    const quizData = { title, description, questions };
    console.log("📤 Sending Data:", quizData);

    try {
        // Send quiz data to the server
        let response = await fetch("/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(quizData),
        });

        let result = await response.json();
        console.log("📩 Server Response:", result);

        if (result.success) {
            document.getElementById("quizCodeMessage").innerText = `Quiz Created! Code: ${result.code}`;
            document.getElementById("quizCodeMessage").style.display = "block";
        } else {
            alert(result.message || "Error creating quiz.");
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error);
        alert("Server error. Check the console for details.");
    }
});

// Function to add a new question to the form
function addQuestion() {
    // Validate if the previous question is completed
    if (questions.length > 0) {
        let lastQuestion = questions[questions.length - 1];
        if (!lastQuestion.question || lastQuestion.options.some(opt => !opt)) {
            alert("Please complete the previous question before adding a new one.");
            return;
        }
    }

    // Add a new empty question object
    let questionIndex = questions.length;
    questions.push({ question: "", options: ["", "", "", ""], correctOption: 0 });

    // Create question fields in the DOM
    let questionDiv = document.createElement("div");
    questionDiv.classList.add("mb-4", "p-3", "border", "rounded"); // Bootstrap styling
    questionDiv.innerHTML = `
        <label class="form-label mb-2">Question ${questionIndex + 1}:</label>
        <input type="text" class="form-control mb-3" placeholder="Enter question" required oninput="updateQuestion(${questionIndex}, this.value)">

        <label class="form-label mb-2">Options:</label>
        <div class="row mb-3">
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control" placeholder="Option 1" required oninput="updateOption(${questionIndex}, 0, this.value)">
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control" placeholder="Option 2" required oninput="updateOption(${questionIndex}, 1, this.value)">
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control" placeholder="Option 3" required oninput="updateOption(${questionIndex}, 2, this.value)">
            </div>
            <div class="col-md-6 mb-2">
                <input type="text" class="form-control" placeholder="Option 4" required oninput="updateOption(${questionIndex}, 3, this.value)">
            </div>
        </div>

        <label class="form-label">Correct Answer:</label>
        <select class="form-select" onchange="updateCorrectOption(${questionIndex}, this.value)">
            <option value="0">Option 1</option>
            <option value="1">Option 2</option>
            <option value="2">Option 3</option>
            <option value="3">Option 4</option>
        </select>
    `;

    // Append question fields to the container
    document.getElementById("questions-container").appendChild(questionDiv);
};

// Helper functions to update question data
function updateQuestion(index, value) {
    questions[index].question = value;
};

function updateOption(qIndex, optIndex, value) {
    questions[qIndex].options[optIndex] = value;
};

function updateCorrectOption(index, value) {
    questions[index].correctOption = parseInt(value);
};