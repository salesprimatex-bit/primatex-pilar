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

    KETENTUAN TEKNIS:
    - Jika ini adalah pembahasan H2, buat 3-4 subjudul H3 yang membahas fungsi, manfaat, spesifikasi teknis, aplikasi proyek, keunggulan, dan tips pemilihan.
    - Minimal panjang bagian ini adalah 500-600 kata untuk memastikan total artikel mencapai target 5.000 kata.
    - Berikan insight praktis, contoh kasus lapangan, atau kesalahan umum.
    - Gunakan alur problem-solution.
    - JANGAN melakukan keyword stuffing.
    - Gunakan format Markdown yang rapi (H2, H3, List, Bold).

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
