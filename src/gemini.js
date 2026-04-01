import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are an AI Language Trainer.
Your role is to help users improve their communication skills through structured conversation.

STRICT RULES:
* Always act as a language coach
* Never behave like a casual chatbot
* Always provide structured feedback after every user message
* Always continue the conversation with a relevant question

---
STEP 1: Analyze user message
Identify grammar mistakes, awkward phrasing, and weak vocabulary.

STEP 2: Generate Structured Response format exactly like this:
1. Feedback:
[Clearly explain grammar mistakes, if any. Provide 1 to 2 sentences.]

2. Improved Sentence:
[Provide corrected and natural version of the user's sentence]

3. Enhancement:
[Suggest better vocabulary or phrasing, if possible]

4. Strengths:
[Identify 1-2 things the user is doing well. Keep it concise, meaningful and relevant.]

5. Areas to Improve:
[Identify 1-2 realistic weaknesses based on the user's message. Avoid generic statements.]

6. Communication Style Insight:
[One short sentence describing how the user communicates. Keep it natural, human-like, and useful.]

7. Suggested Upgrade:
[One practical, actionable tip for improving the next response.]

8. Next Question:
[Respond logically and ask a relevant follow-up question based on the chosen scenario to continue the conversation]

9. Level:
[Return ONLY ONE of: Basic, Intermediate, Advanced. Evaluate based on sentence brevity and accuracy.]
---
Adjust tone and language complexity based on the provided scenario context.`;

let genAI = null;

export const initGemini = (apiKey) => {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return true;
  } catch (error) {
    console.error("Error initializing Gemini:", error);
    return false;
  }
};

export const generateResponse = async (history, message, scenario) => {
  if (!genAI) {
    throw new Error("API not initialized. Please provide a valid key.");
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: SYSTEM_PROMPT
  });

  const contents = [...history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text || msg.raw || '' }], 
  }))];

  contents.push({
    role: 'user',
    parts: [{ text: `[Context Scenario: ${scenario}]\nUser Message: ${message}\n\nPlease analyze my message and respond using exactly the strict 9-part structure requested: 1. Feedback, 2. Improved Sentence, 3. Enhancement, 4. Strengths, 5. Areas to Improve, 6. Communication Style Insight, 7. Suggested Upgrade, 8. Next Question, 9. Level.` }]
  });
  
  try {
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();
    return parseAIResponse(responseText);
  } catch (error) {
    console.error("Error calling official Gemini SDK:", error);
    throw error;
  }
};

const parseAIResponse = (text) => {
  const sections = {
    feedback: "",
    improved: "",
    enhancement: "",
    strengths: "",
    areasToImprove: "",
    insight: "",
    upgrade: "",
    nextQuestion: "",
    level: ""
  };

  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    if (/^1\.?\s*\**Feedback:?\**/i.test(line) || (line.startsWith('1.') && line.toLowerCase().includes('feedback'))) currentSection = 'feedback';
    else if (/^2\.?\s*\**Improved Sentence:?\**/i.test(line) || line.startsWith('2.')) currentSection = 'improved';
    else if (/^3\.?\s*\**Enhancement(:?s)?\s*(\(optional\))?:?\**/i.test(line) || line.startsWith('3.')) currentSection = 'enhancement';
    else if (/^4\.?\s*\**Strengths:?\**/i.test(line) || line.startsWith('4.')) currentSection = 'strengths';
    else if (/^5\.?\s*\**Areas to Improve:?\**/i.test(line) || line.startsWith('5.')) currentSection = 'areasToImprove';
    else if (/^6\.?\s*\**Communication Style Insight:?\**/i.test(line) || line.startsWith('6.')) currentSection = 'insight';
    else if (/^7\.?\s*\**Suggested Upgrade:?\**/i.test(line) || line.startsWith('7.')) currentSection = 'upgrade';
    else if (/^8\.?\s*\**Next Question:?\**/i.test(line) || line.startsWith('8.')) currentSection = 'nextQuestion';
    else if (/^9\.?\s*\**Level:?\**/i.test(line) || line.startsWith('9.')) currentSection = 'level';
    
    if (currentSection) {
      if (line.match(/^[1-9]\./)) {
         const cleanLine = line.replace(/^[1-9]\.\s*\**[a-zA-Z\s]+(?:\s+[a-zA-Z\s]+)*:?\**\s*/, '');
         sections[currentSection] += (cleanLine + '\n');
      } else {
         sections[currentSection] += (line + '\n');
      }
    }
  }
  
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].replace(/^[1-9]\.\s*/, '').trim();
  });

  return {
    feedback: sections.feedback || 'No specific feedback.',
    improved: sections.improved || 'Your sentence was structurally good.',
    enhancement: sections.enhancement || 'No further enhancements needed.',
    strengths: sections.strengths || 'You communicate well!',
    areasToImprove: sections.areasToImprove || 'Keep practicing.',
    insight: sections.insight || 'You communicate well.',
    upgrade: sections.upgrade || 'Try adding more detail next time.',
    nextQuestion: sections.nextQuestion || 'Please continue.',
    level: sections.level || 'Not Detected',
    raw: text
  };
};
