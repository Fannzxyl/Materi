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

const lessonSchema = {
    type: Type.OBJECT,
    properties: {
        nomorPelajaran: { type: Type.INTEGER, description: "Nomor pelajaran." },
        judul: { type: Type.STRING, description: "Judul atau tema utama pelajaran." },
        ringkasan: { type: Type.STRING, description: "Ringkasan singkat satu paragraf tentang isi pelajaran ini dalam bahasa Indonesia." },
        kosakata: {
            type: Type.ARRAY,
            description: "Daftar kosakata dari pelajaran.",
            items: {
                type: Type.OBJECT,
                properties: {
                    jepang: { type: Type.STRING, description: "Kata dalam bahasa Jepang (termasuk kanji jika ada)." },
                    romaji: { type: Type.STRING, description: "Cara baca kata dalam romaji." },
                    indonesia: { type: Type.STRING, description: "Arti kata dalam bahasa Indonesia." },
                },
                required: ["jepang", "romaji", "indonesia"],
            },
        },
        tataBahasa: {
            type: Type.ARRAY,
            description: "Daftar poin tata bahasa.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pola: { type: Type.STRING, description: "Pola kalimat tata bahasa." },
                    penjelasan: { type: Type.STRING, description: "Penjelasan detail tentang pola tata bahasa dalam bahasa Indonesia." },
                    contoh: {
                        type: Type.ARRAY,
                        description: "Contoh kalimat penggunaan.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                jepang: { type: Type.STRING, description: "Contoh kalimat dalam bahasa Jepang." },
                                indonesia: { type: Type.STRING, description: "Terjemahan contoh kalimat dalam bahasa Indonesia." },
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
            description: "Buat 5 soal kuis pilihan ganda berdasarkan kosakata dan tata bahasa pelajaran ini untuk menguji pemahaman.",
            items: {
                type: Type.OBJECT,
                properties: {
                    pertanyaan: { type: Type.STRING, description: "Pertanyaan kuis dalam bahasa Indonesia." },
                    pilihan: { type: Type.ARRAY, description: "Empat pilihan jawaban.", items: { type: Type.STRING } },
                    jawabanBenar: { type: Type.STRING, description: "Jawaban yang benar dari pilihan yang ada." },
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
            description: "Daftar LIMA (5) pelajaran pertama yang diekstrak dari buku secara detail.",
            items: lessonSchema,
        },
        lessonIndex: {
            type: Type.ARRAY,
            description: "Daftar isi lengkap dari SELURUH buku, hanya berisi nomor pelajaran dan judul.",
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

export const generateInitialLearningData = async (file: File): Promise<LearningData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Anda adalah seorang guru bahasa Jepang yang sangat efisien. Tugas Anda adalah menganalisis dokumen PDF buku teks "Minna no Nihongo" dan mengubahnya menjadi format JSON terstruktur.

    Lakukan DUA tugas berikut:
    1.  **Proses Detail 5 Pelajaran Pertama**: Analisis secara mendalam LIMA (5) pelajaran pertama. Untuk setiap pelajaran, ekstrak nomor pelajaran, judul, ringkasan, daftar kosakata, penjelasan tata bahasa, dan buat 5 soal kuis.
    2.  **Buat Daftar Isi (Indeks)**: Pindai SELURUH dokumen dan buat daftar lengkap semua pelajaran yang ada, HANYA berisi nomor pelajaran dan judulnya. Ini akan menjadi 'lessonIndex'.

    Pastikan output Anda HANYA berupa satu objek JSON yang valid, berisi array 'pelajaran' (dengan 5 item detail) dan array 'lessonIndex' (dengan semua pelajaran).
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart, { text: prompt }] },
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
    throw new Error("Gagal menganalisis buku. Pastikan file PDF Anda adalah buku teks Minna no Nihongo yang jelas dan coba lagi.");
  }
};

export const generateSpecificLessons = async (file: File, lessonsToGenerate: LessonIndexItem[]): Promise<Lesson[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);
  const lessonRequestString = lessonsToGenerate.map(l => `- Pelajaran ${l.nomorPelajaran}: ${l.judul}`).join('\n');

  const prompt = `
    Anda adalah seorang guru bahasa Jepang yang sangat efisien. Tugas Anda adalah menganalisis dokumen PDF buku teks "Minna no Nihongo" dan mengubahnya menjadi format JSON terstruktur.

    PENTING: Anda HANYA PERLU menemukan dan memproses secara detail pelajaran-pelajaran spesifik berikut:
    ${lessonRequestString}

    Untuk SETIAP pelajaran yang diminta di atas, lakukan hal berikut:
    1.  **Identifikasi Nomor dan Judul Pelajaran**.
    2.  **Buat Ringkasan**: Tulis ringkasan singkat (satu paragraf) dalam Bahasa Indonesia.
    3.  **Ekstrak Kosakata**: Daftar semua kata baru (Jepang, romaji, Indonesia).
    4.  **Ekstrak Tata Bahasa**: Jelaskan setiap pola dan berikan contoh.
    5.  **Buat Kuis**: Buat 5 pertanyaan kuis pilihan ganda yang relevan.

    Pastikan output Anda HANYA berupa objek JSON yang valid dengan properti 'pelajaran' yang berisi array dari pelajaran yang telah diproses. Jika sebuah pelajaran tidak dapat ditemukan, lewati saja. Jangan sertakan komentar atau markdown.
    `;
    
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
    throw new Error("Gagal memuat pelajaran tambahan. Mungkin sudah mencapai akhir buku atau terjadi kesalahan.");
  }
};


export const generateChatResponse = async (learningData: LearningData, currentLesson: Lesson, chatHistory: ChatMessage[], newMessage: string, activeTopic: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const historyString = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const prompt = `
    Anda adalah "Sensei AI", seorang guru bahasa Jepang yang cerdas, ramah, dan sangat membantu.
    Anda memiliki pengetahuan tentang seluruh materi pelajaran yang tersedia.

    ---
    Konteks Saat Ini:
    - Pengguna sedang fokus pada **Pelajaran ${currentLesson.nomorPelajaran}: "${currentLesson.judul}"**.
    - Di dalam pelajaran ini, pengguna sedang melihat bagian: **"${activeTopic}"**.
    ---
    Materi Pelajaran Lengkap (untuk referensi jika perlu):
    ${JSON.stringify(learningData.pelajaran.map(p => ({nomor: p.nomorPelajaran, judul: p.judul})))}
    ---
    Riwayat percakapan:
    ${historyString}
    ---

    **Instruksi Penting Sebagai Guru:**

    1.  **Jawaban Super Kontekstual:** Jawab pertanyaan pengguna dengan SANGAT FOKUS pada bagian **"${activeTopic}"** dari Pelajaran ${currentLesson.nomorPelajaran}. Ini adalah prioritas utama Anda.
        *   Jika pengguna bertanya secara umum saat melihat Kosakata, berikan contoh kalimat menggunakan kosakata tersebut.
        *   Jika pengguna bertanya saat melihat Tata Bahasa, jelaskan kembali pola tata bahasa tersebut dengan cara yang berbeda atau lebih sederhana.
    2.  **Jadilah Guru, Bukan Ensiklopedia**: Jangan hanya memberi jawaban. Ajari pengguna. Berikan contoh yang jelas, analogi sederhana, dan jika perlu, ajari mereka langkah demi langkah cara mengerjakan sesuatu.
    3.  **Boleh Merujuk Materi Lain**: Jika relevan, Anda boleh membandingkan dengan materi dari pelajaran lain untuk memberikan pemahaman yang lebih dalam, tetapi selalu kembalikan fokus ke pelajaran saat ini.
    4.  **Tolak Pertanyaan di Luar Konteks:** Jika pertanyaan sama sekali tidak berhubungan dengan materi bahasa Jepang, tolak dengan sopan.
    5.  **Perintah Navigasi "Lanjut":** Jika pengguna meminta untuk pindah ke pelajaran berikutnya (misal: "lanjut", "next"), Anda **HARUS** merespons **HANYA** dengan teks \`[LANJUTKAN]\`.
    6.  **Gaya Bahasa:** Gunakan bahasa Indonesia yang ramah, jelas, dan memotivasi.

    Pertanyaan baru dari pengguna: "${newMessage}"
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Maaf, saya sedang mengalami sedikit gangguan. Bisakah Anda mencoba lagi nanti?";
  }
};