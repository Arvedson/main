/**
 * AI Health Insight Prompt Builder
 *
 * Two separate prompts:
 * 1. buildPatientPrompt()  — Consumer-friendly wellness analysis (no medical jargon, legally safe)
 * 2. buildDoctorPrompt()   — Clinical assessment in medical language for the physician
 */

export interface InsightInput {
  patient: {
    name: string;
    age: number;
    gender: string;
    segment: string;
    heredity?: string | null;
    habits?: string | null;
    environment?: string | null;
  };
  latestVitals?: {
    systolicBP?: number | null;
    diastolicBP?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    temperature?: number | null;
    spo2?: number | null;
    glucose?: number | null;
    weight?: number | null;
    height?: number | null;
    bmi?: number | null;
  } | null;
  recentSymptoms?: {
    location: string;
    intensity: number;
    description?: string | null;
  }[];
  currentHealthScore?: {
    score: number;
    status: string;
  } | null;
  previousDiagnosis?: {
    healthSummary: string;
    predictions: any;
    alertLevel: string;
    timestamp: Date;
  } | null;
}

export interface InsightOutput {
  healthSummary: string;
  predictions: { title: string; detail: string; trend: "improving" | "stable" | "worsening" }[];
  habitImprovements: { category: string; suggestion: string; priority: "low" | "medium" | "high" }[];
  alertLevel: "LOW" | "MODERATE" | "HIGH";
  doctorNote: string;
}

export interface ClinicalOutput {
  clinicalSummary: string;
  differentialNotes: { consideration: string; rationale: string; priority: "low" | "moderate" | "high" }[];
  clinicalFlags: { metric: string; value: string; interpretation: string; action: string }[];
}

// ─────────────────────────────────────────────────────────────────────
// PATIENT PROMPT — Wellness language, no jargon, legally safe
// ─────────────────────────────────────────────────────────────────────
function buildVitalsBlock(v: InsightInput["latestVitals"]): string {
  if (!v) return "NO VITALS RECORDED YET.";
  return `LATEST VITAL SIGNS:
- Blood Pressure: ${v.systolicBP ?? "N/A"}/${v.diastolicBP ?? "N/A"} mmHg
- Heart Rate: ${v.heartRate ?? "N/A"} bpm
- Respiratory Rate: ${v.respiratoryRate ?? "N/A"} breaths/min
- Body Temperature: ${v.temperature ?? "N/A"} °C
- SpO2: ${v.spo2 ?? "N/A"}%
- Fasting Glucose: ${v.glucose ?? "N/A"} mg/dL
- Weight: ${v.weight ?? "N/A"} kg  |  Height: ${v.height ?? "N/A"} cm  |  BMI: ${v.bmi ?? "N/A"}`;
}

function buildSymptomsBlock(symptoms: InsightInput["recentSymptoms"]): string {
  if (!symptoms || symptoms.length === 0) return "NO SYMPTOMS REPORTED.";
  return `RECENT SYMPTOMS (last 5):\n${symptoms.map((s, i) => `${i + 1}. Location: ${s.location} | Intensity: ${s.intensity}/10${s.description ? ` | Notes: ${s.description}` : ""}`).join("\n")}`;
}

function buildPreviousBlock(prev: InsightInput["previousDiagnosis"]): string {
  if (!prev) return "FIRST ANALYSIS — no prior data available.";
  return `PREVIOUS ANALYSIS (${new Date(prev.timestamp).toLocaleDateString()}):
- Summary: ${prev.healthSummary}
- Alert Level was: ${prev.alertLevel}
- Previous Predictions: ${JSON.stringify(prev.predictions)}
Compare current state vs this previous analysis and identify changes in trends.`;
}

export function buildPatientPrompt(input: InsightInput): string {
  const { patient, latestVitals, recentSymptoms, currentHealthScore, previousDiagnosis } = input;

  return `You are a wellness analysis AI assistant on a health monitoring platform called VitalGuard AI.
You generate health INSIGHTS and lifestyle recommendations for patients to read.

ABSOLUTE RULES — FOLLOW EXACTLY:
- You are NOT a doctor. NEVER prescribe, recommend medications, or suggest diagnoses.
- Use warm, accessible language. No medical jargon.
- NEVER use words: "diagnosis", "prescribe", "disease", "pathology", "disorder", "treatment".
- Use instead: "wellness analysis", "health insight", "pattern", "trend", "we recommend talking to your doctor".
- If any vital signs are critically abnormal, set alertLevel to "HIGH" and recommend consulting a doctor.
- Suggestions must be general wellness only: exercise, sleep, hydration, stress reduction, nutrition.

PATIENT PROFILE:
- Age: ${patient.age} years | Gender: ${patient.gender} | Segment: ${patient.segment}
${patient.heredity ? `- Family Background: ${patient.heredity}` : ""}
${patient.habits ? `- Current Habits: ${patient.habits}` : ""}
${patient.environment ? `- Living Environment: ${patient.environment}` : ""}

${buildVitalsBlock(latestVitals)}
${currentHealthScore ? `\nCURRENT WELLNESS SCORE: ${currentHealthScore.score.toFixed(1)}/100 (${currentHealthScore.status})` : ""}
${buildSymptomsBlock(recentSymptoms)}
${buildPreviousBlock(previousDiagnosis)}

Respond ONLY with a valid JSON object, no markdown fences:
{
  "healthSummary": "2-3 warm sentences summarizing the patient's current wellness.",
  "predictions": [
    { "title": "Short title", "detail": "1-2 accessible sentences about this trend", "trend": "improving|stable|worsening" }
  ],
  "habitImprovements": [
    { "category": "Category", "suggestion": "Specific, actionable general wellness tip", "priority": "low|medium|high" }
  ],
  "alertLevel": "LOW|MODERATE|HIGH",
  "doctorNote": "One-line summary of key clinical data points worth mentioning to the doctor."
}

Produce 2-4 predictions and 2-4 habit improvements.`;
}

// ─────────────────────────────────────────────────────────────────────
// DOCTOR PROMPT — Full clinical language for the physician
// ─────────────────────────────────────────────────────────────────────
export function buildDoctorPrompt(input: InsightInput): string {
  const { patient, latestVitals, recentSymptoms, currentHealthScore, previousDiagnosis } = input;
  const v = latestVitals;

  return `You are an AI clinical decision support assistant for VitalGuard AI, a physician-facing health monitoring platform.
You are generating a clinical summary for a licensed physician. You may use full medical terminology.

PATIENT DATA:
- Age: ${patient.age} | Sex: ${patient.gender} | Risk Segment: ${patient.segment}
${patient.heredity ? `- Family Hx: ${patient.heredity}` : ""}
${patient.habits ? `- Social/Habit Hx: ${patient.habits}` : ""}
${patient.environment ? `- Environmental exposure: ${patient.environment}` : ""}

${buildVitalsBlock(latestVitals)}
${currentHealthScore ? `\nALGORITHMIC HEALTH SCORE: ${currentHealthScore.score.toFixed(1)}/100 (${currentHealthScore.status})` : ""}
${buildSymptomsBlock(recentSymptoms)}
${buildPreviousBlock(previousDiagnosis)}

TASK: Generate a physician-grade clinical assessment. You may:
- Use ICD-10 category references (do NOT assign a diagnosis, only suggest considerations)
- Reference clinical guidelines (JNC8, AHA/ACC, ADA, WHO, etc.)
- Flag specific vital sign deviations with clinical cut-offs (e.g., MAP, pulse pressure, BMI class)
- Suggest what additional workup may be warranted (labs, imaging) — framed as suggestions to the physician
- Note drug-class interactions if patient mentions medications in habits/history
- Use appropriate medical terminology (hypertension stage, tachycardia, hypoxemia, hyperglycemia, etc.)

DO NOT actually diagnose. Use language like "findings consistent with...", "warrants consideration of...", "may suggest...", "recommend physician evaluation of..."

Respond ONLY with valid JSON, no markdown:
{
  "clinicalSummary": "2-4 sentence clinical assessment using medical terminology. Reference specific values and their clinical significance.",
  "differentialNotes": [
    { "consideration": "Clinical consideration (e.g., Stage 1 Hypertension per JNC8)", "rationale": "Supporting data from vitals/symptoms", "priority": "low|moderate|high" }
  ],
  "clinicalFlags": [
    { "metric": "Metric name (e.g., Systolic BP)", "value": "Recorded value with unit", "interpretation": "Clinical interpretation (e.g., Stage 2 Hypertension threshold exceeded)", "action": "Suggested physician action (e.g., Consider ABPM, lifestyle modification counseling, pharmacotherapy evaluation)" }
  ]
}

Generate 2-4 differentialNotes and flag all clinically significant metrics in clinicalFlags.`;
}

// ─────────────────────────────────────────────────────────────────────
// RULE-BASED FALLBACK — Used when Gemini is unavailable
// ─────────────────────────────────────────────────────────────────────
export function generateSimulatedInsight(input: InsightInput): InsightOutput {
  const { latestVitals, currentHealthScore, recentSymptoms, previousDiagnosis } = input;
  const v = latestVitals;

  let alertLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
  const predictions: InsightOutput["predictions"] = [];
  const habitImprovements: InsightOutput["habitImprovements"] = [];

  if (v) {
    if (v.systolicBP && v.systolicBP > 140) {
      alertLevel = "HIGH";
      predictions.push({ title: "Elevated Blood Pressure", detail: `Your reading of ${v.systolicBP}/${v.diastolicBP} mmHg is above the healthy range. Monitor closely.`, trend: "worsening" });
      habitImprovements.push({ category: "Nutrition", suggestion: "Reduce sodium intake and increase potassium-rich foods (bananas, leafy greens, legumes).", priority: "high" });
    } else if (v.systolicBP && v.systolicBP > 120) {
      if (alertLevel === "LOW") alertLevel = "MODERATE";
      predictions.push({ title: "Blood Pressure Slightly Elevated", detail: `Your BP of ${v.systolicBP}/${v.diastolicBP} mmHg is in the elevated range. Regular monitoring is recommended.`, trend: "stable" });
    } else if (v.systolicBP) {
      predictions.push({ title: "Blood Pressure Normal", detail: `Your BP of ${v.systolicBP}/${v.diastolicBP} mmHg is within the healthy range. Keep it up!`, trend: "improving" });
    }
    if (v.heartRate && (v.heartRate > 100 || v.heartRate < 50)) {
      if (alertLevel === "LOW") alertLevel = "MODERATE";
      predictions.push({ title: "Heart Rate Outside Normal Range", detail: `A resting heart rate of ${v.heartRate} bpm is outside 60-100 bpm. Consider stress management and relaxation techniques.`, trend: "worsening" });
    }
    if (v.spo2 && v.spo2 < 95) {
      alertLevel = "HIGH";
      predictions.push({ title: "Low Oxygen Saturation", detail: `SpO2 of ${v.spo2}% is below 95%. Please contact your healthcare provider promptly.`, trend: "worsening" });
    }
    if (v.glucose && v.glucose > 126) {
      alertLevel = "HIGH";
      predictions.push({ title: "Elevated Fasting Glucose", detail: `A glucose reading of ${v.glucose} mg/dL is above normal. Please speak with your healthcare provider.`, trend: "worsening" });
    }
    if (v.bmi && v.bmi > 30) {
      habitImprovements.push({ category: "Physical Activity", suggestion: "Aim for 150 min/week of moderate aerobic activity. Start with 20-min daily walks.", priority: "high" });
    } else if (v.bmi && v.bmi > 25) {
      habitImprovements.push({ category: "Physical Activity", suggestion: "Include 30 minutes of light movement daily — walking, cycling, or swimming.", priority: "medium" });
    }
  }

  if (recentSymptoms && recentSymptoms.length > 0) {
    const highIntensity = recentSymptoms.filter(s => s.intensity >= 7);
    if (highIntensity.length > 0) {
      if (alertLevel === "LOW") alertLevel = "MODERATE";
      predictions.push({ title: "High-Intensity Symptoms", detail: `${highIntensity.length} symptom(s) reported at intensity 7+. If persistent, schedule a consultation with your doctor.`, trend: "worsening" });
    }
  }

  if (habitImprovements.length < 2) {
    habitImprovements.push({ category: "Hydration", suggestion: "Aim for 2 liters of water daily. Proper hydration supports cardiovascular and cognitive health.", priority: "low" });
    habitImprovements.push({ category: "Sleep", suggestion: "Maintain a consistent 7–9 hour sleep schedule. Quality sleep is foundational for wellness.", priority: "medium" });
  }
  if (predictions.length === 0) {
    predictions.push({ title: "Overall Wellness Stable", detail: "Your current indicators appear stable. Continue regular monitoring.", trend: "stable" });
  }

  const scoreText = currentHealthScore ? `Your wellness score is ${currentHealthScore.score.toFixed(0)}/100 (${currentHealthScore.status}). ` : "";
  const comparisonText = previousDiagnosis ? ` Compared to your last analysis, your status is ${alertLevel === "HIGH" ? "requiring attention" : alertLevel === "MODERATE" ? "showing areas to monitor" : "stable"}.` : "";
  const healthSummary = `${scoreText}Based on your latest data, your wellness profile shows ${alertLevel === "HIGH" ? "some areas that need professional attention" : alertLevel === "MODERATE" ? "areas to improve" : "a positive trajectory"}.${comparisonText}`;
  const doctorNote = v ? `BP ${v.systolicBP ?? "N/A"}/${v.diastolicBP ?? "N/A"}, HR ${v.heartRate ?? "N/A"}, SpO2 ${v.spo2 ?? "N/A"}%, Glucose ${v.glucose ?? "N/A"} mg/dL, BMI ${v.bmi ?? "N/A"}. Alert: ${alertLevel}.` : "No vitals recorded.";

  return { healthSummary, predictions, habitImprovements, alertLevel, doctorNote };
}

export function generateSimulatedClinical(input: InsightInput): ClinicalOutput {
  const v = input.latestVitals;
  const differentialNotes: ClinicalOutput["differentialNotes"] = [];
  const clinicalFlags: ClinicalOutput["clinicalFlags"] = [];

  if (v) {
    if (v.systolicBP && v.systolicBP > 140) {
      differentialNotes.push({ consideration: "Stage 2 Hypertension (JNC8 / ACC/AHA 2017 criteria)", rationale: `Systolic BP of ${v.systolicBP} mmHg exceeds the 140 mmHg threshold. In conjunction with patient's risk segment, warrants pharmacotherapy evaluation.`, priority: "high" });
      clinicalFlags.push({ metric: "Systolic BP", value: `${v.systolicBP} mmHg`, interpretation: "Stage 2 Hypertension — exceeds JNC8 threshold (≥140 mmHg)", action: "Consider ABPM, pharmacotherapy evaluation (ACEi/ARB/CCB/thiazide per risk profile), dietary sodium restriction (<2.3 g/day)." });
    } else if (v.systolicBP && v.systolicBP > 130) {
      differentialNotes.push({ consideration: "Stage 1 Hypertension / Elevated BP (ACC/AHA 2017)", rationale: `Systolic BP of ${v.systolicBP} mmHg consistent with Stage 1 hypertension. Lifestyle modification indicated; pharmacotherapy may be considered based on ASCVD risk.`, priority: "moderate" });
    }
    if (v.heartRate && v.heartRate > 100) {
      differentialNotes.push({ consideration: "Sinus Tachycardia — rule out secondary causes", rationale: `HR ${v.heartRate} bpm at rest. DDx includes anxiety, anemia, thyrotoxicosis, infection, dehydration, or drug effect.`, priority: "moderate" });
      clinicalFlags.push({ metric: "Heart Rate", value: `${v.heartRate} bpm`, interpretation: "Resting tachycardia (>100 bpm)", action: "Rule out secondary causes. Consider TSH, CBC, metabolic panel. 12-lead ECG if persistent." });
    }
    if (v.spo2 && v.spo2 < 95) {
      differentialNotes.push({ consideration: "Hypoxemia — urgent evaluation warranted", rationale: `SpO2 ${v.spo2}% is below the 95% threshold. Warrants immediate clinical evaluation for respiratory compromise or cardiac etiology.`, priority: "high" });
      clinicalFlags.push({ metric: "SpO2", value: `${v.spo2}%`, interpretation: "Hypoxemia — below 95% threshold", action: "Urgent: ABG, CXR, pulse oximetry confirmation. Rule out PE, pneumonia, heart failure, COPD exacerbation." });
    }
    if (v.glucose && v.glucose > 126) {
      differentialNotes.push({ consideration: "Hyperglycemia / Possible Diabetes Mellitus (ADA criteria)", rationale: `Fasting glucose of ${v.glucose} mg/dL exceeds the ADA diagnostic threshold (≥126 mg/dL). Confirmatory testing indicated.`, priority: "high" });
      clinicalFlags.push({ metric: "Fasting Glucose", value: `${v.glucose} mg/dL`, interpretation: "Exceeds ADA T2DM diagnostic threshold (≥126 mg/dL)", action: "Order HbA1c, repeat FPG, OGTT if indicated. Evaluate for metabolic syndrome. Diabetes education referral." });
    }
    if (v.bmi && v.bmi >= 30) {
      differentialNotes.push({ consideration: `Class ${v.bmi >= 40 ? "III" : v.bmi >= 35 ? "II" : "I"} Obesity (WHO classification)`, rationale: `BMI ${v.bmi} meets criteria for obesity. Associated with increased cardiometabolic risk, OSA risk, and musculoskeletal burden.`, priority: "moderate" });
      clinicalFlags.push({ metric: "BMI", value: `${v.bmi} kg/m²`, interpretation: `WHO Obesity Class ${v.bmi >= 40 ? "III (≥40)" : v.bmi >= 35 ? "II (35–39.9)" : "I (30–34.9)"}`, action: "Screen for OSA (Epworth/STOP-BANG), lipid panel, fasting glucose, LFTs. Structured weight management program referral." });
    }
    if (v.respiratoryRate && (v.respiratoryRate > 20 || v.respiratoryRate < 12)) {
      clinicalFlags.push({ metric: "Respiratory Rate", value: `${v.respiratoryRate} breaths/min`, interpretation: v.respiratoryRate > 20 ? "Tachypnea (>20 breaths/min)" : "Bradypnea (<12 breaths/min)", action: "Correlate with SpO2, auscultation findings. Consider CXR if tachypnea is unexplained." });
    }
  }

  if (differentialNotes.length === 0) {
    differentialNotes.push({ consideration: "No acute clinical concerns identified from available data", rationale: "Vital signs within normal limits. Continued routine monitoring recommended.", priority: "low" });
  }

  const clinicalSummary = v
    ? `Patient presents with the following vital parameter profile: BP ${v.systolicBP ?? "NR"}/${v.diastolicBP ?? "NR"} mmHg, HR ${v.heartRate ?? "NR"} bpm, SpO2 ${v.spo2 ?? "NR"}%, RR ${v.respiratoryRate ?? "NR"}/min, Temp ${v.temperature ?? "NR"}°C, FBG ${v.glucose ?? "NR"} mg/dL, BMI ${v.bmi ?? "NR"} kg/m². ${clinicalFlags.length > 0 ? `${clinicalFlags.length} parameter(s) flagged for clinical attention. ` : "All parameters within reference ranges. "}${input.recentSymptoms && input.recentSymptoms.length > 0 ? `Patient reports ${input.recentSymptoms.length} symptom(s); high-intensity (≥7/10) count: ${input.recentSymptoms.filter(s => s.intensity >= 7).length}. ` : ""}Recommend physician review of flagged metrics and correlation with clinical history.`
    : "No vital signs data available. Baseline measurements recommended before clinical assessment.";

  return { clinicalSummary, differentialNotes, clinicalFlags };
}
