
export interface VocabularyItem {
  jepang: string;
  romaji: string;
  indonesia: string;
}

export interface GrammarPoint {
  pola: string;
  penjelasan: string;
  contoh: {
    jepang: string;
    indonesia: string;
  }[];
}

export interface QuizItem {
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: string;
}

export interface Lesson {
  nomorPelajaran: number;
  judul: string;
  ringkasan: string;
  kosakata: VocabularyItem[];
  tataBahasa: GrammarPoint[];
  kuis: QuizItem[];
}

export interface LessonIndexItem {
    nomorPelajaran: number;
    judul: string;
}

export interface LearningData {
  pelajaran: Lesson[];
  lessonIndex: LessonIndexItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}