import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY;
};

export const isAiConfigured = () => {
  const key = getGeminiKey();
  return key && key !== 'your_gemini_api_key_here';
};

export const analyzeSheet = async (headers, sampleRows) => {
  if (!isAiConfigured()) {
    throw new Error("Gemini API key not configured. Please add it to .env.local or settings.");
  }

  const genAI = new GoogleGenerativeAI(getGeminiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a professional data engineering assistant for ForgeTrack.
    Your goal is to map columns from an uploaded spreadsheet to our internal attendance database schema.

    INTERNAL FIELDS (TARGETS):
    - "student_name": Full name of the student. (Matches: "name", "full name", "candidate", "student")
    - "usn": University Serial Number / Roll Number. (Matches: "usn", "roll no", "id", "reg no")
    - "email": Student email address.
    - "branch_code": Department/Branch code. (Matches: "branch", "dept", "course")
    - "attendance_col": ANY column containing attendance marks (Present/Absent/True/False/1/0). This includes columns like "Day 1 - Attendance" or dates like "15-04-2024".
    - "IGNORE": Use ONLY for clearly irrelevant columns like "SL NO", "Score", "Knowledge", "Skill", "Admission Number".

    INPUT DATA:
    - HEADERS: ${JSON.stringify(headers)}
    - SAMPLE DATA: ${JSON.stringify(sampleRows)}

    CRITICAL INSTRUCTIONS:
    1. DO NOT be shy about mapping. If a column looks like it contains student names or IDs, map it!
    2. Any column containing the word "Attendance" or a Date format MUST be "attendance_col".
    3. You MUST map at least one column to "student_name" and one to "usn".

    EXAMPLE:
    Input: ["SL NO", "name", "usn", "Day 1 - Attendance"]
    Output: {
      "mapping": {
        "SL NO": "IGNORE",
        "name": "student_name",
        "usn": "usn",
        "Day 1 - Attendance": "attendance_col"
      },
      ...
    }

    Return ONLY a JSON object:
    {
      "mapping": { "Source Header": "target_field" },
      "attendance_convention": "TRUE/FALSE" | "P/A" | "NUMERIC",
      "is_pivoted": true,
      "missing_dates": true | false,
      "detected_dates": ["YYYY-MM-DD", "Day 1", ...]
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log("AI Raw Response:", text);
  
  try {
    // Clean up markdown if AI returns it
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI returned invalid JSON:", text);
    throw new Error("Failed to parse AI response.");
  }
};

export const generateDates = async (startDate, schedule, sessionCount) => {
  if (!isAiConfigured()) return null;

  const genAI = new GoogleGenerativeAI(getGeminiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Generate a list of ${sessionCount} dates starting from ${startDate}.
    The classes happen on these days: ${schedule} (e.g., "Mon, Wed, Fri").
    Return ONLY a raw JSON array of ISO date strings (e.g. ["2024-05-01", "2024-05-03"]). 
    No markdown, no explanation.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log("Date Gen Raw Response:", text);
  
  try {
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse dates:", text);
    throw new Error("Failed to generate dates.");
  }
};
