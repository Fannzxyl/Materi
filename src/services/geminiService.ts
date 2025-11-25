import { GoogleGenAI, Type } from "@google/genai";
import { LearningData, Lesson, ChatMessage, LessonIndexItem } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const getPrompts = (language: 'id' | 'en' | 'ja') => {
  const translations = {
    id: {
      initialPrompt: `
        Anda adalah 'Sensei AI', seorang guru ahli bahasa Jepang dengan kemampuan analisis yang luar biasa. Tugas Anda adalah menganalisis dokumen buku teks "Minna no Nihongo" dan mengubahnya menjadi format JSON yang sangat terstruktur dan mendidik dalam BAHASA INDONESIA.

        Lakukan DUA tugas berikut dengan cermat:
        1.  **Analisis Mendalam 5 Pelajaran Pertama**: Proses LIMA (5) pelajaran pertama. Untuk setiap pelajaran, lakukan analisis mendalam:
            - **Nomor Pelajaran & Judul**: Ekstrak dengan akurat.
            - **Ringkasan**: Buat ringkasan yang berfokus pada tujuan pembelajaran inti pelajaran tersebut.
            - **Kosakata**: Daftar semua kosakata baru.
            - **Tata Bahasa**: Untuk setiap pola, berikan penjelasan yang **jelas, ringkas, dan sertakan nuansa penggunaannya** seolah-olah Anda mengajar pemula. Jelaskan kapan harus menggunakannya dan berikan contoh yang praktis.
            - **Kuis**: Buat 5 pertanyaan kuis pilihan ganda yang **benar-benar menguji pemahaman** konsep inti pelajaran (kosakata dan tata bahasa), bukan hanya hafalan.
        2.  **Buat Daftar Isi (Indeks)**: Pindai SELURUH dokumen dan buat daftar lengkap semua pelajaran yang ada, HANYA berisi nomor pelajaran dan judulnya. Ini akan menjadi 'lessonIndex'.

        Pastikan output Anda HANYA berupa satu objek JSON yang valid dan mematuhi skema yang diberikan. Seluruh konten teks harus dalam Bahasa Indonesia.
      `,
      specificLessonPrompt: (lessonRequestString: string) => `
        Anda adalah 'Sensei AI', seorang guru ahli bahasa Jepang. Tugas Anda adalah menganalisis dokumen "Minna no Nihongo" dan memproses pelajaran spesifik yang diminta ke dalam format JSON dalam BAHASA INDONESIA.

        PENTING: Anda HANYA PERLU menemukan dan memproses pelajaran berikut:
        ${lessonRequestString}

        Untuk SETIAP pelajaran yang diminta, lakukan analisis mendalam:
        1.  **Identifikasi Nomor dan Judul Pelajaran**.
        2.  **Buat Ringkasan**: Tulis ringkasan yang berfokus pada tujuan pembelajaran inti pelajaran tersebut.
        3.  **Ekstrak Kosakata**: Daftar semua kata baru.
        4.  **Ekstrak Tata Bahasa**: Untuk setiap pola, berikan penjelasan yang **jelas, ringkas, dan sertakan nuansa penggunaannya** seolah-olah mengajar pemula.
        5.  **Buat Kuis Cerdas**: Buat 5 pertanyaan kuis pilihan ganda yang **menguji pemahaman konsep**, bukan sekadar hafalan.

        Pastikan output Anda HANYA berupa objek JSON yang valid dengan properti 'pelajaran' yang berisi array dari pelajaran yang telah diproses.
      `,
      textAnalysisPrompt: `
        Anda adalah 'Sensei AI', seorang guru ahli bahasa Jepang dengan kemampuan analisis yang luar biasa. Tugas Anda adalah menganalisis teks berikut, yang kemungkinan besar adalah transkrip video YouTube yang tidak sempurna, dan mengubahnya menjadi satu pelajaran terstruktur dalam format JSON dalam BAHASA INDONESIA.

        PENTING: Abaikan kata-kata pengisi percakapan (seperti 'um', 'ah', 'tahu kan'), kesalahan transkripsi kecil, dan fokuslah pada **inti materi pembelajaran** dalam teks.

        Tugas Anda:
        1.  **Analisis Topik & Buat Judul**: Pahami topik utama dari teks dan buat judul yang singkat, akurat, dan relevan (misalnya: "Memesan Makanan di Restoran" atau "Memperkenalkan Diri dalam Situasi Bisnis").
        2.  **Nomor Pelajaran**: Tetapkan nomor pelajaran sebagai 1.
        3.  **Buat Ringkasan Akurat**: Tulis ringkasan singkat (2-3 kalimat) yang merangkum poin-poin pembelajaran utama dari teks.
        4.  **Ekstrak Kosakata Relevan**: Identifikasi dan daftar HANYA kata-kata atau frasa kunci bahasa Jepang yang benar-benar diajarkan atau penting dalam konteks teks. Sertakan romaji dan artinya yang akurat. Jangan memasukkan kata-kata yang tidak relevan.
        5.  **Analisis Tata Bahasa**: Jika ada pola tata bahasa yang jelas dan penting yang diajarkan, jelaskan secara singkat seolah-olah mengajar pemula. Jika tidak ada yang menonjol atau sulit diidentifikasi, kosongkan array ini.
        6.  **Buat Kuis Kontekstual**: Buat 5 pertanyaan kuis pilihan ganda yang secara spesifik menguji pemahaman konten dan kosakata yang ada DI DALAM teks yang diberikan.

        Pastikan output Anda HANYA berupa satu objek JSON yang valid, sangat relevan dengan teks input, dan mematuhi skema yang diberikan.
      `,
      chatPrompt: (currentLesson: Lesson, activeTopic: string, historyString: string, newMessage: string) => `
        Anda adalah "Sensei AI", seorang guru bahasa Jepang yang cerdas, sabar, dan memberi semangat. Respons Anda HARUS dalam BAHASA INDONESIA.

        Konteks Saat Ini:
        - Pengguna sedang fokus pada **Pelajaran ${currentLesson.nomorPelajaran}: "${currentLesson.judul}"**.
        - Topik spesifik yang dilihat adalah: **"${activeTopic}"**.
        
        Riwayat percakapan:
        ${historyString}

        **Instruksi Penting:**
        1.  **Jadilah Guru Terbaik:** Ajari pengguna dengan analogi sederhana dan contoh yang relevan dengan topik **"${activeTopic}"**. Dorong mereka untuk bertanya lebih lanjut.
        2.  **Sangat Kontekstual:** Jaga agar jawaban tetap fokus pada konteks pelajaran dan topik saat ini.
        3.  **Tolak Pertanyaan di Luar Konteks:** Jika pertanyaan sama sekali tidak berhubungan dengan bahasa Jepang, tolak dengan sopan dan arahkan kembali ke materi pelajaran.
        4.  **Perintah Navigasi:** Jika pengguna meminta untuk pindah (misal: "lanjut ke pelajaran berikutnya"), Anda HARUS merespons HANYA dengan teks \`[LANJUTKAN]\`.
        5.  **Format Teks Biasa:** Respons Anda HARUS berupa teks biasa. JANGAN gunakan format Markdown (seperti **, *, \`\`, dll.).

        Pertanyaan baru dari pengguna: "${newMessage}"
      `
    },
    en: {
      initialPrompt: `
        You are 'Sensei AI', an expert Japanese teacher with outstanding analytical skills. Your task is to analyze the "Minna no Nihongo" textbook document and convert it into a highly structured and educational JSON format in ENGLISH.

        Perform the following TWO tasks meticulously:
        1.  **In-depth Analysis of First 5 Lessons**: Process the FIRST FIVE (5) lessons. For each lesson, perform a deep analysis:
            - **Lesson Number & Title**: Extract accurately.
            - **Summary**: Create a summary focusing on the core learning objectives of the lesson.
            - **Vocabulary**: List all new vocabulary.
            - **Grammar**: For each pattern, provide a **clear, concise explanation including its usage nuances**, as if you were teaching a beginner. Explain when to use it and provide practical examples.
            - **Quiz**: Create 5 multiple-choice quiz questions that **truly test the understanding** of the lesson's core concepts (vocabulary and grammar), not just rote memorization.
        2.  **Create Table of Contents (Index)**: Scan the ENTIRE document and create a complete list of all lessons, containing ONLY their lesson number and title. This will be 'lessonIndex'.

        Ensure your output is ONLY a single valid JSON object that adheres to the provided schema. All textual content must be in English.
      `,
      specificLessonPrompt: (lessonRequestString: string) => `
        You are 'Sensei AI', an expert Japanese teacher. Your task is to analyze the "Minna no Nihongo" document and process the specific requested lessons into JSON format in ENGLISH.

        IMPORTANT: You ONLY need to find and process the following lessons:
        ${lessonRequestString}

        For EACH requested lesson, perform an in-depth analysis:
        1.  **Identify Lesson Number and Title**.
        2.  **Create Summary**: Write a summary focusing on the core learning objectives.
        3.  **Extract Vocabulary**: List all new words.
        4.  **Extract Grammar**: For each pattern, provide a **clear, concise explanation including its usage nuances**, as if teaching a beginner.
        5.  **Create Smart Quiz**: Generate 5 multiple-choice questions that **test conceptual understanding**, not just memorization.

        Ensure your output is ONLY a valid JSON object with a 'pelajaran' property containing an array of the processed lessons.
      `,
      textAnalysisPrompt: `
        You are 'Sensei AI', an expert Japanese teacher with outstanding analytical skills. Your task is to analyze the following text, which is likely an imperfect YouTube video transcript, and transform it into a single, structured lesson in JSON format in ENGLISH.

        IMPORTANT: Ignore conversational fillers (like 'um', 'ah', 'you know'), minor transcription errors, and focus on the **core learning material** within the text.

        Your tasks:
        1.  **Analyze Topic & Create Title**: Understand the main topic of the text and create a short, accurate, and relevant title (e.g., "Ordering Food at a Restaurant" or "Self-introduction in a Business Context").
        2.  **Lesson Number**: Set the lesson number to 1.
        3.  **Create Accurate Summary**: Write a brief summary (2-3 sentences) that encapsulates the main learning points from the text.
        4.  **Extract Relevant Vocabulary**: Identify and list ONLY the key Japanese vocabulary words or phrases that are actually being taught or are central to the text's context. Include accurate romaji and meanings. Do not include irrelevant words.
        5.  **Analyze Grammar**: If any clear, important grammar patterns are being taught, briefly explain them as if teaching a beginner. If none stand out or are hard to identify, leave this array empty.
        6.  **Create Contextual Quiz**: Generate 5 multiple-choice quiz questions that specifically test the understanding of the content and vocabulary found WITHIN the provided text.

        Ensure your output is ONLY a single valid JSON object, highly relevant to the input text, and adheres to the provided schema.
      `,
      chatPrompt: (currentLesson: Lesson, activeTopic: string, historyString: string, newMessage: string) => `
        You are "Sensei AI," a smart, patient, and encouraging Japanese teacher. Your responses MUST be in ENGLISH.

        Current Context:
        - The user is focused on **Lesson ${currentLesson.nomorPelajaran}: "${currentLesson.judul}"**.
        - The specific topic being viewed is: **"${activeTopic}"**.
        
        Chat History:
        ${historyString}

        **Key Instructions:**
        1.  **Be the Best Teacher:** Teach the user with simple analogies and examples relevant to the **"${activeTopic}"**. Encourage them to ask more.
        2.  **Highly Contextual:** Keep answers focused on the current lesson and topic context.
        3.  **Decline Off-Topic Questions:** If the question is completely unrelated to Japanese, politely decline and steer them back to the lesson material.
        4.  **Navigation Command:** If the user asks to move on (e.g., "continue to next lesson"), you MUST respond ONLY with the text \`[LANJUTKAN]\`.
        5.  **Plain Text Format:** Your response MUST be in plain text. Do NOT use any Markdown formatting (like **, *, \`\`, etc.).

        New question from user: "${newMessage}"
      `
    },
    ja: {
      initialPrompt: `
        あなたは「先生AI」という、優れた分析能力を持つ専門の日本語教師です。あなたの仕事は、「みんなの日本語」の教科書ドキュメントを分析し、非常に構造化された教育的なJSON形式に日本語で変換することです。

        以下の2つのタスクを丁寧に行ってください：
        1.  **最初の5課の詳細な分析**：最初の5つの課を処理します。各課について、詳細な分析を行ってください：
            - **課番号とタイトル**：正確に抽出します。
            - **要約**：その課の主要な学習目標に焦点を当てた要約を作成します。
            - **語彙**：すべての新しい語彙をリストアップします。
            - **文法**：各文型について、初心者に教えるかのように、**明確で簡潔な説明と使用上のニュアンス**を加えてください。いつ使うべきかを説明し、実用的な例を挙げてください。
            - **クイズ**：単なる暗記ではなく、課の核心的な概念（語彙と文法）の**理解度を真に試す**5つの多肢選択式のクイズ問題を作成します。
        2.  **目次（索引）の作成**：文書全体をスキャンし、すべての課の完全なリストを作成します。リストには課番号とタイトルのみを含めてください。これが 'lessonIndex' となります。

        出力は、提供されたスキーマに準拠した単一の有効なJSONオブジェクトのみであることを確認してください。すべてのテキストコンテンツは日本語でなければなりません。
      `,
      specificLessonPrompt: (lessonRequestString: string) => `
        あなたは「先生AI」という、専門の日本語教師です。あなたの仕事は、「みんなの日本語」のドキュメントを分析し、要求された特定の課を日本語のJSON形式に処理することです。

        重要：以下の課のみを検索し、処理する必要があります：
        ${lessonRequestString}

        要求された各課について、詳細な分析を行ってください：
        1.  **課番号とタイトルの特定**。
        2.  **要約の作成**：主要な学習目標に焦点を当てた要約を記述します。
        3.  **語彙の抽出**：すべての新しい単語をリストアップします。
        4.  **文法の抽出**：各文型について、初心者に教えるかのように、**明確で簡潔な説明と使用上のニュアンス**を加えてください。
        5.  **スマートクイズの作成**：単なる暗記ではなく、**概念の理解度を試す**5つの多肢選択式のクイズ問題を生成します。

        出力は、処理された課の配列を含む'pelajaran'プロパティを持つ有効なJSONオブジェクトのみであることを確認してください。
      `,
      textAnalysisPrompt: `
        あなたは「先生AI」という、優れた分析能力を持つ専門の日本語教師です。あなたの仕事は、以下のテキスト（不完全なYouTubeの文字起こしである可能性が高い）を分析し、日本語で単一の構造化されたレッスンにJSON形式で変換することです。

        重要：会話のフィラー（「えーと」「あのー」など）、些細な文字起こしエラーは無視し、テキスト内の**核心的な学習内容**に焦点を当ててください。

        タスク：
        1.  **トピックの分析とタイトルの作成**：テキストの主要なトピックを理解し、短く、正確で、関連性のあるタイトルを作成してください（例：「レストランでの食事の注文」「ビジネス場面での自己紹介」）。
        2.  **課番号**：課番号を1に設定します。
        3.  **正確な要約の作成**：テキストから主要な学習ポイントを要約した短い要約（2〜3文）を記述します。
        4.  **関連語彙の抽出**：テキストの文脈で実際に教えられている、または中心となる日本のキーワードやフレーズのみを特定し、リストアップしてください。正確なローマ字と意味を含めてください。無関係な単語は含めないでください。
        5.  **文法分析**：明確で重要な文法パターンが教えられている場合は、初心者に教えるかのように簡潔に説明します。目立ったものがない、または特定が難しい場合は、この配列を空にしてください。
        6.  **文脈に沿ったクイズの作成**：提供されたテキスト内の内容と語彙の理解度を具体的にテストする5つの多肢選択式のクイズ問題を作成します。

        出力は、入力テキストに非常に関連性の高い、提供されたスキーマに準拠した単一の有効なJSONオブジェクトのみであることを確認してください。
      `,
      chatPrompt: (currentLesson: Lesson, activeTopic: string, historyString: string, newMessage: string) => `
        あなたは「先生AI」という、賢く、忍耐強く、励ましてくれる日本語教師です。あなたの返答は日本語でなければなりません。

        現在のコンテキスト：
        - ユーザーは **第${currentLesson.nomorPelajaran}課：「${currentLesson.judul}」** に焦点を当てています。
        - 表示されている特定のトピックは：**「${activeTopic}」** です。
        
        チャット履歴：
        ${historyString}

        **重要な指示：**
        1.  **最高の教師であれ**：**「${activeTopic}」** に関連する簡単な類推や例を使ってユーザーに教えてください。さらに質問するように促してください。
        2.  **文脈を重視**：回答は現在の課とトピックの文脈に焦点を当て続けてください。
        3.  **トピック外の質問は断る**：質問が日本語と全く関係ない場合は、丁寧に断り、教材に話を戻してください。
        4.  **ナビゲーションコマンド**：ユーザーが次に進むように頼んだ場合（例：「次の課に進んで」）、\`[LANJUTKAN]\`というテキストのみで応答しなければなりません。
        5.  **プレーンテキスト形式**：応答はプレーンテキストでなければなりません。マークダウン形式（**、*、\`\`など）は使用しないでください。

        ユーザーからの新しい質問：「${newMessage}」
      `
    }
  };
  return translations[language];
};

const lessonSchema = {
    type: Type.OBJECT,
    properties: {
        nomorPelajaran: { type: Type.INTEGER, description: "Lesson number." },
        judul: { type: Type.STRING, description: "The main title or theme of the lesson." },
        ringkasan: { type: Type.STRING, description: "A brief one-paragraph summary of the lesson's core learning objectives in the requested language." },
        kosakata: {
            type: Type.ARRAY,
            description: "List of vocabulary from the lesson.",
            items: {
                type: Type.OBJECT,
                properties: {
                    jepang: { type: Type.STRING, description: "The word in Japanese (including kanji if applicable)." },
                    romaji: { type: Type.STRING, description: "The romanized reading of the word." },
                    indonesia: { type: Type.STRING, description: "The meaning of the word in the requested language (Indonesian, English, or Japanese)." },
                },
                required: ["jepang", "romaji", "indonesia"],
            },
        },
        tataBahasa: {
            type: Type.ARRAY,
            description: "List of grammar points.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pola: { type: Type.STRING, description: "The grammar pattern sentence." },
                    penjelasan: { type: Type.STRING, description: "A clear, concise explanation of the grammar pattern's usage and nuance in the requested language, as if teaching a beginner." },
                    contoh: {
                        type: Type.ARRAY,
                        description: "Example sentences.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                jepang: { type: Type.STRING, description: "The example sentence in Japanese." },
                                indonesia: { type: Type.STRING, description: "The translation of the example sentence in the requested language." },
                            },
                            required: ["jepang", "indonesia"],
                        },
                    },
                },
                required: ["pola", "penjelasan", "contoh"],
            },
        },
        kuis: {
            type: Type.ARRAY,
            description: "Create 5 multiple-choice quiz questions that test the conceptual understanding of this lesson's vocabulary and grammar.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pertanyaan: { type: Type.STRING, description: "The quiz question in the requested language." },
                    pilihan: { type: Type.ARRAY, description: "Four answer choices.", items: { type: Type.STRING } },
                    jawabanBenar: { type: Type.STRING, description: "The correct answer from the choices." },
                },
                required: ["pertanyaan", "pilihan", "jawabanBenar"],
            },
        },
    },
    required: ["nomorPelajaran", "judul", "ringkasan", "kosakata", "tataBahasa", "kuis"],
};

const initialResponseSchema = {
    type: Type.OBJECT,
    properties: {
        pelajaran: {
            type: Type.ARRAY,
            description: "A list of the first FIVE (5) lessons extracted in detail from the book.",
            items: lessonSchema,
        },
        lessonIndex: {
            type: Type.ARRAY,
            description: "A complete table of contents from the ENTIRE book, containing only the lesson number and title.",
            items: {
                type: Type.OBJECT,
                properties: {
                    nomorPelajaran: { type: Type.INTEGER },
                    judul: { type: Type.STRING }
                },
                required: ["nomorPelajaran", "judul"]
            }
        }
    },
    required: ["pelajaran", "lessonIndex"],
};

const getGeminiAI = () => {
  // API key is now managed globally by the framework
  // We can assume process.env.API_KEY is available
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const generateInitialLearningData = async (file: File, language: 'id' | 'en' | 'ja'): Promise<LearningData> => {
  const ai = getGeminiAI();
  const imagePart = await fileToGenerativePart(file);
  const prompts = getPrompts(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart, { text: prompts.initialPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: initialResponseSchema,
      },
    });

    let jsonString = response.text.trim();
    const parsedData: LearningData = JSON.parse(jsonString);
    return parsedData;

  } catch (error) {
    console.error("Error generating initial learning data:", error);
    throw new Error("error_pdf_analysis_failed");
  }
};

export const generateSpecificLessons = async (file: File, lessonsToGenerate: LessonIndexItem[], language: 'id' | 'en' | 'ja'): Promise<Lesson[]> => {
  const ai = getGeminiAI();
  const imagePart = await fileToGenerativePart(file);
  const lessonRequestString = lessonsToGenerate.map(l => `- Lesson ${l.nomorPelajaran}: ${l.judul}`).join('\n');
  const prompts = getPrompts(language);
  const prompt = prompts.specificLessonPrompt(lessonRequestString);
    
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                pelajaran: {
                    type: Type.ARRAY,
                    items: lessonSchema,
                }
            },
            required: ["pelajaran"],
        }
      },
    });

    let jsonString = response.text.trim();
    const parsedData: { pelajaran: Lesson[] } = JSON.parse(jsonString);

    if (parsedData && Array.isArray(parsedData.pelajaran)) {
        return parsedData.pelajaran;
    }
    return [];

  } catch (error) {
    console.error("Error generating specific lessons:", error);
    throw new Error("error_load_more_failed");
  }
};

export const generateLessonFromText = async (text: string, language: 'id' | 'en' | 'ja'): Promise<Lesson> => {
  const ai = getGeminiAI();
  const prompts = getPrompts(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [{ text: prompts.textAnalysisPrompt }, { text }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
      },
    });

    let jsonString = response.text.trim();
    const parsedData: Lesson = JSON.parse(jsonString);
    return parsedData;

  } catch (error) {
    console.error("Error generating lesson from text:", error);
    throw new Error("error_text_analysis_failed");
  }
};

export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey.trim()) {
    return false;
  }
  try {
    const tempAi = new GoogleGenAI({ apiKey });
    // Use a lightweight model and a trivial prompt to check for authentication.
    await tempAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
    return true;
  } catch (e) {
    console.error("API Key validation failed:", e);
    return false;
  }
};

export const generateChatResponse = async (currentLesson: Lesson, chatHistory: ChatMessage[], newMessage: string, activeTopic: string, language: 'id' | 'en' | 'ja'): Promise<string> => {
  const ai = getGeminiAI();

  const historyString = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  const prompts = getPrompts(language);
  const prompt = prompts.chatPrompt(currentLesson, activeTopic, historyString, newMessage);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use a faster model for chat
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating chat response:", error);
    if (language === 'id') return "Maaf, saya sedang mengalami sedikit gangguan. Bisakah Anda mencoba lagi nanti?";
    if (language === 'ja') return "申し訳ありませんが、現在少し問題が発生しています。後でもう一度お試しいただけますか？";
    return "Sorry, I'm having a little trouble right now. Could you try again later?";
  }
};