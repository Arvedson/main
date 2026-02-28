export type HealthStatus = "GREEN" | "YELLOW" | "RED";
export type PatientSegment = "GENERAL" | "CHILD" | "ADULT" | "ELDERLY" | "CHRONIC_HYPERTENSION" | "CHRONIC_DIABETES" | "CHRONIC_OBESITY" | "PREGNANCY";

interface VitalsData {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  glucose?: number;
  bmi?: number;
}

interface PatientProfileData {
  gender?: string | null;
  birthDate?: Date | string | null;
}

export function calculateHealthScore(
  vitals: VitalsData, 
  segment: PatientSegment = "GENERAL",
  profile?: PatientProfileData
) {
  let score = 100;
  let status: HealthStatus = "GREEN";
  const issues: string[] = [];

  // Calculate age if birthDate is provided
  let age = 0;
  if (profile?.birthDate) {
    const bd = new Date(profile.birthDate);
    const ageDifMs = Date.now() - bd.getTime();
    const ageDate = new Date(ageDifMs);
    age = Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // 1. Blood Pressure Logic
  if (vitals.systolicBP) {
    if (vitals.systolicBP > 180 || vitals.systolicBP < 80) {
      score -= 40;
      issues.push("Critical Blood Pressure");
      status = "RED";
    } else if (vitals.systolicBP > 140 || vitals.systolicBP < 90) {
      score -= 15;
      issues.push("Abnormal Blood Pressure");
      if (status === "GREEN") status = "YELLOW";
    }
  }

  // 2. Heart Rate Logic
  if (vitals.heartRate) {
    if (vitals.heartRate > 120 || vitals.heartRate < 40) {
      score -= 20;
      issues.push("Irregular Heart Rate");
      if (status !== "RED") status = "RED";
    } else if (vitals.heartRate > 100 || vitals.heartRate < 50) {
      score -= 10;
      if (status === "GREEN") status = "YELLOW";
    }
  }

  // 3. SpO2 Logic
  if (vitals.spo2) {
    if (vitals.spo2 < 90) {
      score -= 30;
      issues.push("Low Oxygen Saturation");
      status = "RED";
    } else if (vitals.spo2 < 95) {
      score -= 10;
      if (status === "GREEN") status = "YELLOW";
    }
  }

  // 4. Glucose Logic (Metabolic)
  if (vitals.glucose) {
    if (vitals.glucose > 200 || vitals.glucose < 60) {
      score -= 25;
      issues.push("Abnormal Glucose Levels");
      if (status !== "RED") status = "RED";
    } else if (vitals.glucose > 140) {
      score -= 10;
      if (status === "GREEN") status = "YELLOW";
    }
  }

  // Segment Specific Adjustments
  if (segment === "ELDERLY" || age > 65) {
    // More lenient on heart rate, stricter on BP
    if (vitals.systolicBP && vitals.systolicBP > 150) {
      score -= 5;
    }
  }

  // Gender specific tweaks (example: women have slightly different cardiovascular baselines theoretically, or specific flags)
  if (profile?.gender === "FEMALE" && vitals.heartRate && vitals.heartRate > 100) {
    issues.push("Elevated Heart Rate (Female Baseline)");
  }

  return {
    score: Math.max(0, score),
    status,
    issues,
    timestamp: new Date()
  };
}

export function getAIAdvice(score: number, status: HealthStatus, segment: PatientSegment, profile?: PatientProfileData) {
  const advices = [];
  
  // Calculate age for AI context
  let ageContext = "";
  if (profile?.birthDate) {
    const bd = new Date(profile.birthDate);
    const ageDifMs = Date.now() - bd.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    ageContext = ` for a ${age}-year-old ${profile.gender?.toLowerCase() || 'patient'}`;
  }
  
  if (status === "RED") {
    advices.push({
      id: "1",
      type: "insight" as const,
      content: `Immediate medical attention required. Your recent vitals are outside safe ranges${ageContext}.`
    });
    advices.push({
      id: "2",
      type: "prediction" as const,
      content: "High risk of adverse event if current trends continue.",
      trend: "up" as const
    });
    advices.push({
      id: "3",
      type: "prevention" as const,
      content: "Consult your doctor immediately. Do not attempt self-medication."
    });
  } else if (status === "YELLOW") {
    advices.push({
      id: "1",
      type: "insight" as const,
      content: `Your vitals show minor anomalies${ageContext}. Monitor closely over the next 24 hours.`
    });
    advices.push({
      id: "2",
      type: "prediction" as const,
      content: "Potential for escalation if triggers (stress, diet) are not managed.",
      trend: "stable" as const
    });
    advices.push({
      id: "3",
      type: "prevention" as const,
      content: "Maintain hydration and rest. Avoid high sodium intake."
    });
  } else {
    advices.push({
      id: "1",
      type: "insight" as const,
      content: `Your status is optimal${ageContext}. Continue your current health regimen.`
    });
    advices.push({
      id: "2",
      type: "prediction" as const,
      content: "Sustained stability expected with consistent maintenance.",
      trend: "stable" as const
    });
    advices.push({
      id: "3",
      type: "prevention" as const,
      content: "Regular exercise and balanced nutrition will help maintain this score."
    });
  }

  return advices;
}
