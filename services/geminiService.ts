
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { 
    QuizQuestion, Subject, ClassLevel, MathsSolution, 
    SmartSummary, QuestionPaper, 
    GradedPaper, LabExperiment, LiteraryAnalysis,
    Analogy, RealWorldApplication, LearningPath,
    DebateScorecard, DebateTurn, VisualExplanationScene,
    CareerRoadmap, MindMapNode, LiveQuizQuestion,
    GameverseWorld
} from "../types";
import { deductToken, checkTokens } from "./userService";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
    if (!aiInstance) {
        const key = process.env.API_KEY;
        if (!key) throw new Error("CRITICAL_NODE_FAILURE: API_KEY_MISSING");
        aiInstance = new GoogleGenAI({ apiKey: key });
    }
    return aiInstance;
};

const enforceToken = async () => {
    const hasTokens = await checkTokens();
    if (!hasTokens) throw new Error("ASCENSION_REQUIRED: Neural tokens depleted.");
};

const SYSTEM_FORMATTING = "MANDATORY FORMATTING: NEVER use dollar signs ($) or any LaTeX. Use Rich Markdown: Use **Double Asterisks** for results. Use *Single Asterisks* for terms.";

/**
 * STUBRO GAMEVERSE ENGINE - Optimized for Flash Speed
 */
export const generateGameverseWorld = async (text: string): Promise<GameverseWorld> => {
    await enforceToken();
    const ai = getAI();
    
    // Check Neural Cache
    const cacheKey = `gameverse_cache_${btoa(text.substring(0, 50))}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Chapter Logic: "${text.substring(0, 4000)}". Create a 3D Gameverse spec. 5 Missions, 3 NPCs. Return JSON matching GameverseWorld schema. Be concise. Speed is critical.`,
        config: { 
            systemInstruction: "You are the Gameverse Architect. Generate fast, logical 3D mission structures.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    theme: { type: Type.STRING, enum: ['neon_city', 'quantum_lab', 'ancient_archive'] },
                    missions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['unlock', 'apply', 'repair', 'boss'] },
                                title: { type: Type.STRING },
                                objective: { type: Type.STRING },
                                concept: { type: Type.STRING },
                                challenge: {
                                    type: Type.OBJECT,
                                    properties: {
                                        prompt: { type: Type.STRING },
                                        correctAnswer: { type: Type.STRING },
                                        logicHint: { type: Type.STRING }
                                    },
                                    required: ["prompt", "correctAnswer", "logicHint"]
                                }
                            }
                        }
                    },
                    npcs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                role: { type: Type.STRING },
                                dialogue: { type: Type.ARRAY, items: { type: Type.STRING } },
                                position: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                            }
                        }
                    },
                    globalAbilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "title", "theme", "missions", "npcs", "globalAbilities"]
            }
        }
    });
    
    const world = JSON.parse(response.text || "{}");
    localStorage.setItem(cacheKey, JSON.stringify(world));
    await deductToken();
    return world;
};

// ... preservation of all other logic nodes ...
export const generateLiveQuizQuestions = async (topic: string, count: number = 5): Promise<LiveQuizQuestion[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${count} ultra-high-quality competitive quiz questions for: "${topic}".`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const fetchChapterContent = async (level: ClassLevel, subject: Subject, chapter: string, details: string): Promise<string> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Retrieve NCERT chapter "${chapter}" for ${level} ${subject}. ${details}.`,
        config: { systemInstruction: SYSTEM_FORMATTING, tools: [{ googleSearch: {} }] }
    });
    await deductToken();
    return response.text || "";
};

export const solveMathsBrahmastra = async (problem: string, level: ClassLevel, imagePart?: any): Promise<MathsSolution> => {
    await enforceToken();
    const ai = getAI();
    const contents = imagePart 
        ? { parts: [imagePart, { text: `Grade: ${level}. Solve: ${problem}.` }] }
        : { parts: [{ text: `Grade: ${level}. Solve: ${problem}.` }] };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateSmartSummary = async (subject: Subject, classLevel: ClassLevel, sourceText: string): Promise<SmartSummary> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize: ${sourceText}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateQuiz = async (subject: Subject, classLevel: ClassLevel, sourceText: string, num: number = 5): Promise<QuizQuestion[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Quiz from: ${sourceText}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const fetchYouTubeTranscript = async (url: string): Promise<string> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Concepts for: ${url}.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    await deductToken();
    return response.text || "";
};

export const startMathDoubtChat = (solutionContext: MathsSolution): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Math Tutor. Context: ${JSON.stringify(solutionContext)}. ${SYSTEM_FORMATTING}` }
    });
};

export const createGeneralChat = (context: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Expert analysis. ${SYSTEM_FORMATTING} Context: ${context}` }
    });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
    await enforceToken();
    const res = await chat.sendMessageStream({ message });
    return res;
};

export const generateMindMapFromText = async (text: string, level: ClassLevel): Promise<MindMapNode> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mind map for ${level}: ${text}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateQuestionPaper = async (text: string, num: number, types: string, diff: string, marks: number, sub: Subject | null): Promise<QuestionPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Paper for ${sub}. ${num} Qs. ${diff}. ${marks} marks. Context: ${text}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateVivaQuestions = async (topic: string, level: string, num: number): Promise<string[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Viva for ${topic}, grade ${level}.`,
        config: { responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateLabExperiment = async (sub: Subject, topic: string, safety: string): Promise<LabExperiment> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Lab for ${sub}: ${topic}.`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createHistoricalChatSession = (figure: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `You are ${figure}. ${SYSTEM_FORMATTING}` }
    });
};

export const generateAnalogies = async (concept: string): Promise<Analogy[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analogies for ${concept}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const predictExamPaper = async (text: string, diff: string, marks: number, sub: Subject | null): Promise<QuestionPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Predict ${diff} exam for ${sub}. Context: ${text}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateSimulationExperiment = async (text: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sim JSON for: ${text}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const gradeAnswerSheet = async (paper: string, images: any[]): Promise<GradedPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...images, { text: `Grade: ${paper}` }] },
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateCareerDivination = async (formData: any): Promise<CareerRoadmap> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Career for: ${JSON.stringify(formData)}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json"}
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const evaluateVivaAudioAnswer = async (q: string, audioPart: any) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [audioPart, { text: `Evaluate: ${q}` }] },
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const evaluateVivaTextAnswer = async (q: string, text: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Evaluate: "${text}" for: ${q}` }] },
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const analyzeLiteraryText = async (text: string): Promise<LiteraryAnalysis> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze: ${text}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const exploreWhatIfHistory = async (scenario: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `What if: ${scenario}`,
        config: { systemInstruction: SYSTEM_FORMATTING }
    });
    await deductToken();
    return response.text || "";
};

export const findRealWorldApplications = async (concept: string): Promise<RealWorldApplication[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Real-world: ${concept}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateLearningPath = async (topic: string, subject: Subject, level: string, quizResults: QuizQuestion[]): Promise<LearningPath> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Path for ${topic} at ${level}. Quiz: ${JSON.stringify(quizResults)}`,
        config: { systemInstruction: SYSTEM_FORMATTING, responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createLiveDoubtsSession = (topic: string, level: ClassLevel): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Doubt Solver for ${topic}. ${SYSTEM_FORMATTING}` }
    });
};

export const sendAudioForTranscriptionAndResponse = async (chat: Chat, audioPart: any) => {
    await enforceToken();
    const response = await chat.sendMessage({ 
        message: { parts: [audioPart, { text: "TRANSCRIPTION: <text>\nANSWER: <text>" }] } 
    });
    await deductToken();
    const text = response.text || "";
    const transcription = text.match(/TRANSCRIPTION: (.*?)(\n|$)/i)?.[1] || "Sync OK";
    const cleanResponse = text.replace(/TRANSCRIPTION: .*?(\n|$)/i, "").trim();
    return { transcription, response: cleanResponse };
};

export const breakdownTextIntoTopics = async (text: string): Promise<{ title: string, content: string }[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Topics from: ${text.substring(0, 6000)}`,
        config: { responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateScenesForTopic = async (content: string, lang: string, level: string): Promise<VisualExplanationScene[]> => {
    await enforceToken();
    const ai = getAI();
    const scriptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scenes for: ${content}`,
        config: { responseMimeType: "application/json" }
    });
    const script = JSON.parse(scriptResponse.text || "[]");
    const scenes: VisualExplanationScene[] = [];
    for (const item of script) {
        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `${level} style: ${item.imagePrompt}` }] }
        });
        let imageBytes = "";
        for (const part of imgResponse.candidates[0].content.parts) { if (part.inlineData) { imageBytes = part.inlineData.data; break; } }
        scenes.push({ narration: item.narration, imageBytes });
    }
    await deductToken();
    return scenes;
};

export const generateFullChapterSummaryVideo = async (text: string, lang: string, level: string): Promise<VisualExplanationScene[]> => {
    await enforceToken();
    const ai = getAI();
    const narrationRes = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Conclusion for: ${text.substring(0, 3000)}` });
    const imgResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: `Epic cinematic summary for ${level}` });
    let imageBytes = "";
    for (const part of imgResponse.candidates[0].content.parts) { if (part.inlineData) { imageBytes = part.inlineData.data; break; } }
    await deductToken();
    return [{ narration: narrationRes.text || "Sync complete.", imageBytes }];
};

export const generateDebateTopics = async (text: string): Promise<string[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Debates from: ${text.substring(0, 4000)}`,
        config: { responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const startDebateSession = (topic: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Debate: "${topic}". ${SYSTEM_FORMATTING}` }
    });
};

export const sendDebateArgument = async (chat: Chat, arg: string): Promise<string> => {
    await enforceToken();
    const response = await chat.sendMessage({ message: arg });
    await deductToken();
    return response.text || "";
};

export const getDebateResponseToAudio = async (chat: Chat, audioPart: any) => {
    await enforceToken();
    const response = await chat.sendMessage({ message: { parts: [audioPart, { text: "[TRANSCRIPTION: ...]" }] } });
    await deductToken();
    const text = response.text || "";
    const transcription = text.match(/\[TRANSCRIPTION: (.*?)\]/i)?.[1] || "Sync";
    const rebuttal = text.replace(/\[TRANSCRIPTION: .*?\]/i, "").trim();
    return { transcription, rebuttal };
};

export const evaluateDebate = async (history: DebateTurn[]): Promise<DebateScorecard> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate: ${JSON.stringify(history)}`,
        config: { responseMimeType: "application/json" }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createDilemmaChatSession = (topic: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Ethical Dilemma Simulator: ${topic}. ${SYSTEM_FORMATTING}` }
    });
};
