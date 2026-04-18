import { GoogleGenAI } from "@google/genai";

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please configure it in the Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ArticleInput {
  b2: string; // Anchor Text
  r2: string; // Internal Link URL
  b3: string; // H1 / Main Keyword
  supportingKeywords: string[]; // B4 - B13
}

export const generateArticleSection = async (
  input: ArticleInput,
  sectionTitle: string,
  context: string,
  isIntro: boolean = false,
  isFAQ: boolean = false,
  isConclusion: boolean = false
) => {
  const ai = getGemini();

  const prompt = `
    Anda adalah seorang Senior Technical Writer dan Pakar SEO di industri konstruksi & infrastruktur.
    Tugas Anda adalah menulis satu bagian dari artikel pilar berjudul: "${input.b3}".

    KONTEKS UTAMA:
    - Target: Kontraktor, Konsultan, Vendor, Tim Pengadaan.
    - Gaya Bahasa: Profesional, Persuasif, Teknis-Populer, Lugas.
    - Bahasa: Indonesia.
    - Fokus: Topical Authority & EEAT.

    INSTRUKSI KHUSUS UNTUK BAGIAN INI:
    - Judul Bagian: ${sectionTitle}
    - Detail: ${context}
    ${isIntro ? "- Tulis pendahuluan mendalam tentang peran produk dalam konstruksi." : ""}
    ${isFAQ ? "- Buat FAQ maksimal 5 pertanyaan teknis yang relevan." : ""}
    ${isConclusion ? "- Buat kesimpulan persuasif dan tambahkan CTA (Call to Action)." : ""}

    KETENTUAN TEKNIS & STRUKTUR:
    - GUNAKAN STRUKTUR HIERARKI YANG KETAT: Gunakan H2 untuk subjudul utama dan H3 untuk rincian teknis di bawahnya.
    - ANTI-THIN CONTENT: Hindari paragraf pendek atau sekadar poin-poin. Setiap paragraf harus berisi penjelasan mendalam, teknis, dan komprehensif (minimal 150-200 kata per sub-pembahasan).
    - Jika ini adalah pembahasan H2, WAJIB buat minimal 3-4 subjudul H3 yang membahas fungsi, manfaat, spesifikasi teknis, aplikasi proyek, keunggulan, dan tips pemilihan secara sangat mendetail.
    - Minimal panjang total bagian ini adalah 400-500 kata untuk memastikan kedalaman materi dan mencapai target artikel pilar.
    - Sertakan data spesifikasi, terminologi industri konstruksi yang akurat, dan narasi berbasis pengalaman lapangan (EEAT).
    - Gunakan alur problem-solution yang persuasif dan kredibel.
    - Gunakan format Markdown yang rapi (H2, H3, Bold untuk penekanan).

    ${sectionTitle === input.supportingKeywords[0] || sectionTitle === input.supportingKeywords[5] ? `
    INSTRUKSI INTERNAL LINK:
    - Sisipkan internal link pada paragraf pertama bagian ini secara natural.
    - Anchor text: [${input.b2}](${input.r2})
    ` : ""}

    ${isConclusion ? `
    KONTAK & CTA (Gunakan link berikut):
    - Konsultasi teknis proyek: [Konsultasi Teknis](https://primatex.co.id/konsultasi/)
    - Permintaan informasi harga: [Permintaan Harga](https://primatex.co.id/permintaan-harga/)
    - Kontak WhatsApp langsung: [WhatsApp](https://wa.me/message/WSI7AS6VJ3SBH1)
    ` : ""}

    Hasil tulisan harus kredibel, seolah ditulis oleh praktisi geoteknik/konstruksi berpengalaman.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

export const generateSEOData = async (articleContent: string, mainKeyword: string) => {
  const ai = getGemini();
  
  const prompt = `
    Tolong konversikan SELURUH isi artikel yang saya berikan di bawah ini ke dalam format HTML yang bersih, valid, dan SEO-friendly, serta sertakan data SEO pendukung.

    ARTIKEL ASLI:
    ${articleContent}

    ---
    
    ATURAN WAJIB (KRITIS & TIDAK BOLEH DILANGGAR):
    - Jangan mengubah, menambah, mengurangi, menghapus, memindahkan, atau memparafrase isi artikel dalam bentuk apa pun.
    - Konversi bersifat MEKANIS, bukan editorial.
    - Pertahankan seluruh struktur, urutan, dan isi teks persis seperti artikel asli.
    - Jangan memindahkan posisi internal link, external link, maupun CTA.
    - DILARANG menambahkan link ke heading dalam kondisi apa pun.

    ATURAN HEADING (SANGAT PENTING):
    - <h1>, <h2>, <h3> WAJIB berisi TEKS MURNI.
    - Heading TIDAK BOLEH mengandung <a>, URL, atau hyperlink dalam bentuk apa pun.
    - Jika pada artikel asli terdapat link di dekat judul, link tersebut HARUS tetap berada di paragraf (<p>) setelah heading, bukan di dalam heading.

    STRUKTUR HTML WAJIB:
    - Gunakan hanya tag berikut:
      <h1> untuk judul utama
      <h2> untuk subjudul
      <h3> untuk sub-subjudul
      <p> untuk paragraf isi (LINK BOLEH DI SINI)
      <ul>, <ol>, <li> untuk daftar
      <strong> untuk penekanan
      <blockquote> untuk kutipan atau penegasan
    - Jangan gunakan tag HTML lain selain yang disebutkan di atas.

    FORMAT LINK (WAJIB):
    - Semua link WAJIB dikonversi ke format HTML:
      <a href="URL">anchor text</a>
    - Anchor text WAJIB sama persis dengan versi artikel sebelumnya.
    - URL WAJIB sama persis.
    - DILARANG membuat, menghapus, memindahkan, atau memodifikasi link.

    OUTPUT HTML (WAJIB DIPATUHI):
    - Outputkan RAW HTML TEXT saja.
    - HTML dimulai langsung dari <h1>.
    - Jangan gunakan <html>, <head>, atau <body>.
    - SELURUH HTML WAJIB berada di dalam SATU code block.
    - Jangan merender HTML.
    - Jangan menambahkan teks penjelasan apa pun di luar code block.
    - Pastikan HTML valid dan rapi (indentasi konsisten).

    SETELAH HTML:
    - Buat DATA SEO TERPISAH (bukan HTML dan di luar code block).

    DATA SEO YANG DIBUTUHKAN:
    1. Judul Artikel (boleh berbeda dari H1, tanpa simbol)
    2. Judul SEO (maks. 60 karakter, mengandung kata kunci utama, tanpa simbol)
    3. Slug SEO-friendly (huruf kecil, tanpa simbol atau spasi, gunakan tanda hubung)
    4. Meta description (±140 karakter, mengandung kata kunci utama secara natural)
    5. Excerpt 1 paragraf (50–80 kata)
    6. Daftar tag relevan (maks. 5 item, pisahkan dengan koma)

    FORMAT DATA SEO:
    - Tampilkan dalam bentuk tabel horizontal (Markdown table).
    - 1 baris header + 1 baris data.
    - TANPA penjelasan tambahan.

    VALIDASI AKHIR (WAJIB):
    - Tidak ada <a> di dalam heading.
    - Semua link sudah dalam format HTML.
    - Tidak ada perubahan isi teks sedikit pun.
    - Tidak ada tag di luar whitelist.
    - Output hanya 1 code block HTML + 1 tabel SEO di bawahnya.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};
