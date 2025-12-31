
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { SummarizationResult, ChatMessage } from "./types";

/**
 * دالة للتحقق من وجود وصحة مفتاح الـ API
 * يتم قراءة المفتاح من process.env.API_KEY الذي يتم ضبطه في Netlify/Vercel
 */
const getSafeApiKey = () => {
  // ملاحظة: في بيئات البناء الحديثة، يتم حقن process.env.API_KEY برمجياً
  const key = process.env.API_KEY;
  
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    return null;
  }
  return key.trim();
};

const cleanAndParseJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parsing Error:", text);
    throw new Error("فشل الذكاء الاصطناعي في تنسيق الإجابة بشكل صحيح. يرجى المحاولة مرة أخرى.");
  }
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const summarizeLesson = async (
  content: string | { data: string; mimeType: string },
  isImage: boolean = false
): Promise<SummarizationResult> => {
  const apiKey = getSafeApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `أنت خبير تعليمي عربي. حلل المحتوى واستخرج النتائج حصراً بصيغة JSON.
  الهيكل: { subject, summary, keyTerms: [{term, definition}], quiz: [{question, options, correctAnswer}], paragraphs: [{content, importance, importanceLabel, reason}], overallLevel }`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: isImage && typeof content !== "string" 
        ? { 
            parts: [
              { inlineData: { data: content.data, mimeType: content.mimeType } }, 
              { text: "حلل هذه الصورة التعليمية ولخصها واستخرج الاختبار والمصطلحات بصيغة JSON." }
            ] 
          }
        : { parts: [{ text: `لخص الدرس التالي بصيغة JSON: \n\n ${content}` }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    if (!response.text) throw new Error("استجابة فارغة.");
    return cleanAndParseJSON(response.text) as SummarizationResult;
  } catch (error: any) {
    console.error("Gemini Error Detail:", error);
    // إذا كان الخطأ متعلق بصحة المفتاح
    if (error.message?.includes("API key not valid") || error.status === "INVALID_ARGUMENT") {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};

export const chatWithLesson = async (lessonContent: string, question: string, history: ChatMessage[]): Promise<string> => {
  const apiKey = getSafeApiKey();
  if (!apiKey) return "خطأ: مفتاح API غير متوفر.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [{ text: `بناءً على الدرس: ${lessonContent}\nسؤال الطالب: ${question}` }] 
      },
    });
    return response.text || "عذراً، لا توجد إجابة.";
  } catch (e: any) {
    return `خطأ: ${e.message}`;
  }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const apiKey = getSafeApiKey();
  if (!apiKey) throw new Error("API Key Missing");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio failed");
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
};
