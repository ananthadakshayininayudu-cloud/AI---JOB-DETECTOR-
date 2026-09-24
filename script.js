// ================================
// AI JOBGUARD - SCRIPT.JS
// ================================

const jobText = document.getElementById("jobText");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultSection = document.getElementById("resultSection");
const scoreValue = document.getElementById("scoreValue");
const riskLevel = document.getElementById("riskLevel");
const riskTitle = document.getElementById("riskTitle");
const riskExplanation = document.getElementById("riskExplanation");
const recommendation = document.getElementById("recommendation");
const warningList = document.getElementById("warningList");
const breakdown = document.getElementById("breakdown");
const charCount = document.getElementById("charCount");


// ================================
// SAMPLE JOB TEXTS
// ================================

const samples = {

    low: `
    We are hiring a Junior Software Developer Intern.

    Company: ABC Technologies
    Location: Hyderabad
    Duration: 3 Months

    Candidates will attend an online interview.
    Selected candidates will receive an official offer letter.

    Apply through our official company careers page.
    No registration fee or payment is required.
    `,

    medium: `
    Work From Home Internship

    Earn up to ₹30,000 per month.
    Contact our recruitment team through WhatsApp.

    Candidates should submit their resume and phone number.
    Limited positions available. Apply soon.
    `,

    high: `
    Congratulations! You are selected for a work from home job.

    Earn ₹80,000 per month with no experience required.
    Pay ₹2,000 registration fee immediately.

    Send your OTP, UPI PIN and bank details to confirm your job.
    Contact us only through WhatsApp.

    No interview required.
    Your selection will expire today.
    `
};


// ================================
// LOAD SAMPLE
// ================================

function loadSample(type) {

    if (samples[type]) {
        jobText.value = samples[type];
        updateCount();
    }
}


// ================================
// CHARACTER COUNT
// ================================

function updateCount() {

    if (!jobText || !charCount) return;

    charCount.textContent =
        `${jobText.value.length} characters`;
}

jobText.addEventListener("input", updateCount);


// ================================
// CLEAR TEXT
// ================================

function clearInput() {

    jobText.value = "";

    updateCount();

    resultSection.style.display = "none";
}


// ================================
// RISK RULES
// ================================

const riskRules = [

    {
        name: "Payment request",
        points: 25,
        words: [
            "registration fee",
            "processing fee",
            "pay fee",
            "payment required",
            "deposit",
            "pay ₹",
            "pay rs"
        ]
    },

    {
        name: "Sensitive financial information",
        points: 35,
        words: [
            "otp",
            "upi pin",
            "cvv",
            "bank password",
            "card number",
            "bank details",
            "account password"
        ]
    },

    {
        name: "Urgency pressure",
        points: 12,
        words: [
            "immediately",
            "urgent",
            "today only",
            "limited time",
            "expires today",
            "act now"
        ]
    },

    {
        name: "Unrealistic salary",
        points: 15,
        words: [
            "₹80,000",
            "₹90,000",
            "₹1,00,000",
            "100000",
            "no experience",
            "earn huge",
            "easy money"
        ]
    },

    {
        name: "Messaging app contact",
        points: 8,
        words: [
            "whatsapp",
            "telegram",
            "contact me on whatsapp"
        ]
    },

    {
        name: "No interview",
        points: 12,
        words: [
            "no interview",
            "without interview",
            "instant selection",
            "guaranteed selection"
        ]
    },

    {
        name: "Suspicious links",
        points: 12,
        words: [
            "bit.ly",
            "tinyurl",
            "click here",
            "unknown link"
        ]
    }
];


// ================================
// ANALYZE JOB
// ================================

function analyzeJob() {

    const text = jobText.value.trim();

    if (text.length < 20) {

        alert("Please enter a complete job or internship message.");

        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = "🔍 Analyzing...";

    setTimeout(() => {

        const result = calculateRisk(text);

        showResult(result);

        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = "🔍 Analyze Job";

    }, 1000);
}


// ================================
// CALCULATE RISK
// ================================

function calculateRisk(text) {

    const lowerText = text.toLowerCase();

    let score = 0;
    let warnings = [];
    let matchedRules = [];

    riskRules.forEach(rule => {

        const matched = rule.words.some(word =>
            lowerText.includes(word.toLowerCase())
        );

        if (matched) {

            score += rule.points;

            warnings.push(rule.name);

            matchedRules.push({
                name: rule.name,
                points: rule.points
            });
        }
    });


    // Strong scam combination
    const payment =
        lowerText.includes("fee") ||
        lowerText.includes("payment") ||
        lowerText.includes("pay ₹");

    const sensitive =
        lowerText.includes("otp") ||
        lowerText.includes("upi pin") ||
        lowerText.includes("cvv") ||
        lowerText.includes("bank details");

    const urgency =
        lowerText.includes("immediately") ||
        lowerText.includes("today") ||
        lowerText.includes("urgent");


    // If all three appear, score should be 90+
    if (payment && sensitive && urgency) {
        score = Math.max(score, 90);
    }


    // Maximum score = 100
    score = Math.min(score, 100);


    let level;

    if (score <= 40) {
        level = "LOW";
    }
    else if (score <= 70) {
        level = "MEDIUM";
    }
    else {
        level = "HIGH";
    }


    return {
        score,
        level,
        warnings,
        matchedRules
    };
}


// ================================
// SHOW RESULT
// ================================

function showResult(result) {

    resultSection.style.display = "block";

    scoreValue.textContent = result.score;

    riskLevel.textContent =
        `${result.level} RISK`;

    // Risk colours
    riskLevel.className = "risk-pill";

    if (result.level === "LOW") {
        riskLevel.classList.add("low");
    }

    else if (result.level === "MEDIUM") {
        riskLevel.classList.add("medium");
    }

    else {
        riskLevel.classList.add("high");
    }


    // Titles
    if (result.level === "LOW") {

        riskTitle.textContent =
            "Looks relatively safe";

        riskExplanation.textContent =
            "Only a few suspicious indicators were detected. Still verify the employer before applying.";

        recommendation.textContent =
            "Check the official company website and verify the recruiter before sharing personal information.";
    }

    else if (result.level === "MEDIUM") {

        riskTitle.textContent =
            "Be careful before applying";

        riskExplanation.textContent =
            "Some warning signs were detected. Verify the company, recruiter and job details independently.";

        recommendation.textContent =
            "Do not make payments or share sensitive financial information until the employer is verified.";
    }

    else {

        riskTitle.textContent =
            "High-risk job detected";

        riskExplanation.textContent =
            "Multiple strong warning signs were detected in this job message.";

        recommendation.textContent =
            "Do not send money, OTPs, PINs, passwords or sensitive financial information. Verify the employer independently.";
    }


    // Warning signs
    warningList.innerHTML = "";

    if (result.warnings.length === 0) {

        warningList.innerHTML =
            "<li>✓ No major warning signs detected</li>";

    }
    else {

        result.warnings.forEach(warning => {

            const li = document.createElement("li");

            li.textContent = "⚠️ " + warning;

            warningList.appendChild(li);
        });
    }


    // Risk breakdown
    breakdown.innerHTML = "";

    result.matchedRules.forEach(rule => {

        const percentage =
            Math.min((rule.points / 35) * 100, 100);

        const item = document.createElement("div");

        item.className = "breakdown-item";

        item.innerHTML = `
            <div class="breakdown-header">
                <span>${rule.name}</span>
                <strong>+${rule.points}</strong>
            </div>

            <div class="progress-bar">
                <div
                    class="progress-fill"
                    style="width:${percentage}%">
                </div>
            </div>
        `;

        breakdown.appendChild(item);
    });


    // Scroll to results
    resultSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ================================
// HIGHLIGHT SUSPICIOUS WORDS
// ================================

function highlightSuspiciousWords(text) {

    const suspiciousWords = [

        "otp",
        "upi pin",
        "cvv",
        "registration fee",
        "processing fee",
        "pay",
        "immediately",
        "urgent",
        "whatsapp",
        "telegram",
        "no interview",
        "instant selection"
    ];

    let highlightedText = text;

    suspiciousWords.forEach(word => {

        const regex =
            new RegExp(`(${word})`, "gi");

        highlightedText =
            highlightedText.replace(
                regex,
                `<mark>$1</mark>`
            );
    });

    return highlightedText;
}


// ================================
// ANALYZE BUTTON
// ================================

analyzeBtn.addEventListener(
    "click",
    analyzeJob
);


// ================================
// ENTER KEY
// ================================

jobText.addEventListener(
    "keydown",
    function(event) {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            analyzeJob();
        }
    }
);


// ================================
// INITIAL SETUP
// ================================

updateCount();

console.log(
    "AI JobGuard Script Loaded Successfully 🚀"
);
