/* =========================================================
   AI JOBGUARD — COMPLETE JAVASCRIPT
   Client-side rule-based analysis
========================================================= */

"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */

const STORAGE_KEY = "aiJobGuardHistory";

let currentAnalysis = null;
let currentLanguage = "en";

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   DOM ELEMENTS
========================================================= */

const jobDescription = $("#jobDescription");
const characterCount = $("#characterCount");

const clearButton = $("#clearButton");
const analyzeButton = $("#analyzeButton");

const loadingArea = $("#loadingArea");
const loadingText = $("#loadingText");
const errorMessage = $("#errorMessage");

const resultSection = $("#resultSection");
const riskCard = $("#riskCard");

const riskScore = $("#riskScore");
const riskPill = $("#riskPill");
const riskTitle = $("#riskTitle");
const riskExplanation = $("#riskExplanation");

const meterValue = $("#meterValue");
const meterFill = $("#meterFill");

const riskBreakdown = $("#riskBreakdown");
const warningList = $("#warningList");
const detailedExplanation = $("#detailedExplanation");
const recommendation = $("#recommendation");

const highlightedText = $("#highlightedText");

const contactAnalysis = $("#contactAnalysis");
const salaryAnalysis = $("#salaryAnalysis");
const personalDataWarning = $("#personalDataWarning");

const downloadReport = $("#downloadReport");
const copyAnalysis = $("#copyAnalysis");
const shareAnalysis = $("#shareAnalysis");

const clearHistory = $("#clearHistory");

const totalScans = $("#totalScans");
const highRiskCount = $("#highRiskCount");
const suspiciousCount = $("#suspiciousCount");
const lowRiskCount = $("#lowRiskCount");
const historyList = $("#historyList");

const languageSelector = $("#languageSelector");

/* =========================================================
   SAMPLE JOBS
========================================================= */

const sampleJobs = {
    low: `
Software Development Intern

Company: TechNova Solutions
Location: Hyderabad / Hybrid
Duration: 6 months

We are looking for a motivated software development intern to join our engineering team.

Requirements:
- Basic knowledge of Python or JavaScript
- Good problem-solving skills
- Willingness to learn
- Ability to work with a team

Responsibilities:
- Assist developers with software development tasks
- Write and test basic code
- Participate in code reviews
- Attend weekly team meetings

Selection process:
1. Resume screening
2. Technical interview
3. HR discussion

Stipend: ₹15,000 per month

Please apply through the official company careers page.
No registration fee or payment is required.
    `.trim(),

    medium: `
Urgent Hiring — Work From Home Internship

We are urgently looking for students for a work-from-home internship.

Salary: ₹40,000 - ₹60,000 per month

No experience required. Immediate joining available.

Selected candidates may be asked to attend a short online interview.

Contact HR through WhatsApp for faster processing.

Limited vacancies available. Apply immediately to secure your position.

Send your resume and contact details to hr.jobs2026@gmail.com.
    `.trim(),

    high: `
CONGRATULATIONS!!!

You have been selected for an immediate work-from-home job with an international company.

Salary: ₹1,50,000 per month guaranteed.

No interview required.
No experience required.

To confirm your job, you must pay a refundable registration fee of ₹2,999 today.

Payment must be made through UPI to:
jobsecure@upi

Your offer will expire in 30 minutes.

Send your Aadhaar number, PAN number, bank account details and OTP for verification.

WhatsApp HR immediately on +91 9876543210.

Failure to complete the payment will result in cancellation of your offer.
    `.trim()
};

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
    en: {
        systemOnline: "SYSTEM ONLINE",
        analyzing: "Analyzing job posting...",
        processing: "Processing risk indicators...",
        generating: "Generating explainable analysis...",
        low: "LOW RISK",
        suspicious: "SUSPICIOUS",
        high: "HIGH RISK"
    },

    te: {
        systemOnline: "సిస్టమ్ ఆన్‌లైన్",
        analyzing: "జాబ్ పోస్టింగ్‌ను విశ్లేషిస్తోంది...",
        processing: "రిస్క్ సూచనలను పరిశీలిస్తోంది...",
        generating: "వివరణాత్మక విశ్లేషణ రూపొందిస్తోంది...",
        low: "తక్కువ రిస్క్",
        suspicious: "అనుమానాస్పదం",
        high: "అధిక రిస్క్"
    },

    hi: {
        systemOnline: "सिस्टम ऑनलाइन",
        analyzing: "जॉब पोस्टिंग का विश्लेषण हो रहा है...",
        processing: "जोखिम संकेतों की जांच हो रही है...",
        generating: "विस्तृत विश्लेषण तैयार हो रहा है...",
        low: "कम जोखिम",
        suspicious: "संदिग्ध",
        high: "उच्च जोखिम"
    }
};

/* =========================================================
   RULE DEFINITIONS
========================================================= */

const rules = [
    {
        key: "payment",
        name: "Payment Request",
        points: 35,
        patterns: [
            /\bregistration fee\b/i,
            /\bprocessing fee\b/i,
            /\bjoining fee\b/i,
            /\bsecurity deposit\b/i,
            /\brefundable fee\b/i,
            /\bpay\b.{0,40}\bfee\b/i,
            /\bpayment\b.{0,40}\brequired\b/i,
            /\bdeposit\b.{0,30}\bjob\b/i,
            /\bpay\s*(₹|rs\.?|inr)?\s*[\d,]+/i
        ],
        warning: "The posting asks the applicant to pay money to obtain or confirm a job."
    },

    {
        key: "noInterview",
        name: "No Interview",
        points: 18,
        patterns: [
            /\bno interview\b/i,
            /\bwithout interview\b/i,
            /\binterview not required\b/i,
            /\bno interview required\b/i,
            /\bselected without interview\b/i
        ],
        warning: "A job offer without a meaningful selection process can be a warning sign."
    },

    {
        key: "unrealisticSalary",
        name: "Unrealistic Salary",
        points: 20,
        patterns: [
            /\b₹?\s*1[,.]?[0-9]{2,3}[,.]?[0-9]{2,3}\s*(per month|monthly)\b/i,
            /\b₹?\s*[5-9][0-9],[0-9]{3}\s*(per month|monthly)\b/i,
            /\bguaranteed income\b/i,
            /\bguaranteed salary\b/i,
            /\bearn\s*(₹|rs\.?|inr)?\s*[0-9,]+\s*(per day|daily|per month|monthly)\b/i,
            /\bhigh salary\b.{0,30}\bno experience\b/i,
            /\b1 lakh\b/i,
            /\b2 lakh\b/i,
            /\b3 lakh\b/i
        ],
        warning: "The salary or earning promise appears unusually high for the stated requirements."
    },

    {
        key: "urgency",
        name: "Urgency / Pressure",
        points: 15,
        patterns: [
            /\burgent(?:ly)?\b/i,
            /\bimmediate(?:ly)? joining\b/i,
            /\blimited vacancies\b/i,
            /\bapply immediately\b/i,
            /\bact now\b/i,
            /\bwithin \d+ minutes?\b/i,
            /\bexpires? in \d+ minutes?\b/i,
            /\btoday only\b/i,
            /\blast chance\b/i,
            /\bconfirm today\b/i
        ],
        warning: "The posting uses urgency or pressure to encourage a quick decision."
    },

    {
        key: "personalEmail",
        name: "Personal Email",
        points: 10,
        patterns: [
            /\b[\w.+-]+@(gmail|yahoo|outlook|hotmail|protonmail)\.(com|in|co|net)\b/i
        ],
        warning: "The recruiter appears to use a free personal email provider instead of a company domain."
    },

    {
        key: "whatsapp",
        name: "WhatsApp-First Contact",
        points: 8,
        patterns: [
            /\bwhatsapp\b/i,
            /\bcontact.{0,20}whatsapp\b/i,
            /\bmessage.{0,20}whatsapp\b/i
        ],
        warning: "The posting pushes applicants toward WhatsApp for recruitment communication."
    },

    {
        key: "otp",
        name: "OTP Request",
        points: 35,
        patterns: [
            /\bshare\b.{0,30}\botp\b/i,
            /\bsend\b.{0,30}\botp\b/i,
            /\botp\b.{0,30}\bverification\b/i,
            /\bverification\b.{0,30}\botp\b/i
        ],
        warning: "A legitimate employer should not ask applicants to disclose OTPs."
    },

    {
        key: "bank",
        name: "Bank Information",
        points: 28,
        patterns: [
            /\bbank account\b/i,
            /\baccount number\b/i,
            /\bifsc\b/i,
            /\bnet banking\b/i,
            /\bdebit card\b/i,
            /\bcredit card\b/i,
            /\bcard number\b/i
        ],
        warning: "The posting requests sensitive financial information."
    },

    {
        key: "aadhaar",
        name: "Aadhaar Request",
        points: 20,
        patterns: [
            /\baadhaar\b/i,
            /\baadhar\b/i,
            /\baadhaar number\b/i
        ],
        warning: "The posting requests Aadhaar information during recruitment."
    },

    {
        key: "pan",
        name: "PAN Request",
        points: 18,
        patterns: [
            /\bpan number\b/i,
            /\bpan card\b/i
        ],
        warning: "The posting requests PAN information."
    },

    {
        key: "upiPin",
        name: "UPI PIN Request",
        points: 40,
        patterns: [
            /\bupi pin\b/i,
            /\bupi password\b/i,
            /\bpin\b.{0,20}\bupi\b/i
        ],
        warning: "A UPI PIN should never be shared with a recruiter or employer."
    },

    {
        key: "fakeSelection",
        name: "Instant Selection",
        points: 18,
        patterns: [
            /\bcongratulations\b.{0,100}\bselected\b/i,
            /\byou have been selected\b/i,
            /\bselected immediately\b/i,
            /\bdirect selection\b/i,
            /\bguaranteed job\b/i
        ],
        warning: "The posting appears to promise selection without sufficient evaluation."
    },

    {
        key: "noExperience",
        name: "No Experience Promise",
        points: 8,
        patterns: [
            /\bno experience required\b/i,
            /\bwithout experience\b/i,
            /\banyone can apply\b/i
        ],
        warning: "No experience requirements combined with other strong promises can increase risk."
    },

    {
        key: "suspiciousLanguage",
        name: "Suspicious Wording",
        points: 10,
        patterns: [
            /\bguaranteed\b/i,
            /\beasy money\b/i,
            /\bquick money\b/i,
            /\bearn money from home\b/i,
            /\brich\b/i,
            /\bsecret opportunity\b/i,
            /\b100% job\b/i
        ],
        warning: "The posting contains language commonly associated with misleading job offers."
    }
];

/* =========================================================
   CONTACT DETECTION
========================================================= */

function detectContacts(text) {
    const phones = text.match(
        /(?:\+91[\s-]?)?[6-9]\d{9}\b/g
    ) || [];

    const emails = text.match(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
    ) || [];

    const urls = text.match(
        /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi
    ) || [];

    const upi = text.match(
        /\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\b/g
    ) || [];

    const personalEmails = emails.filter((email) =>
        /(gmail|yahoo|outlook|hotmail|protonmail)\./i.test(email)
    );

    return {
        phones: [...new Set(phones)],
        emails: [...new Set(emails)],
        urls: [...new Set(urls)],
        upi: [...new Set(upi)],
        personalEmails: [...new Set(personalEmails)]
    };
}

/* =========================================================
   PERSONAL INFORMATION DETECTION
========================================================= */

function detectPersonalData(text) {
    const findings = [];

    const checks = [
        {
            label: "Aadhaar number",
            regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/i
        },
        {
            label: "PAN number",
            regex: /\b[A-Z]{5}\d{4}[A-Z]\b/i
        },
        {
            label: "Bank account information",
            regex: /\b(bank account|account number|account details|ifsc)\b/i
        },
        {
            label: "OTP",
            regex: /\b(otp|one[-\s]?time password)\b/i
        },
        {
            label: "Credit/debit card information",
            regex: /\b(credit card|debit card|card number|cvv)\b/i
        },
        {
            label: "UPI PIN",
            regex: /\bupi\s*pin\b/i
        }
    ];

    checks.forEach((check) => {
        if (check.regex.test(text)) {
            findings.push(check.label);
        }
    });

    return [...new Set(findings)];
}

/* =========================================================
   SALARY ANALYSIS
========================================================= */

function analyzeSalary(text) {
    const salaryPatterns = [
        /₹\s*[\d,]+\s*(?:per month|monthly)/gi,
        /rs\.?\s*[\d,]+\s*(?:per month|monthly)/gi,
        /inr\s*[\d,]+\s*(?:per month|monthly)/gi,
        /₹\s*[\d,]+/gi,
        /\b\d+\s*(?:lakh|lakhs)\b/gi
    ];

    const matches = [];

    salaryPatterns.forEach((pattern) => {
        const found = text.match(pattern);
        if (found) {
            matches.push(...found);
        }
    });

    const uniqueMatches = [...new Set(matches)];

    const unrealistic =
        /\bguaranteed salary\b|\bguaranteed income\b|\b1 lakh\b|\b2 lakh\b|\b3 lakh\b/i.test(text) ||
        uniqueMatches.some((value) => {
            const number = parseInt(
                value.replace(/[^\d]/g, ""),
                10
            );

            return number >= 50000;
        });

    let message = "No obvious salary red flag detected.";

    if (unrealistic) {
        message =
            "The salary/earning promise may be unusually high relative to the stated requirements. Verify the role, company and compensation independently.";
    } else if (uniqueMatches.length) {
        message =
            "A salary amount was detected. Compare it with the role, experience requirements and the company's official job listing.";
    }

    return {
        matches: uniqueMatches,
        unrealistic,
        message
    };
}

/* =========================================================
   RULE MATCHING
========================================================= */

function evaluateRules(text) {
    const triggered = [];

    rules.forEach((rule) => {
        const matched = rule.patterns.some((pattern) =>
            pattern.test(text)
        );

        if (matched) {
            triggered.push({
                ...rule
            });
        }
    });

    return triggered;
}

/* =========================================================
   RISK SCORE
========================================================= */

function calculateRisk(triggeredRules, personalData, contacts, salaryInfo) {
    let score = 0;

    triggeredRules.forEach((rule) => {
        score += rule.points;
    });

    /*
       Extra contextual adjustments
    */

    if (personalData.length >= 2) {
        score += 10;
    }

    if (contacts.phones.length && contacts.personalEmails.length) {
        score += 5;
    }

    if (salaryInfo.unrealistic) {
        score += 5;
    }

    /*
       Cap score to 100
    */

    score = Math.min(100, Math.round(score));

    let level = "low";

    if (score >= 60) {
        level = "high";
    } else if (score >= 30) {
        level = "suspicious";
    }

    return {
        score,
        level
    };
}

/* =========================================================
   RISK BREAKDOWN
========================================================= */

function buildBreakdown(triggeredRules) {
    const categories = [
        {
            name: "Payment / Money",
            keys: ["payment"]
        },
        {
            name: "Selection Process",
            keys: ["noInterview", "fakeSelection", "noExperience"]
        },
        {
            name: "Salary Claims",
            keys: ["unrealisticSalary"]
        },
        {
            name: "Urgency",
            keys: ["urgency"]
        },
        {
            name: "Contact Signals",
            keys: ["personalEmail", "whatsapp"]
        },
        {
            name: "Sensitive Data",
            keys: ["otp", "bank", "aadhaar", "pan", "upiPin"]
        },
        {
            name: "Suspicious Language",
            keys: ["suspiciousLanguage"]
        }
    ];

    return categories.map((category) => {
        const matches = triggeredRules.filter((rule) =>
            category.keys.includes(rule.key)
        );

        const points = matches.reduce(
            (total, rule) => total + rule.points,
            0
        );

        return {
            name: category.name,
            points: Math.min(points, 100),
            max: 100
        };
    });
}

/* =========================================================
   RISK TEXT
========================================================= */

function getRiskInformation(level, score) {
    if (level === "high") {
        return {
            title: "High Risk Job Posting",
            pill: "HIGH RISK",
            explanation:
                `This posting contains multiple strong warning signs. The calculated risk score is ${score}/100. Do not send money, OTPs, UPI PINs or sensitive financial information based only on this posting.`,
            recommendation:
                "Stop before making any payment or sharing sensitive information. Verify the employer using its official website and independently obtained contact details."
        };
    }

    if (level === "suspicious") {
        return {
            title: "Suspicious Job Posting",
            pill: "SUSPICIOUS",
            explanation:
                `This posting contains several warning indicators. The calculated risk score is ${score}/100. Further verification is recommended before sharing personal information or proceeding.`,
            recommendation:
                "Verify the company, recruiter identity, official email domain, interview process and compensation before proceeding."
        };
    }

    return {
        title: "Lower Risk Pattern",
        pill: "LOW RISK",
        explanation:
            `The posting contains fewer obvious warning indicators. The calculated risk score is ${score}/100. This does not prove that the employer is genuine.`,
        recommendation:
            "Continue to verify the employer independently. Apply through an official company careers page whenever possible."
    };
}

/* =========================================================
   WARNING LIST
========================================================= */

function renderWarnings(triggeredRules, personalData) {
    if (!warningList) {
        return;
    }

    const warnings = triggeredRules.map((rule) => ({
        title: rule.name,
        description: rule.warning
    }));

    personalData.forEach((item) => {
        warnings.push({
            title: "Sensitive Information Detected",
            description:
                `The text appears to mention ${item}. Avoid sharing sensitive personal information unless it is genuinely necessary and securely verified.`
        });
    });

    if (!warnings.length) {
        warningList.innerHTML = `
            <div class="empty-state">
                No major warning patterns were detected in the submitted text.
            </div>
        `;
        return;
    }

    warningList.innerHTML = warnings
        .map(
            (warning) => `
                <div class="warning-item">
                    <div class="warning-item-icon">!</div>

                    <div class="warning-item-content">
                        <div class="warning-item-title">
                            ${escapeHTML(warning.title)}
                        </div>

                        <div class="warning-item-description">
                            ${escapeHTML(warning.description)}
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
}

/* =========================================================
   BREAKDOWN RENDER
========================================================= */

function renderBreakdown(breakdown) {
    if (!riskBreakdown) {
        return;
    }

    riskBreakdown.innerHTML = breakdown
        .map(
            (item) => `
                <div class="breakdown-item">
                    <div class="breakdown-info">
                        <div class="breakdown-name">
                            ${escapeHTML(item.name)}
                        </div>
                    </div>

                    <div class="breakdown-bar">
                        <div
                            class="breakdown-bar-fill"
                            style="width: ${Math.min(item.points, 100)}%"
                        ></div>
                    </div>

                    <div class="breakdown-points">
                        ${item.points} pts
                    </div>
                </div>
            `
        )
        .join("");
}

/* =========================================================
   CONTACT ANALYSIS
========================================================= */

function renderContactAnalysis(contacts) {
    if (!contactAnalysis) {
        return;
    }

    const rows = [
        {
            label: "Phone numbers",
            value: contacts.phones.length
                ? contacts.phones.join(", ")
                : "None detected"
        },
        {
            label: "Email addresses",
            value: contacts.emails.length
                ? contacts.emails.join(", ")
                : "None detected"
        },
        {
            label: "Personal email",
            value: contacts.personalEmails.length
                ? contacts.personalEmails.join(", ")
                : "None detected"
        },
        {
            label: "URLs",
            value: contacts.urls.length
                ? contacts.urls.join(", ")
                : "None detected"
        },
        {
            label: "Possible UPI IDs",
            value: contacts.upi.length
                ? contacts.upi.join(", ")
                : "None detected"
        }
    ];

    contactAnalysis.innerHTML = `
        <div class="analysis-rows">
            ${rows
                .map(
                    (row) => `
                        <div class="analysis-row">
                            <span class="analysis-label">
                                ${escapeHTML(row.label)}
                            </span>

                            <span class="analysis-value">
                                ${escapeHTML(row.value)}
                            </span>
                        </div>
                    `
                )
                .join("")}
        </div>
    `;
}

/* =========================================================
   SALARY ANALYSIS
========================================================= */

function renderSalaryAnalysis(salaryInfo) {
    if (!salaryAnalysis) {
        return;
    }

    salaryAnalysis.innerHTML = `
        <div class="analysis-rows">
            <div class="analysis-row">
                <span class="analysis-label">
                    Salary mentions
                </span>

                <span class="analysis-value">
                    ${
                        salaryInfo.matches.length
                            ? escapeHTML(salaryInfo.matches.join(", "))
                            : "None detected"
                    }
                </span>
            </div>

            <div class="analysis-row">
                <span class="analysis-label">
                    Assessment
                </span>

                <span class="analysis-value">
                    ${escapeHTML(salaryInfo.message)}
                </span>
            </div>
        </div>
    `;
}

/* =========================================================
   PERSONAL DATA WARNING
========================================================= */

function renderPersonalDataWarning(personalData) {
    if (!personalDataWarning) {
        return;
    }

    if (!personalData.length) {
        personalDataWarning.classList.add("hidden");
        personalDataWarning.innerHTML = "";
        return;
    }

    personalDataWarning.classList.remove("hidden");

    personalDataWarning.innerHTML = `
        <strong>⚠ Sensitive information detected</strong>

        <p>
            The submitted text contains references to:
            ${escapeHTML(personalData.join(", "))}.
            Never share OTPs, UPI PINs, passwords or unnecessary financial
            information with recruiters.
        </p>
    `;
}

/* =========================================================
   TEXT HIGHLIGHTING
========================================================= */

function highlightText(text, triggeredRules) {
    let result = escapeHTML(text);

    const phrases = [];

    triggeredRules.forEach((rule) => {
        rule.patterns.forEach((pattern) => {
            const source = pattern.source;

            /*
                Only use simple patterns for highlighting.
                Complex regex groups are skipped to avoid
                breaking the original text.
            */

            if (
                !source.includes(".*") &&
                !source.includes(".{") &&
                !source.includes("\\d")
            ) {
                phrases.push({
                    source,
                    type:
                        rule.points >= 25
                            ? "risk"
                            : "warning"
                });
            }
        });
    });

    /*
       Common high-value phrases.
    */

    const commonRiskPhrases = [
        "registration fee",
        "processing fee",
        "joining fee",
        "security deposit",
        "refundable fee",
        "otp",
        "upi pin",
        "bank account",
        "aadhaar",
        "pan number",
        "no interview",
        "guaranteed salary",
        "guaranteed income",
        "pay",
        "limited vacancies",
        "apply immediately"
    ];

    commonRiskPhrases.forEach((phrase) => {
        phrases.push({
            source: phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            type:
                /fee|otp|upi|bank|aadhaar|pan|no interview|guaranteed|pay/i.test(
                    phrase
                )
                    ? "risk"
                    : "warning"
        });
    });

    /*
       Longest first to reduce partial replacements.
    */

    phrases.sort(
        (a, b) => b.source.length - a.source.length
    );

    const used = new Set();

    phrases.forEach((item) => {
        if (used.has(item.source.toLowerCase())) {
            return;
        }

        used.add(item.source.toLowerCase());

        try {
            const regex = new RegExp(
                `(${item.source})`,
                "gi"
            );

            result = result.replace(
                regex,
                `<mark class="highlight-${item.type}">$1</mark>`
            );
        } catch {
            /* Ignore unsupported highlight pattern */
        }
    });

    return result;
}

/* =========================================================
   DETAILED EXPLANATION
========================================================= */

function buildDetailedExplanation(
    triggeredRules,
    contacts,
    personalData,
    salaryInfo
) {
    const paragraphs = [];

    if (triggeredRules.length) {
        paragraphs.push(
            `The analyzer detected ${triggeredRules.length} warning pattern${
                triggeredRules.length === 1 ? "" : "s"
            } in the submitted job text.`
        );
    } else {
        paragraphs.push(
            "No major predefined warning patterns were detected in the submitted text."
        );
    }

    if (contacts.personalEmails.length) {
        paragraphs.push(
            `A free email provider was detected: ${contacts.personalEmails.join(
                ", "
            )}. A personal email address does not automatically mean fraud, but applicants should verify the employer independently.`
        );
    }

    if (salaryInfo.unrealistic) {
        paragraphs.push(
            "The compensation language contains a potentially unrealistic or guaranteed earning claim. Compare the compensation with the role and official company information."
        );
    }

    if (personalData.length) {
        paragraphs.push(
            `Sensitive information references were found: ${personalData.join(
                ", "
            )}. Recruitment messages should not request OTPs, UPI PINs or unnecessary banking credentials.`
        );
    }

    paragraphs.push(
        "This is a rule-based client-side analysis. It is a warning system, not proof that a job is fraudulent or genuine."
    );

    return paragraphs
        .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
        .join("");
}

/* =========================================================
   DISPLAY RESULT
========================================================= */

function displayResult(analysis) {
    if (!resultSection) {
        return;
    }

    const info = getRiskInformation(
        analysis.risk.level,
        analysis.risk.score
    );

    if (riskScore) {
        riskScore.textContent = analysis.risk.score;
    }

    if (riskPill) {
        riskPill.textContent = info.pill;

        riskPill.classList.remove(
            "risk-low",
            "risk-suspicious",
            "risk-high"
        );

        riskPill.classList.add(
            `risk-${analysis.risk.level}`
        );
    }

    if (riskTitle) {
        riskTitle.textContent = info.title;
    }

    if (riskExplanation) {
        riskExplanation.textContent = info.explanation;
    }

    if (meterValue) {
        meterValue.textContent = `${analysis.risk.score}/100`;
    }

    if (meterFill) {
        meterFill.style.width = `${analysis.risk.score}%`;
    }

    if (riskCard) {
        riskCard.classList.remove(
            "risk-low",
            "risk-suspicious",
            "risk-high"
        );

        riskCard.classList.add(
            `risk-${analysis.risk.level}`
        );
    }

    renderBreakdown(analysis.breakdown);

    renderWarnings(
        analysis.triggeredRules,
        analysis.personalData
    );

    if (detailedExplanation) {
        detailedExplanation.innerHTML =
            analysis.detailedExplanation;
    }

    if (recommendation) {
        recommendation.innerHTML = `
            <div class="analysis-row">
                <span class="analysis-label">
                    Recommendation
                </span>

                <span class="analysis-value">
                    ${escapeHTML(info.recommendation)}
                </span>
            </div>
        `;
    }

    if (highlightedText) {
        highlightedText.innerHTML = highlightText(
            analysis.text,
            analysis.triggeredRules
        );
    }

    renderContactAnalysis(analysis.contacts);
    renderSalaryAnalysis(analysis.salary);
    renderPersonalDataWarning(analysis.personalData);

    resultSection.classList.remove("hidden");

    setTimeout(() => {
        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 100);
}

/* =========================================================
   ANALYSIS ENGINE
========================================================= */

function analyzeJob(text) {
    const normalizedText = text.trim();

    const triggeredRules = evaluateRules(
        normalizedText
    );

    const contacts = detectContacts(
        normalizedText
    );

    const personalData = detectPersonalData(
        normalizedText
    );

    const salary = analyzeSalary(
        normalizedText
    );

    const risk = calculateRisk(
        triggeredRules,
        personalData,
        contacts,
        salary
    );

    const breakdown = buildBreakdown(
        triggeredRules
    );

    const detailedExplanation =
        buildDetailedExplanation(
            triggeredRules,
            contacts,
            personalData,
            salary
        );

    return {
        id: Date.now(),
        text: normalizedText,
        risk,
        triggeredRules,
        contacts,
        personalData,
        salary,
        breakdown,
        detailedExplanation,
        createdAt: new Date().toISOString()
    };
}

/* =========================================================
   LOADING
========================================================= */

function showLoading() {
    if (loadingArea) {
        loadingArea.classList.remove("hidden");
    }

    if (errorMessage) {
        errorMessage.classList.add("hidden");
    }

    if (analyzeButton) {
        analyzeButton.disabled = true;
    }

    const messages = [
        translations[currentLanguage].analyzing,
        translations[currentLanguage].processing,
        translations[currentLanguage].generating
    ];

    let index = 0;

    if (loadingText) {
        loadingText.textContent = messages[0];
    }

    const interval = setInterval(() => {
        index++;

        if (index >= messages.length) {
            clearInterval(interval);
            return;
        }

        if (loadingText) {
            loadingText.textContent = messages[index];
        }
    }, 550);

    return interval;
}

function hideLoading(interval) {
    if (interval) {
        clearInterval(interval);
    }

    if (loadingArea) {
        loadingArea.classList.add("hidden");
    }

    if (analyzeButton) {
        analyzeButton.disabled = false;
    }
}

/* =========================================================
   HISTORY STORAGE
========================================================= */

function getHistory() {
    try {
        const saved = localStorage.getItem(
            STORAGE_KEY
        );

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch {
        return [];
    }
}

function saveHistory(analysis) {
    const history = getHistory();

    const item = {
        id: analysis.id,
        text: analysis.text,
        score: analysis.risk.score,
        level: analysis.risk.level,
        createdAt: analysis.createdAt
    };

    history.unshift(item);

    /*
       Keep the latest 30 analyses.
    */

    const trimmed = history.slice(0, 30);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trimmed)
    );
}

/* =========================================================
   HISTORY RENDER
========================================================= */

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    } catch {
        return dateString;
    }
}

function getLevelLabel(level) {
    if (level === "high") {
        return "HIGH RISK";
    }

    if (level === "suspicious") {
        return "SUSPICIOUS";
    }

    return "LOW RISK";
}

function renderHistory() {
    const history = getHistory();

    if (
        totalScans &&
        highRiskCount &&
        suspiciousCount &&
        lowRiskCount
    ) {
        totalScans.textContent = history.length;

        highRiskCount.textContent =
            history.filter(
                (item) => item.level === "high"
            ).length;

        suspiciousCount.textContent =
            history.filter(
                (item) => item.level === "suspicious"
            ).length;

        lowRiskCount.textContent =
            history.filter(
                (item) => item.level === "low"
            ).length;
    }

    if (!historyList) {
        return;
    }

    if (!history.length) {
        historyList.innerHTML = `
            <div class="empty-state">
                No analyses yet. Analyze a job posting to create history.
            </div>
        `;

        return;
    }

    historyList.innerHTML = history
        .map((item) => {
            const preview = item.text
                .replace(/\s+/g, " ")
                .trim();

            return `
                <div class="history-item">
                    <div>
                        <div class="history-item-title">
                            ${escapeHTML(
                                preview.slice(0, 100)
                            )}${preview.length > 100 ? "..." : ""}
                        </div>

                        <div class="history-item-date">
                            ${escapeHTML(
                                formatDate(item.createdAt)
                            )}
                        </div>
                    </div>

                    <div class="history-score risk-${escapeHTML(
                        item.level
                    )}">
                        ${item.score}/100
                    </div>
                </div>
            `;
        })
        .join("");
}

/* =========================================================
   ANALYSIS ACTION
========================================================= */

async function handleAnalyze() {
    if (!jobDescription) {
        return;
    }

    const text = jobDescription.value.trim();

    if (!text) {
        showError(
            "Please paste a job or internship description first."
        );

        jobDescription.focus();

        return;
    }

    if (text.length < 40) {
        showError(
            "Please provide a little more job information for a meaningful analysis."
        );

        jobDescription.focus();

        return;
    }

    const loadingInterval = showLoading();

    /*
       Small delay makes the analysis feel deliberate
       without requiring a backend.
    */

    await new Promise((resolve) =>
        setTimeout(resolve, 1500)
    );

    try {
        const analysis = analyzeJob(text);

        currentAnalysis = analysis;

        saveHistory(analysis);
        displayResult(analysis);
        renderHistory();

        hideLoading(loadingInterval);
    } catch (error) {
        console.error(
            "AI JobGuard analysis error:",
            error
        );

        hideLoading(loadingInterval);

        showError(
            "Something went wrong while analyzing the text. Please try again."
        );
    }
}

/* =========================================================
   ERROR
========================================================= */

function showError(message) {
    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

/* =========================================================
   CHARACTER COUNT
========================================================= */

function updateCharacterCount() {
    if (!jobDescription || !characterCount) {
        return;
    }

    characterCount.textContent =
        `${jobDescription.value.length.toLocaleString()} characters`;
}

/* =========================================================
   CLEAR ANALYZER
========================================================= */

function clearAnalyzer() {
    if (jobDescription) {
        jobDescription.value = "";
    }

    updateCharacterCount();

    if (errorMessage) {
        errorMessage.classList.add("hidden");
    }

    if (resultSection) {
        resultSection.classList.add("hidden");
    }

    currentAnalysis = null;

    if (jobDescription) {
        jobDescription.focus();
    }
}

/* =========================================================
   SAMPLE JOB LOADER
========================================================= */

function loadSample(type) {
    if (!jobDescription) {
        return;
    }

    const sample = sampleJobs[type];

    if (!sample) {
        return;
    }

    jobDescription.value = sample;

    updateCharacterCount();

    if (errorMessage) {
        errorMessage.classList.add("hidden");
    }

    jobDescription.focus();

    window.scrollTo({
        top:
            jobDescription.getBoundingClientRect().top +
            window.scrollY -
            120,
        behavior: "smooth"
    });
}

/* =========================================================
   COPY ANALYSIS
========================================================= */

function buildAnalysisText(analysis) {
    if (!analysis) {
        return "";
    }

    const info = getRiskInformation(
        analysis.risk.level,
        analysis.risk.score
    );

    const warnings = analysis.triggeredRules
        .map(
            (rule) =>
                `- ${rule.name}: ${rule.warning}`
        )
        .join("\n");

    return `
AI JOBGUARD — JOB RISK ANALYSIS

Risk Score: ${analysis.risk.score}/100
Risk Level: ${info.pill}

${info.explanation}

WARNING SIGNS:
${warnings || "- No major warning patterns detected."}

PERSONAL DATA:
${
    analysis.personalData.length
        ? analysis.personalData.join(", ")
        : "None detected"
}

CONTACTS:
Phone: ${
        analysis.contacts.phones.join(", ") ||
        "None detected"
    }
Email: ${
        analysis.contacts.emails.join(", ") ||
        "None detected"
    }
URLs: ${
        analysis.contacts.urls.join(", ") ||
        "None detected"
    }

SALARY:
${
    analysis.salary.matches.join(", ") ||
    "None detected"
}

RECOMMENDATION:
${info.recommendation}

DISCLAIMER:
This is a client-side rule-based analysis. It is not proof that a job is fraudulent or genuine.
    `.trim();
}

async function copyCurrentAnalysis() {
    if (!currentAnalysis) {
        showError(
            "Analyze a job posting first."
        );

        return;
    }

    const text =
        buildAnalysisText(currentAnalysis);

    try {
        await navigator.clipboard.writeText(text);

        showTemporaryButtonText(
            copyAnalysis,
            "Copied ✓"
        );
    } catch {
        fallbackCopy(text);

        showTemporaryButtonText(
            copyAnalysis,
            "Copied ✓"
        );
    }
}

/* =========================================================
   COPY FALLBACK
========================================================= */

function fallbackCopy(text) {
    const textarea =
        document.createElement("textarea");

    textarea.value = text;

    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();

    try {
        document.execCommand("copy");
    } catch {
        /* Ignore clipboard fallback failure */
    }

    textarea.remove();
}

/* =========================================================
   BUTTON TEMP TEXT
========================================================= */

function showTemporaryButtonText(
    button,
    temporaryText
) {
    if (!button) {
        return;
    }

    const original = button.textContent;

    button.textContent = temporaryText;

    setTimeout(() => {
        button.textContent = original;
    }, 1800);
}

/* =========================================================
   SHARE ANALYSIS
========================================================= */

async function shareCurrentAnalysis() {
    if (!currentAnalysis) {
        showError(
            "Analyze a job posting first."
        );

        return;
    }

    const text =
        buildAnalysisText(currentAnalysis);

    if (
        navigator.share &&
        typeof navigator.share === "function"
    ) {
        try {
            await navigator.share({
                title: "AI JobGuard Analysis",
                text
            });

            return;
        } catch {
            /*
               User may cancel sharing.
            */
        }
    }

    try {
        await navigator.clipboard.writeText(text);

        showTemporaryButtonText(
            shareAnalysis,
            "Copied ✓"
        );
    } catch {
        fallbackCopy(text);

        showTemporaryButtonText(
            shareAnalysis,
            "Copied ✓"
        );
    }
}

/* =========================================================
   DOWNLOAD REPORT
========================================================= */

function downloadCurrentReport() {
    if (!currentAnalysis) {
        showError(
            "Analyze a job posting first."
        );

        return;
    }

    const analysis =
        currentAnalysis;

    const info = getRiskInformation(
        analysis.risk.level,
        analysis.risk.score
    );

    const warnings = analysis.triggeredRules.length
        ? analysis.triggeredRules
              .map(
                  (rule) =>
                      `<li><strong>${escapeHTML(
                          rule.name
                      )}</strong> — ${escapeHTML(
                          rule.warning
                      )}</li>`
              )
              .join("")
        : "<li>No major warning patterns detected.</li>";

    const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>AI JobGuard Report</title>

<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 850px;
        margin: 40px auto;
        padding: 0 20px;
        color: #172033;
        line-height: 1.6;
    }

    h1 {
        color: #087ea4;
    }

    .score {
        font-size: 42px;
        font-weight: bold;
    }

    .level {
        display: inline-block;
        padding: 7px 12px;
        border-radius: 20px;
        background: #eef4ff;
        font-weight: bold;
    }

    .box {
        padding: 18px;
        margin: 18px 0;
        border: 1px solid #d8dfeb;
        border-radius: 12px;
    }

    li {
        margin-bottom: 8px;
    }

    .source {
        white-space: pre-wrap;
        background: #f5f7fb;
        padding: 15px;
        border-radius: 10px;
    }

    .disclaimer {
        color: #68738a;
        font-size: 12px;
    }
</style>

</head>

<body>

<h1>AI JobGuard</h1>

<p>AI-Powered Fake Job & Internship Detector</p>

<div class="box">
    <div>Risk Score</div>
    <div class="score">
        ${analysis.risk.score}/100
    </div>

    <div class="level">
        ${escapeHTML(info.pill)}
    </div>
</div>

<div class="box">
    <h2>Explanation</h2>
    <p>${escapeHTML(info.explanation)}</p>
</div>

<div class="box">
    <h2>Warning Signs</h2>
    <ul>
        ${warnings}
    </ul>
</div>

<div class="box">
    <h2>Personal Data Detected</h2>

    <p>
        ${
            analysis.personalData.length
                ? escapeHTML(
                      analysis.personalData.join(
                          ", "
                      )
                  )
                : "None detected"
        }
    </p>
</div>

<div class="box">
    <h2>Recommendation</h2>

    <p>
        ${escapeHTML(info.recommendation)}
    </p>
</div>

<div class="box">
    <h2>Submitted Job Text</h2>

    <div class="source">
        ${escapeHTML(analysis.text)}
    </div>
</div>

<p class="disclaimer">
    This report is generated by a client-side,
    rule-based analysis system. It is intended as a
    safety aid and does not prove that a job is
    fraudulent or genuine.
</p>

</body>
</html>
    `.trim();

    const blob = new Blob(
        [reportHTML],
        {
            type: "text/html"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `AI-JobGuard-Report-${Date.now()}.html`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showTemporaryButtonText(
        downloadReport,
        "Downloaded ✓"
    );
}

/* =========================================================
   CLEAR HISTORY
========================================================= */

function handleClearHistory() {
    const history = getHistory();

    if (!history.length) {
        return;
    }

    const confirmed = window.confirm(
        "Clear all AI JobGuard analysis history?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        STORAGE_KEY
    );

    renderHistory();
}

/* =========================================================
   LANGUAGE
========================================================= */

function handleLanguageChange() {
    if (!languageSelector) {
        return;
    }

    currentLanguage =
        languageSelector.value || "en";

    /*
       Keep the analyzer functional while providing
       language-aware loading/risk labels.
    */

    const status =
        document.querySelector(
            ".system-status"
        );

    if (status) {
        const dot =
            status.querySelector(
                ".status-dot"
            );

        status.textContent =
            translations[currentLanguage]
                .systemOnline;

        if (dot) {
            status.prepend(dot);
        }
    }
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {
    const links = $$(".nav-links a");

    links.forEach((link) => {
        link.addEventListener(
            "click",
            (event) => {
                const href =
                    link.getAttribute("href");

                if (
                    !href ||
                    !href.startsWith("#")
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        href
                    );

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        );
    });
}

/* =========================================================
   LIVE BACKGROUND
========================================================= */

function initBackground() {
    const canvas =
        document.getElementById(
            "backgroundCanvas"
        );

    if (!canvas) {
        return;
    }

    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const particles = [];

    const particleCount =
        window.innerWidth < 700
            ? 35
            : 70;

    function resizeCanvas() {
        const ratio =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        canvas.width =
            window.innerWidth * ratio;

        canvas.height =
            window.innerHeight * ratio;

        canvas.style.width =
            `${window.innerWidth}px`;

        canvas.style.height =
            `${window.innerHeight}px`;

        ctx.setTransform(
            ratio,
            0,
            0,
            ratio,
            0,
            0
        );
    }

    function createParticle() {
        return {
            x:
                Math.random() *
                window.innerWidth,

            y:
                Math.random() *
                window.innerHeight,

            radius:
                Math.random() * 1.6 +
                0.4,

            speedX:
                (Math.random() - 0.5) *
                0.22,

            speedY:
                (Math.random() - 0.5) *
                0.22,

            alpha:
                Math.random() * 0.5 +
                0.15
        };
    }

    for (
        let i = 0;
        i < particleCount;
        i++
    ) {
        particles.push(
            createParticle()
        );
    }

    function animate() {
        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        particles.forEach(
            (particle) => {
                particle.x +=
                    particle.speedX;

                particle.y +=
                    particle.speedY;

                if (
                    particle.x < -20 ||
                    particle.x >
                        window.innerWidth +
                            20
                ) {
                    particle.x =
                        Math.random() *
                        window.innerWidth;
                }

                if (
                    particle.y < -20 ||
                    particle.y >
                        window.innerHeight +
                            20
                ) {
                    particle.y =
                        Math.random() *
                        window.innerHeight;
                }

                ctx.beginPath();

                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.radius,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    `rgba(32, 217, 255, ${particle.alpha})`;

                ctx.fill();
            }
        );

        /*
           Connect nearby particles.
        */

        for (
            let i = 0;
            i < particles.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < particles.length;
                j++
            ) {
                const a =
                    particles[i];

                const b =
                    particles[j];

                const dx =
                    a.x - b.x;

                const dy =
                    a.y - b.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                            dy * dy
                    );

                if (distance < 115) {
                    const opacity =
                        (1 -
                            distance /
                                115) *
                        0.09;

                    ctx.beginPath();

                    ctx.moveTo(
                        a.x,
                        a.y
                    );

                    ctx.lineTo(
                        b.x,
                        b.y
                    );

                    ctx.strokeStyle =
                        `rgba(57, 123, 255, ${opacity})`;

                    ctx.lineWidth = 1;

                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(
            animate
        );
    }

    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    animate();
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {
    if (jobDescription) {
        jobDescription.addEventListener(
            "input",
            updateCharacterCount
        );
    }

    if (analyzeButton) {
        analyzeButton.addEventListener(
            "click",
            handleAnalyze
        );
    }

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearAnalyzer
        );
    }

    if (downloadReport) {
        downloadReport.addEventListener(
            "click",
            downloadCurrentReport
        );
    }

    if (copyAnalysis) {
        copyAnalysis.addEventListener(
            "click",
            copyCurrentAnalysis
        );
    }

    if (shareAnalysis) {
        shareAnalysis.addEventListener(
            "click",
            shareCurrentAnalysis
        );
    }

    if (clearHistory) {
        clearHistory.addEventListener(
            "click",
            handleClearHistory
        );
    }

    if (languageSelector) {
        languageSelector.addEventListener(
            "change",
            handleLanguageChange
        );
    }

    $$(".sample-button").forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const type =
                        button.dataset
                            .sample;

                    loadSample(type);
                }
            );
        }
    );

    /*
       Keyboard shortcut:
       Ctrl + Enter = Analyze
    */

    if (jobDescription) {
        jobDescription.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    handleAnalyze();
                }
            }
        );
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */

function init() {
    updateCharacterCount();

    renderHistory();

    setupNavigation();

    setupEventListeners();

    initBackground();

    /*
       Hide result section initially.
    */

    if (resultSection) {
        resultSection.classList.add(
            "hidden"
        );
    }

    /*
       Make sure error/loading states
       start hidden.
    */

    if (loadingArea) {
        loadingArea.classList.add(
            "hidden"
        );
    }

    if (errorMessage) {
        errorMessage.classList.add(
            "hidden"
        );
    }

    if (personalDataWarning) {
        personalDataWarning.classList.add(
            "hidden"
        );
    }

    console.log(
        "AI JobGuard initialized successfully."
    );
}

/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        init
    );
} else {
    init();
}
