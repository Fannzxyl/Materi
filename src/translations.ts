type Translations = {
  [key: string]: string;
};

const translations: { [lang: string]: Translations } = {
  id: {
    // FileUpload
    'fileUpload_subtitle': 'Ubah PDF & DOCX "Minna no Nihongo" Anda menjadi pelajaran interaktif!',
    'fileUpload_select': 'Pilih file',
    'fileUpload_orDrag': 'atau jatuhkan di sini',
    'fileUpload_supportedFormats': 'File PDF & DOCX didukung',
    'fileUpload_disclaimer': 'Aplikasi ini ditenagai oleh AI. Harap verifikasi informasi penting.',
    'fileUpload_apiKeyNeeded_1': 'Harap',
    'fileUpload_apiKeyNeeded_2': 'masukkan Kunci API Anda',
    'fileUpload_apiKeyNeeded_3': 'untuk memulai.',
    'fileUpload_tab_pdf': 'Belajar dari Dokumen',
    'fileUpload_tab_text': 'Belajar dari Teks',
    'fileUpload_text_placeholder': 'Tempelkan transkrip YouTube atau teks lain di sini untuk diubah menjadi pelajaran...',
    'fileUpload_text_button': 'Buat Pelajaran',

    // LoadingSpinner
    'loading_spinner_processing': 'Menganalisis materi Anda...',
    'loading_spinner_subtitle': 'Harap tunggu, AI sedang mempelajari materi untuk Anda. Ini bisa memakan waktu beberapa menit.',
    
    // Errors
    'error_no_api_key': 'Kunci API diperlukan untuk melanjutkan.',
    'error_unknown': 'Terjadi kesalahan yang tidak diketahui.',
    'error_pdf_analysis_failed': 'Gagal menganalisis dokumen. Pastikan dokumen Anda adalah buku teks Minna no Nihongo yang jelas dan coba lagi.',
    'error_text_analysis_failed': 'Gagal membuat pelajaran dari teks. Harap periksa teksnya dan coba lagi.',
    'error_load_more_failed': 'Gagal memuat pelajaran tambahan.',
    'error_oops': 'Oops! Terjadi Kesalahan',
    'error_try_again': 'Coba Lagi',
    'error_label': 'Kesalahan',

    // LessonView Sidebar
    'sidebar_search_placeholder': 'Cari materi...',
    'sidebar_lessons_title': 'Pelajaran',
    'sidebar_filter_placeholder': 'Filter pelajaran...',
    'sidebar_load_more': 'Muat Pelajaran Selanjutnya',
    'sidebar_end_of_book': 'Anda telah mencapai akhir buku.',
    'sidebar_start_over_prompt_1': 'Untuk memuat lebih banyak,',
    'sidebar_start_over_prompt_2': 'mulai lagi',
    'sidebar_bookmarks': 'Bookmark Saya',
    'sidebar_settings': 'Pengaturan',
    'sidebar_start_over': 'Mulai Ulang',
    'loading': 'Memuat',

    // LessonView Main Content
    'lesson': 'Pelajaran',
    'topic_Ringkasan': 'Ringkasan',
    'topic_Kosakata': 'Kosakata',
    'topic_Tata Bahasa': 'Tata Bahasa',
    'topic_Kuis': 'Kuis',
    'vocab_table_col1': 'Jepang',
    'vocab_table_col2': 'Romaji',
    'vocab_table_col3': 'Indonesia',
    'grammar_examples_title': 'Contoh',
    'previous': 'Sebelumnya',
    'next': 'Berikutnya',

    // Bookmarks View
    'bookmarks_title': 'Bookmark Saya',
    'bookmarks_subtitle': 'Materi penting yang Anda simpan untuk dipelajari kembali.',
    'bookmarks_empty_title': 'Tidak Ada Bookmark',
    'bookmarks_empty_subtitle': 'Tandai kosakata atau tata bahasa yang penting untuk dilihat lagi di sini.',
    'bookmarks_vocab_title': 'Kosakata Ditandai',
    'bookmarks_grammar_title': 'Tata Bahasa Ditandai',
    'bookmarks_start_practice': 'Mulai Latihan',
    'bookmarks_practice_min_warning': 'Butuh minimal 4 kosakata untuk memulai latihan.',

    // Practice Mode
    'practice_title': 'Latihan Kosakata',
    'practice_subtitle': 'Uji pemahaman kosakata yang telah Anda tandai.',
    'practice_card_count': 'Kartu {{current}} dari {{total}}',
    'practice_question_type_jepang-to-indonesia': 'Apa arti dari kata ini?',
    'practice_question_type_indonesia-to-jepang': 'Manakah kata Jepang yang benar?',
    'practice_question_type_jepang-to-romaji': 'Bagaimana cara baca (romaji) kata ini?',
    'practice_done_title': 'Latihan Selesai!',
    'practice_done_score': 'Skor Anda: {{score}} dari {{total}} benar',
    'practice_retry': 'Ulangi Latihan',
    'practice_back_to_bookmarks': 'Kembali ke Bookmark',
    
    // Quiz
    'quiz_title': 'Uji Pengetahuan Anda!',
    'quiz_submit': 'Cek Jawaban',
    'quiz_results_title': 'Hasil Kuis',
    'quiz_results_score': 'Skor Anda: {{score}} dari {{total}} benar',
    'quiz_results_your_answer': 'Jawaban Anda',
    'quiz_results_correct': '(Benar)',
    'quiz_results_incorrect': '(Salah)',
    'quiz_results_correct_answer': 'Jawaban yang benar',
    'quiz_results_help': 'Perlu bantuan?',
    'topic_Kosakata_short': 'Ulas Kosakata',
    'topic_Tata Bahasa_short': 'Ulas Tata Bahasa',
    'quiz_retry': 'Ulangi Kuis',
    
    // Search
    'search_results_title': 'Hasil Pencarian',
    'search_results_count': 'Ditemukan {{count}} hasil untuk "{{query}}"',
    'search_no_results_title': 'Tidak Ada Hasil',
    'search_no_results_subtitle': 'Coba gunakan kata kunci yang berbeda.',

    // AI Chat
    'chat_initial_greeting': 'Halo! Saya Sensei AI. Ada yang bisa saya bantu dengan Pelajaran {{lessonNumber}}: {{lessonTitle}}?',
    'chat_placeholder': 'Tanya sesuatu...',
    'chat_loading_message': 'Sensei AI sedang berpikir...',
    'chat_open_button_aria': 'Buka Asisten AI',
    'chat_navigation_success': 'Baik, mari kita lanjut ke pelajaran berikutnya!',
    'chat_navigation_last_lesson': 'Ini adalah pelajaran terakhir. Tidak ada pelajaran selanjutnya.',
    
    // Modals (API Key & Settings)
    'save': 'Simpan',
    'save_and_close': 'Simpan & Tutup',
    'verifying': 'Memverifikasi...',
    'apiKeyModal_title': 'Membutuhkan Kunci API Google AI',
    'apiKeyModal_subtitle': 'Untuk memulai, silakan masukkan Kunci API Google AI Anda. Kunci Anda akan disimpan dengan aman di browser Anda.',
    'apiKeyModal_input_label': 'Kunci API Google AI',
    'apiKeyModal_error_empty': 'Kunci API tidak boleh kosong.',
    'apiKeyModal_error_invalid': 'Kunci API tidak valid. Harap periksa dan coba lagi.',
    'apiKeyModal_info_1': 'Anda bisa mendapatkan kunci API gratis dari',
    'apiKeyModal_info_2': 'Google AI Studio',
    'apiKeyModal_info_3': 'Kunci Anda tidak pernah dibagikan.',
    'settingsModal_title': 'Pengaturan',
    'settingsModal_language_label': 'Bahasa',
    'settingsModal_apiKey_label': 'Kunci API Google AI',
  },
  en: {
    // FileUpload
    'fileUpload_subtitle': 'Turn your "Minna no Nihongo" PDF & DOCX into interactive lessons!',
    'fileUpload_select': 'Choose a file',
    'fileUpload_orDrag': 'or drop it here',
    'fileUpload_supportedFormats': 'PDF & DOCX files are supported',
    'fileUpload_disclaimer': 'This app is powered by AI. Please verify important information.',
    'fileUpload_apiKeyNeeded_1': 'Please',
    'fileUpload_apiKeyNeeded_2': 'enter your API Key',
    'fileUpload_apiKeyNeeded_3': 'to get started.',
    'fileUpload_tab_pdf': 'Learn from Document',
    'fileUpload_tab_text': 'Learn from Text',
    'fileUpload_text_placeholder': 'Paste a YouTube transcript or other text here to turn it into a lesson...',
    'fileUpload_text_button': 'Create Lesson',

    // LoadingSpinner
    'loading_spinner_processing': 'Analyzing your materials...',
    'loading_spinner_subtitle': 'Please wait, the AI is studying the material for you. This may take a few minutes.',
    
    // Errors
    'error_no_api_key': 'API Key is required to proceed.',
    'error_unknown': 'An unknown error occurred.',
    'error_pdf_analysis_failed': 'Failed to analyze the document. Ensure your document is a clear Minna no Nihongo textbook and try again.',
    'error_text_analysis_failed': 'Failed to create a lesson from the text. Please check the text and try again.',
    'error_load_more_failed': 'Failed to load additional lessons.',
    'error_oops': 'Oops! An Error Occurred',
    'error_try_again': 'Try Again',
    'error_label': 'Error',

    // LessonView Sidebar
    'sidebar_search_placeholder': 'Search materials...',
    'sidebar_lessons_title': 'Lessons',
    'sidebar_filter_placeholder': 'Filter lessons...',
    'sidebar_load_more': 'Load Next Lessons',
    'sidebar_end_of_book': "You've reached the end of the book.",
    'sidebar_start_over_prompt_1': 'To load more,',
    'sidebar_start_over_prompt_2': 'start over',
    'sidebar_bookmarks': 'My Bookmarks',
    'sidebar_settings': 'Settings',
    'sidebar_start_over': 'Start Over',
    'loading': 'Loading',

    // LessonView Main Content
    'lesson': 'Lesson',
    'topic_Ringkasan': 'Summary',
    'topic_Kosakata': 'Vocabulary',
    'topic_Tata Bahasa': 'Grammar',
    'topic_Kuis': 'Quiz',
    'vocab_table_col1': 'Japanese',
    'vocab_table_col2': 'Romaji',
    'vocab_table_col3': 'English',
    'grammar_examples_title': 'Examples',
    'previous': 'Previous',
    'next': 'Next',

    // Bookmarks View
    'bookmarks_title': 'My Bookmarks',
    'bookmarks_subtitle': 'Important materials you saved to review.',
    'bookmarks_empty_title': 'No Bookmarks Yet',
    'bookmarks_empty_subtitle': 'Bookmark important vocabulary or grammar to see them here.',
    'bookmarks_vocab_title': 'Bookmarked Vocabulary',
    'bookmarks_grammar_title': 'Bookmarked Grammar',
    'bookmarks_start_practice': 'Start Practice',
    'bookmarks_practice_min_warning': 'At least 4 vocabularies are needed to start practice.',
    
    // Practice Mode
    'practice_title': 'Vocabulary Practice',
    'practice_subtitle': 'Test your knowledge of bookmarked vocabulary.',
    'practice_card_count': 'Card {{current}} of {{total}}',
    'practice_question_type_jepang-to-indonesia': 'What is the meaning of this word?',
    'practice_question_type_indonesia-to-jepang': 'Which is the correct Japanese word?',
    'practice_question_type_jepang-to-romaji': 'What is the romaji reading for this word?',
    'practice_done_title': 'Practice Complete!',
    'practice_done_score': 'Your score: {{score}} out of {{total}} correct',
    'practice_retry': 'Retry Practice',
    'practice_back_to_bookmarks': 'Back to Bookmarks',

    // Quiz
    'quiz_title': 'Test Your Knowledge!',
    'quiz_submit': 'Check Answers',
    'quiz_results_title': 'Quiz Results',
    'quiz_results_score': 'Your score: {{score}} out of {{total}} correct',
    'quiz_results_your_answer': 'Your answer',
    'quiz_results_correct': '(Correct)',
    'quiz_results_incorrect': '(Incorrect)',
    'quiz_results_correct_answer': 'Correct answer',
    'quiz_results_help': 'Need help?',
    'topic_Kosakata_short': 'Review Vocab',
    'topic_Tata Bahasa_short': 'Review Grammar',
    'quiz_retry': 'Retry Quiz',

    // Search
    'search_results_title': 'Search Results',
    'search_results_count': 'Found {{count}} results for "{{query}}"',
    'search_no_results_title': 'No Results Found',
    'search_no_results_subtitle': 'Try using different keywords.',

    // AI Chat
    'chat_initial_greeting': 'Hello! I am Sensei AI. How can I help you with Lesson {{lessonNumber}}: {{lessonTitle}}?',
    'chat_placeholder': 'Ask something...',
    'chat_loading_message': 'Sensei AI is thinking...',
    'chat_open_button_aria': 'Open AI Assistant',
    'chat_navigation_success': "Alright, let's move on to the next lesson!",
    'chat_navigation_last_lesson': 'This is the last lesson. There are no more lessons after this.',

    // Modals (API Key & Settings)
    'save': 'Save',
    'save_and_close': 'Save & Close',
    'verifying': 'Verifying...',
    'apiKeyModal_title': 'Google AI API Key Required',
    'apiKeyModal_subtitle': 'To get started, please enter your Google AI API Key. Your key will be securely stored in your browser.',
    'apiKeyModal_input_label': 'Google AI API Key',
    'apiKeyModal_error_empty': 'API Key cannot be empty.',
    'apiKeyModal_error_invalid': 'The API Key is invalid. Please check it and try again.',
    'apiKeyModal_info_1': 'You can get a free API key from',
    'apiKeyModal_info_2': 'Google AI Studio',
    'apiKeyModal_info_3': 'Your key is never shared.',
    'settingsModal_title': 'Settings',
    'settingsModal_language_label': 'Language',
    'settingsModal_apiKey_label': 'Google AI API Key',
  },
  ja: {
    // FileUpload
    'fileUpload_subtitle': '「みんなの日本語」のPDFやDOCXをインタラクティブなレッスンに！',
    'fileUpload_select': 'ファイルを選択',
    'fileUpload_orDrag': 'またはここにドラッグ＆ドロップ',
    'fileUpload_supportedFormats': 'PDFとDOCXファイルに対応しています',
    'fileUpload_disclaimer': 'このアプリはAIを使用しています。重要な情報はご確認ください。',
    'fileUpload_apiKeyNeeded_1': '開始するには',
    'fileUpload_apiKeyNeeded_2': 'APIキーを入力してください',
    'fileUpload_apiKeyNeeded_3': '。',
    'fileUpload_tab_pdf': 'ドキュメントから学ぶ',
    'fileUpload_tab_text': 'テキストから学ぶ',
    'fileUpload_text_placeholder': 'ここにYouTubeの文字起こしや他のテキストを貼り付けて、レッスンに変換します...',
    'fileUpload_text_button': 'レッスンを作成',

    // LoadingSpinner
    'loading_spinner_processing': '教材を分析中...',
    'loading_spinner_subtitle': 'AIが教材を学習しています。数分かかる場合があります。',

    // Errors
    'error_no_api_key': '続行するにはAPIキーが必要です。',
    'error_unknown': '不明なエラーが発生しました。',
    'error_pdf_analysis_failed': 'ドキュメントを分析できませんでした。ドキュメントが明確な「みんなの日本語」の教科書であることを確認して、もう一度お試しください。',
    'error_text_analysis_failed': 'テキストからレッスンを作成できませんでした。テキストを確認して、もう一度お試しください。',
    'error_load_more_failed': '追加のレッスンを読み込めませんでした。',
    'error_oops': '問題が発生しました',
    'error_try_again': '再試行',
    'error_label': 'エラー',

    // LessonView Sidebar
    'sidebar_search_placeholder': '教材を検索...',
    'sidebar_lessons_title': '課',
    'sidebar_filter_placeholder': '課をフィルター...',
    'sidebar_load_more': '次の課を読み込む',
    'sidebar_end_of_book': 'これが最後の課です。',
    'sidebar_start_over_prompt_1': 'さらに読み込むには、',
    'sidebar_start_over_prompt_2': '最初からやり直してください',
    'sidebar_bookmarks': '私のブックマーク',
    'sidebar_settings': '設定',
    'sidebar_start_over': 'やり直す',
    'loading': '読み込み中',

    // LessonView Main Content
    'lesson': '第',
    'topic_Ringkasan': '概要',
    'topic_Kosakata': '語彙',
    'topic_Tata Bahasa': '文法',
    'topic_Kuis': 'クイズ',
    'vocab_table_col1': '日本語',
    'vocab_table_col2': 'ローマ字',
    'vocab_table_col3': '意味',
    'grammar_examples_title': '例文',
    'previous': '前へ',
    'next': '次へ',

    // Bookmarks View
    'bookmarks_title': '私のブックマーク',
    'bookmarks_subtitle': '復習のために保存した重要な教材。',
    'bookmarks_empty_title': 'ブックマークがありません',
    'bookmarks_empty_subtitle': '重要な語彙や文法をブックマークして、ここで確認しましょう。',
    'bookmarks_vocab_title': 'ブックマークした語彙',
    'bookmarks_grammar_title': 'ブックマークした文法',
    'bookmarks_start_practice': '練習を始める',
    'bookmarks_practice_min_warning': '練習を開始するには、少なくとも4つの語彙が必要です。',

    // Practice Mode
    'practice_title': '語彙の練習',
    'practice_subtitle': 'ブックマークした語彙の知識をテストします。',
    'practice_card_count': 'カード {{current}}/{{total}}',
    'practice_question_type_jepang-to-indonesia': 'この言葉の意味は何ですか？',
    'practice_question_type_indonesia-to-jepang': '正しい日本語はどれですか？',
    'practice_question_type_jepang-to-romaji': 'この言葉のローマ字の読み方は何ですか？',
    'practice_done_title': '練習完了！',
    'practice_done_score': 'スコア：{{total}}問中{{score}}問正解',
    'practice_retry': 'もう一度練習する',
    'practice_back_to_bookmarks': 'ブックマークに戻る',
    
    // Quiz
    'quiz_title': '知識を試そう！',
    'quiz_submit': '答えを確認',
    'quiz_results_title': 'クイズの結果',
    'quiz_results_score': 'スコア：{{total}}問中{{score}}問正解',
    'quiz_results_your_answer': 'あなたの答え',
    'quiz_results_correct': '（正解）',
    'quiz_results_incorrect': '（不正解）',
    'quiz_results_correct_answer': '正解',
    'quiz_results_help': '助けが必要ですか？',
    'topic_Kosakata_short': '語彙を復習',
    'topic_Tata Bahasa_short': '文法を復習',
    'quiz_retry': 'クイズを再挑戦',

    // Search
    'search_results_title': '検索結果',
    'search_results_count': '"{{query}}" の検索結果が{{count}}件見つかりました',
    'search_no_results_title': '結果が見つかりません',
    'search_no_results_subtitle': '別のキーワードで試してください。',

    // AI Chat
    'chat_initial_greeting': 'こんにちは！私は先生AIです。第{{lessonNumber}}課：{{lessonTitle}}について何かお手伝いできますか？',
    'chat_placeholder': '質問を入力...',
    'chat_loading_message': '先生AIは考え中です...',
    'chat_open_button_aria': 'AIアシスタントを開く',
    'chat_navigation_success': 'はい、次の課に進みましょう！',
    'chat_navigation_last_lesson': 'これが最後の課です。この後に課はありません。',

    // Modals (API Key & Settings)
    'save': '保存',
    'save_and_close': '保存して閉じる',
    'verifying': '確認中...',
    'apiKeyModal_title': 'Google AI APIキーが必要です',
    'apiKeyModal_subtitle': '開始するには、Google AI APIキーを入力してください。キーはブラウザに安全に保存されます。',
    'apiKeyModal_input_label': 'Google AI APIキー',
    'apiKeyModal_error_empty': 'APIキーは空にできません。',
    'apiKeyModal_error_invalid': 'APIキーが無効です。確認してもう一度お試しください。',
    'apiKeyModal_info_1': '無料のAPIキーは',
    'apiKeyModal_info_2': 'Google AI Studio',
    'apiKeyModal_info_3': 'から取得できます。キーが共有されることはありません。',
    'settingsModal_title': '設定',
    'settingsModal_language_label': '言語',
    'settingsModal_apiKey_label': 'Google AI APIキー',
  }
};

export default translations;