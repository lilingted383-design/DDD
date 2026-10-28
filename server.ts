import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Generate questions with Gemini 3.8 Flash
app.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      grade = 3,
      semester = 1,
      subject = 'math',
      publisher = 'kangxuan',
      unitTitle = '精選單元',
      difficulty = 'medium',
      count = 5,
      customTopic = '',
      questionTypes = ['choice', 'truefalse', 'fill'],
    } = req.body;

    const subjectMap: Record<string, string> = {
      chinese: '國語文',
      math: '數學科',
      science: '自然科學',
      social: '社會科',
      english: '英語文',
    };

    const publisherMap: Record<string, string> = {
      kangxuan: '康軒版',
      hanlin: '翰林版',
      nanyi: '南一版',
    };

    const diffMap: Record<string, string> = {
      easy: '基礎奠基 (觀念清晰、數字簡潔)',
      medium: '進階挑戰 (文字情境、需多一步運算或思考)',
      hard: '素養探索 (108課綱生活情境題、跨學科整合)',
      all: '循序漸進 (基礎與進階混合)',
    };

    const targetSubject = subjectMap[subject] || '數學科';
    const targetPublisher = publisherMap[publisher] || '康軒版';
    const targetDifficulty = diffMap[difficulty] || '進階挑戰';

    const systemPrompt = `你是一位專業且深受台灣國小師生喜愛的資深命題與輔導名師。
請根據台灣教育部「108課綱」以及指定出版社教科書之課群與單元指標，為台灣國小學童設計出嚴謹、富含啟發性、無錯別字的練習題目。
規範守則：
1. 一律使用台灣繁體中文 (正體字) 及台灣教育部標準數學/教育術語（例如：除數、被除數、商、餘數、公分、公尺、公克、公斤、十進位、直式運算；請勿使用任何中國大陸用語如「釐米」、「厘米」、「質量」等）。
2. 題目難易度與認知年齡須嚴格符合指定年級 (國小 ${grade} 年級)，語言親切平易近人。
3. 若是低年級 (1-2年級) 需簡潔具象；3-4年級注重基礎運算與文字理解；5-6年級注重素養脈絡與邏輯推論。
4. 選擇題必須提供恰好 4 個選項（選項需合理且具誘答力）；是非題選項固定為 ['正確 (O)', '錯誤 (X)']，其 correctAnswer 為 'T' 或 'F'；填空題答案請提供精準文字或數字答案。
5. 每一題必須包含：題目內容、詳細解析 (步驟清楚的觀念點撥)、核心知識點。`;

    const userPrompt = `請為以下條件生成 ${count} 題練習題：
- 年級：國小 ${grade} 年級 ${semester === 1 ? '上學期' : '下學期'}
- 科目：${targetSubject}
- 版本：${targetPublisher}
- 範圍/單元：${unitTitle}
- 難易度：${targetDifficulty}
- 題型限制：可包含 ${questionTypes.join('、')}
${customTopic ? `- 使用者自訂專屬主題或情境要求：${customTopic}` : ''}

請務必返回嚴格的 JSON 陣列，每題包含：
- id (字串，例如 ai-q-1)
- type ('choice' | 'truefalse' | 'fill' | 'reading')
- difficulty ('easy' | 'medium' | 'hard')
- content (題目敘述)
- options (若為 choice 或 truefalse，字串陣列，如果是 truefalse 必須為 ['正確 (O)', '錯誤 (X)'])
- correctAnswer (若 choice 請給數字 index 0~3；若 truefalse 請給字串 'T' 或 'F'；若 fill 請給簡潔標準字串答案)
- explanation (親切易懂的繁體中文詳解，步驟分明)
- knowledgePoint (對應的 108 課綱知識點)
- readingPassage (選填，若為 reading 題型時的短文閱讀材料)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              content: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              knowledgePoint: { type: Type.STRING },
              readingPassage: { type: Type.STRING },
            },
            required: ['id', 'type', 'difficulty', 'content', 'correctAnswer', 'explanation', 'knowledgePoint'],
          },
        },
      },
    });

    const text = response.text?.trim() || '[]';
    const rawQuestions = JSON.parse(text);

    // Normalize questions to match our TypeScript types
    const questions = rawQuestions.map((q: any, idx: number) => {
      let finalCorrectAnswer = q.correctAnswer;
      // If choice type and correctAnswer is numeric string like "0", parse it
      if (q.type === 'choice') {
        const parsed = parseInt(String(q.correctAnswer), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
          finalCorrectAnswer = parsed;
        } else {
          // If returned option letter or text
          const foundIdx = q.options?.findIndex((opt: string) => opt.includes(String(q.correctAnswer)));
          finalCorrectAnswer = foundIdx >= 0 ? foundIdx : 0;
        }
      }

      return {
        id: `ai-${Date.now()}-${idx + 1}`,
        grade: Number(grade),
        semester: Number(semester),
        subject,
        publisher,
        unitTitle,
        type: q.type || 'choice',
        difficulty: q.difficulty || difficulty || 'medium',
        content: q.content,
        options: q.options || (q.type === 'truefalse' ? ['正確 (O)', '錯誤 (X)'] : undefined),
        correctAnswer: finalCorrectAnswer,
        explanation: q.explanation,
        knowledgePoint: q.knowledgePoint || '108課綱核心知識點',
        readingPassage: q.readingPassage || undefined,
      };
    });

    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || '出題失敗，請稍後再試。',
    });
  }
});

// API: AI 小老師解說 (Explain Question)
app.post('/api/explain-question', async (req, res) => {
  try {
    const { question, userAnswer, isCorrect } = req.body;

    const prompt = `你是一位親切、有耐心且幽默的台灣國小名師「星星老師」。
以下是一位國小學童在練習這道題目時的狀況：
- 年級：${question.grade} 年級
- 科目：${question.subject}
- 版本：${question.publisher}
- 題目：${question.content}
${question.options ? `- 選項：\n${question.options.map((opt: string, i: number) => `  ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}` : ''}
- 正確答案：${question.correctAnswer}
- 學生的答案：${userAnswer !== undefined && userAnswer !== null ? userAnswer : '尚未作答'}
- 是否答對：${isCorrect ? '答對了！' : '答錯了或有疑惑'}
- 題目原本詳解：${question.explanation}

請用適合國小 ${question.grade} 年級小朋友能完全聽懂的語氣，以台灣繁體中文提供一份溫暖又清晰的解答引導：
1. 【🌟 觀念解讀】：用白話且生動的生活比喻說明這個題目核心觀念是什麼。
2. 【👣 一步一步做做看】：像在黑板上列式一樣，把思考順序拆解為 1、2、3 步驟。
3. 【⚠️ 小心陷阱！】：指出這題最容易讓同學粗心或誤解的地方。
4. 【💪 星星老師的加油小語】：給小朋友一句激勵自信的話。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error('Error explaining question:', error);
    res.status(500).json({
      success: false,
      error: error.message || '解題小老師暫時休息中，請稍後再試。',
    });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`小學星題庫系統已於 http://0.0.0.0:${PORT} 啟動`);
  });
}

startServer();
