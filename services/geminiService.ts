
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { 
    QuizQuestion, Subject, ClassLevel, MathsSolution, 
    SmartSummary, QuestionPaper, 
    GradedPaper, LabExperiment, LiteraryAnalysis,
    Analogy, RealWorldApplication, LearningPath, GameLevel,
    DebateScorecard, DebateTurn, VisualExplanationScene,
    CareerRoadmap, MindMapNode, LiveQuizQuestion
} from "../types";
import { deductToken, checkTokens, saveActivity } from "./userService";

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
    if (!hasTokens) throw new Error("ASCENSION_REQUIRED: Neural tokens depleted (0/100). Upgrade required for more missions.");
};

/**
 * LIVE QUIZ GENERATOR
 */
export const generateLiveQuizQuestions = async (topic: string, count: number = 5): Promise<LiveQuizQuestion[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: `Generate ${count} multiplayer quiz questions for the topic: "${topic}". 
        Requirements:
        - 4 options per question
        - Exactly one correct answer
        - High-quality educational explanation for the correct answer
        - STRICT JSON OUTPUT ONLY.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionText: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.NUMBER },
                        explanation: { type: Type.STRING }
                    },
                    required: ["questionText", "options", "correctOptionIndex", "explanation"]
                }
            }
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

/**
 * WEB CRAWLER: Guaranteed 101% Logic.
 * Uses gemini-flash-lite-latest for tool use.
 */
export const fetchChapterContent = async (level: ClassLevel, subject: Subject, chapter: string, details: string): Promise<string> => {
    await enforceToken();
    const ai = getAI();
    
    const prompt = `SEARCH AND RETRIEVE: I need the complete descriptive contents of the NCERT chapter "${chapter}" for ${level} ${subject}. ${details}. 
    MANDATORY PROTOCOL: You MUST use the googleSearch tool to find official textbook contents or highly accurate educational summaries. 
    OUTPUT: Return the FULL descriptive text of the chapter concepts, NOT a brief summary. Ensure accuracy for the Indian curriculum.`;

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: { 
            tools: [{ googleSearch: {} }],
            temperature: 0.1 // Precision focus
        }
    });

    await deductToken();
    return response.text || "Neural search node timed out. Please refine your query.";
};

export const solveMathsBrahmastra = async (problem: string, level: ClassLevel, imagePart?: any): Promise<MathsSolution> => {
    await enforceToken();
    const ai = getAI();
    const contents = imagePart 
        ? { parts: [imagePart, { text: `Grade Level: ${level}. Problem: ${problem}. Solve with precision. No $ signs. Output JSON.` }] }
        : { parts: [{ text: `Grade Level: ${level}. Problem: ${problem}. Solve with 101% precision. No $ signs. Output valid JSON only.` }] };

    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents,
        config: {
            systemInstruction: "You are StuBro AI Brahmastra. Guaranteed accuracy. No LaTeX ($). Output valid JSON.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                action: { type: Type.STRING },
                                result: { type: Type.STRING },
                                reason: { type: Type.STRING },
                            },
                            required: ["action", "result", "reason"],
                        },
                    },
                    finalAnswer: { type: Type.STRING },
                    recap: { type: Type.STRING },
                },
                required: ["concept", "formula", "steps", "finalAnswer", "recap"],
            }
        }
    });
    
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateSmartSummary = async (subject: Subject, classLevel: ClassLevel, sourceText: string): Promise<SmartSummary> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: `Subject: ${subject}. Level: ${classLevel}. Context: ${sourceText}`,
        config: { 
            systemInstruction: "Create a precision summary. NO DOLLAR SIGNS ($). Output strict JSON according to SmartSummary interface.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    coreConcepts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                definition: { type: Type.STRING },
                            },
                            required: ["term", "definition"],
                        },
                    },
                    visualAnalogy: {
                        type: Type.OBJECT,
                        properties: {
                            analogy: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                        },
                        required: ["analogy"],
                    },
                    examSpotlight: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    stuBroTip: { type: Type.STRING },
                },
                required: ["title", "coreConcepts", "visualAnalogy", "examSpotlight", "stuBroTip"],
            }
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateQuiz = async (subject: Subject, classLevel: ClassLevel, sourceText: string, num: number = 5): Promise<QuizQuestion[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: `Generate ${num} quiz questions from: ${sourceText}`,
        config: { 
            systemInstruction: "Output JSON with a 'questions' array. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    const data = JSON.parse(response.text || '{"questions":[]}');
    return data.questions || [];
};

export const fetchYouTubeTranscript = async (url: string): Promise<string> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Search and retrieve transcript/concepts for this video: ${url}.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    await deductToken();
    return response.text || "";
};

export const startMathDoubtChat = (solutionContext: MathsSolution): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `You are the DOUBT SOLVER. Solution Context: ${JSON.stringify(solutionContext)}. Never use $ signs or LaTeX delimiters.` }
    });
};

export const createGeneralChat = (context: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `You are an expert on the following document. Answer questions based on this context. Never use $ signs or LaTeX. Context: ${context}` }
    });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
    await enforceToken();
    const res = await chat.sendMessageStream({ message });
    await deductToken();
    return res;
};

export const generateMindMapFromText = async (text: string, level: ClassLevel): Promise<MindMapNode> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Generate mind map JSON for ${level}: ${text}`,
        config: { 
            systemInstruction: "Output a recursive MindMapNode JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateQuestionPaper = async (
    text: string,
    numQuestions: number,
    questionTypes: string,
    difficulty: string,
    totalMarks: number,
    subject: Subject | null
): Promise<QuestionPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Generate board paper for ${subject}, ${numQuestions} questions. Type: ${questionTypes}. Difficulty: ${difficulty}. Marks: ${totalMarks}. Context: ${text}`,
        config: { 
            systemInstruction: "Create a formal question paper. Output JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateVivaQuestions = async (topic: string, level: string, num: number): Promise<string[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Viva questions for ${topic}, grade ${level}. Return Array of strings.`,
        config: { 
            systemInstruction: "Output a JSON array of strings only.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateGameLevel = async (text: string): Promise<GameLevel> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Chapter Conquest JSON for: ${text}`,
        config: { 
            systemInstruction: "Create a 2D grid game level JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateLabExperiment = async (sub: Subject, topic: string, safetyLevel: string): Promise<LabExperiment> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Lab experiment for ${sub}: ${topic}. Safety: ${safetyLevel}`,
        config: { 
            systemInstruction: "Create a LabExperiment JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createHistoricalChatSession = (figure: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `You are ${figure}. Respond in character. No $ signs. No LaTeX.` }
    });
};

export const generateAnalogies = async (concept: string): Promise<Analogy[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Analogies for ${concept}`,
        config: { 
            systemInstruction: "Return a JSON array of Analogy objects.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const predictExamPaper = async (text: string, difficulty: string, totalMarks: number, subject: Subject | null): Promise<QuestionPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Predict ${difficulty} exam for ${subject}. Total Marks: ${totalMarks}. Context: ${text}`,
        config: { 
            systemInstruction: "Predict exam questions based on context. JSON output. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateSimulationExperiment = async (text: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `ThreeJS simulation design JSON for: ${text}`,
        config: { 
            systemInstruction: "Output valid JSON for simulation steps. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const gradeAnswerSheet = async (paper: string, images: any[]): Promise<GradedPaper> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [...images, { text: `Grade student sheet for: ${paper}` }] },
        config: { 
            systemInstruction: "Grade the answer sheet accurately. JSON output only. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const generateCareerDivination = async (formData: any): Promise<CareerRoadmap> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Career roadmap for: ${JSON.stringify(formData)}`,
        config: { 
            systemInstruction: "Return a CareerRoadmap JSON. No $ signs.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    vision: { type: Type.STRING },
                    financialMilestones: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    classByClassRoadmap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                grade: { type: Type.STRING },
                                focus: { type: Type.ARRAY, items: { type: Type.STRING } },
                                exams: { type: Type.ARRAY, items: { type: Type.STRING } },
                                coachingRecommendation: { type: Type.STRING }
                            },
                            required: ["grade", "focus", "exams", "coachingRecommendation"]
                        }
                    },
                    jobOccupations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                scope: { type: Type.STRING },
                                salaryRange: { type: Type.STRING }
                            },
                            required: ["title", "scope", "salaryRange"]
                        }
                    }
                },
                required: ["title", "vision", "financialMilestones", "classByClassRoadmap", "jobOccupations"]
            }
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const evaluateVivaAudioAnswer = async (questionText: string, audioPart: any) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [audioPart, { text: `Evaluate answer for: ${questionText}` }] },
        config: { 
            systemInstruction: "Evaluate audio answer. JSON output with transcription, feedback, and marksAwarded.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const evaluateVivaTextAnswer = async (questionText: string, answerText: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [{ text: `Evaluate text answer: "${answerText}" for: ${questionText}` }] },
        config: { 
            systemInstruction: "Evaluate text answer. JSON output with transcription (echo), feedback, and marksAwarded.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createLiveDoubtsSession = (topic: string, level: ClassLevel): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `You are an AI tutor for "${topic}" at ${level}. Clear doubts instantly. No $ signs.` }
    });
};

export const sendAudioForTranscriptionAndResponse = async (chat: Chat, audioPart: any) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [audioPart, { text: "Transcribe and answer my doubt." }] },
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    transcription: { type: Type.STRING },
                    response: { type: Type.STRING }
                },
                required: ["transcription", "response"]
            }
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const breakdownTextIntoTopics = async (text: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Breakdown text into topics for visuals: ${text}`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                }
            }
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateScenesForTopic = async (content: string, language: string, level: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Generate visual scene and narration in ${language} for: ${content}. Level: ${level}` }] },
    });
    let narration = "";
    let imageBytes = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageBytes = part.inlineData.data;
        else if (part.text) narration = part.text;
    }
    await deductToken();
    return [{ narration, imageBytes }];
};

export const generateFullChapterSummaryVideo = async (text: string, language: string, level: string) => {
    return generateScenesForTopic(text, language, level);
};

export const generateDebateTopics = async (text: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Debate topics from: ${text}`,
        config: { 
            systemInstruction: "Return a JSON array of strings.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const startDebateSession = (topic: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `You are debating the motion: "${topic}". Be critical and rigorous. No $ signs.` }
    });
};

export const sendDebateArgument = async (chat: Chat, argument: string) => {
    await enforceToken();
    const response = await chat.sendMessage({ message: argument });
    await deductToken();
    return response.text || "";
};

export const getDebateResponseToAudio = async (chat: Chat, audioPart: any) => {
    await enforceToken();
    const ai = getAI();
    const trans = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: { parts: [audioPart, { text: "Transcribe argument." }] }
    });
    const transcription = trans.text || "";
    const rebuttal = await sendDebateArgument(chat, transcription);
    return { transcription, rebuttal };
};

export const evaluateDebate = async (history: DebateTurn[]): Promise<DebateScorecard> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Evaluate debate history: ${JSON.stringify(history)}`,
        config: { 
            systemInstruction: "Output a DebateScorecard JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const analyzeLiteraryText = async (text: string): Promise<LiteraryAnalysis> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Analyze literary work: ${text}`,
        config: { 
            systemInstruction: "Output a LiteraryAnalysis JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};

export const createDilemmaChatSession = (topic: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-flash-lite-latest',
        config: { systemInstruction: `Present ethical dilemmas for: ${topic}. Challenging reasoning. No $ signs.` }
    });
};

export const exploreWhatIfHistory = async (scenario: string) => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Explore historical "What If": ${scenario}`,
    });
    await deductToken();
    return response.text || "";
};

export const findRealWorldApplications = async (concept: string): Promise<RealWorldApplication[]> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Real-world apps for: ${concept}`,
        config: { 
            systemInstruction: "Return a JSON array of RealWorldApplication objects.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "[]");
};

export const generateLearningPath = async (topic: string, subject: Subject, level: string, quizResults: QuizQuestion[]): Promise<LearningPath> => {
    await enforceToken();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Personalized path for ${topic} at ${level}. Quiz results: ${JSON.stringify(quizResults)}`,
        config: { 
            systemInstruction: "Output a LearningPath JSON. No $ signs.",
            responseMimeType: "application/json" 
        }
    });
    await deductToken();
    return JSON.parse(response.text || "{}");
};
