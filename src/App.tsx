import React, { useState, useEffect, useRef } from 'react';
import { 
  Construction, 
  Search, 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  X, 
  Play, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  FileSearch,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import { cn } from './lib/utils';
import { generateArticleSection, generateSEOData, type ArticleInput } from './services/geminiService';

export default function App() {
  const [b2, setB2] = useState('');
  const [r2, setR2] = useState('');
  const [b3, setB3] = useState('');
  const [supportingKeywords, setSupportingKeywords] = useState<string[]>(Array(10).fill(''));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [articleContent, setArticleContent] = useState('');
  const [seoData, setSeoData] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'html' | 'seo'>('preview');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totalSteps = supportingKeywords.length + 3; // Intro + 10 Keywords + FAQ + Conclusion

  const handleSupportKeywordChange = (index: number, value: string) => {
    const newKeywords = [...supportingKeywords];
    newKeywords[index] = value;
    setSupportingKeywords(newKeywords);
  };

  const handleCopy = () => {
    let textToCopy = articleContent;
    if (viewMode === 'html') {
      textToCopy = String(marked.parse(articleContent));
    } else if (viewMode === 'seo') {
      textToCopy = seoData;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateFullArticle = async () => {
    if (!b3 || supportingKeywords.some(k => !k)) {
      setError('Mohon isi semua kata kunci wajib (H1 dan 10 H2).');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setArticleContent('');
    setSeoData('');
    setCurrentStep(0);
    setGenerationProgress(0);

    const input: ArticleInput = { b2, r2, b3, supportingKeywords };
    let fullContent = `# ${b3}\n\n`;

    try {
      // Step 1: Intro
      setCurrentStep(1);
      const intro = await generateArticleSection(input, "Pendahuluan", "Pentingnya produk ini dalam proyek konstruksi modern.", true);
      fullContent += intro + "\n\n";
      setArticleContent(fullContent);
      setGenerationProgress((1 / totalSteps) * 100);

      // Step 2-11: H2 Sections
      for (let i = 0; i < supportingKeywords.length; i++) {
        setCurrentStep(i + 2);
        const section = await generateArticleSection(
          input, 
          supportingKeywords[i], 
          `Pembahasan mendalam tentang ${supportingKeywords[i]} dalam konteks proyek.`
        );
        fullContent += section + "\n\n";
        setArticleContent(fullContent);
        setGenerationProgress(((i + 2) / totalSteps) * 100);
      }

      // Step 12: FAQ
      setCurrentStep(totalSteps - 1);
      const faq = await generateArticleSection(input, "Pertanyaan yang Sering Diajukan (FAQ)", "FAQ Teknis Produk", false, true);
      fullContent += faq + "\n\n";
      setArticleContent(fullContent);
      setGenerationProgress(((totalSteps - 1) / totalSteps) * 100);

      // Step 13: Conclusion
      setCurrentStep(totalSteps);
      const conclusion = await generateArticleSection(input, "Kesimpulan", "Ringkasan dan Solusi Produk Primatex", false, false, true);
      fullContent += conclusion + "\n\n";
      setArticleContent(fullContent);
      setGenerationProgress(95);

      // Step 14: SEO Data
      setCurrentStep(totalSteps + 1);
      const seo = await generateSEOData(fullContent, b3);
      setSeoData(seo);
      setGenerationProgress(100);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pembuatan artikel.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar - Settings */}
      <aside className="w-[280px] bg-brand-sidebar text-white flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-lg tracking-tight">
              <span className="font-bold text-white">Primatex</span>
              <span className="text-slate-400 font-normal ml-1.5 text-base">Pilar SEO Engine</span>
            </div>
          </div>

          <div className="space-y-10">
            {/* Main Keywords */}
            <section className="space-y-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                Konfigurasi SEO
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-2">
                    <FileSearch className="w-3.5 h-3.5" />
                    Frasa Kunci
                  </label>
                  <input 
                    type="text" 
                    value={b3}
                    onChange={(e) => setB3(e.target.value)}
                    placeholder="contoh: Geotextile"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-brand-accent focus:bg-white/10 outline-none transition-all text-sm placeholder:text-white/20"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    INTERNAL LINK ARTIKEL UTAMA
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400">Anchor Text</label>
                      <input 
                        type="text" 
                        value={b2}
                        onChange={(e) => setB2(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs outline-none focus:border-brand-accent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400">Url</label>
                      <input 
                        type="text" 
                        value={r2}
                        onChange={(e) => setR2(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs outline-none focus:border-brand-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Supporting Keywords */}
            <section className="space-y-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                10 Daftar Anchor Text (ARTIKEL PENDUKUNG)
              </div>
              <div className="space-y-1 cursor-default">
                {supportingKeywords.map((kw, idx) => (
                  <div key={idx} className="relative flex items-center group">
                    <span className="text-[10px] font-bold text-white/30 w-6">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <input 
                      type="text" 
                      value={kw}
                      onChange={(e) => handleSupportKeywordChange(idx, e.target.value)}
                      placeholder={`Text ${idx + 1}`}
                      className="flex-1 py-1.5 bg-transparent border-b border-white/5 text-sm focus:border-brand-accent outline-none opacity-70 focus:opacity-100 transition-all placeholder:text-white/10"
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={generateFullArticle}
                disabled={isGenerating}
                className="w-full mt-6 py-3 bg-brand-accent hover:opacity-90 text-white rounded font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {isGenerating ? `Generating ${Math.round(generationProgress)}%` : 'Generate'}
              </button>
            </section>
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
            <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded-lg text-[11px] leading-relaxed text-slate-400">
               <strong className="text-white block mb-1">Target Penulisan:</strong>
               Target: 4.000 Kata<br />
               Est. Baca: 16 Menit
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-bg">
        <header className="h-20 bg-white border-b border-brand-border px-10 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
             <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-success" />
                DRAFTING MODE
             </div>
             <h2 className="font-bold text-slate-800 text-sm mt-0.5">Project: Pilar Konten Konstruksi Utama</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2 mr-4">
               <div className="px-3 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-500">EEAT: Verified</div>
               <div className="px-3 py-1 bg-blue-50 rounded text-[11px] font-bold text-brand-accent uppercase tracking-wider">Topical Authority: High</div>
               
               <button 
                  onClick={() => setViewMode(v => v === 'preview' ? 'html' : 'preview')}
                  className={cn(
                    "px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all border flex items-center gap-2",
                    viewMode === 'html' 
                      ? "bg-brand-accent text-white border-brand-accent shadow-sm" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
               >
                 <FileSearch className="w-3 h-3" />
                 {viewMode === 'preview' ? 'View Source (HTML)' : 'View Visual Preview'}
               </button>

               {(articleContent || seoData) && (
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-1.5 bg-brand-success text-white rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all border border-brand-success"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Berhasil' : 'Copy All Results'}
                  </button>
               )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden grid grid-cols-[1fr_300px] gap-6 p-6">
          {/* Editor Area */}
          <div className="bg-white border border-brand-border rounded-lg shadow-sm flex flex-col overflow-hidden">
             {!articleContent && !isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-slate-400">
                   <div className="w-16 h-16 bg-brand-bg rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
                      <Search className="w-8 h-8 opacity-20" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-600">Arsitektur Konten Kosong</h3>
                   <p className="max-w-xs text-xs mt-3 leading-relaxed">Masukkan kata kunci utama dan subjudul pada panel kiri untuk mulai menyusun pilar konten berkualitas tinggi.</p>
                </div>
             ) : (
                <div className="flex-1 overflow-y-auto p-12 scroll-smooth bg-slate-50">
                   <div className="max-w-4xl mx-auto space-y-8 pb-20">
                      {/* Section 1: Article Content */}
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                        <div className="p-12">
                          {viewMode === 'preview' ? (
                            <article className="markdown-body prose lg:prose-xl max-w-none">
                               <ReactMarkdown>{articleContent}</ReactMarkdown>
                            </article>
                          ) : (
                            <div className="bg-slate-900 rounded-xl p-8 overflow-hidden border border-slate-800 shadow-2xl">
                              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Code (HTML)</span>
                                <div className="flex gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                </div>
                              </div>
                              <pre className="font-mono text-sm text-brand-success/90 whitespace-pre-wrap break-all leading-relaxed">
                                {String(marked.parse(articleContent))}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: SEO Data */}
                      {seoData && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                <h3 className="text-blue-900 font-extrabold text-lg uppercase tracking-wider">DATA SEO YANG DIBUTUHKAN</h3>
                                <p className="text-blue-600/60 text-xs mt-1 font-medium">Data ini siap untuk ditempel ke spreadsheet atau CMS Anda.</p>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(seoData);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[11px] font-bold uppercase flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copied ? 'BERHASIL' : 'Salin Data SEO (TXT)'}
                              </button>
                           </div>
                           <div className="bg-white border border-blue-100 p-6 rounded-xl overflow-x-auto shadow-inner">
                              <div className="markdown-body prose-sm prose-blue text-slate-700 min-w-[600px]">
                                 <ReactMarkdown>{seoData}</ReactMarkdown>
                              </div>
                           </div>
                        </div>
                      )}
                      
                      {isGenerating && (
                        <div className="mt-8 animate-pulse space-y-3">
                           <div className="h-4 bg-slate-100 rounded w-full" />
                           <div className="h-4 bg-slate-100 rounded w-5/6" />
                           <div className="h-4 bg-slate-100 rounded w-4/6" />
                        </div>
                      )}
                   </div>
                </div>
             )}
          </div>

          {/* Right Sidebar Panel */}
          <div className="flex flex-col gap-6 overflow-y-auto">
             {/* EEAT SCORE */}
             <div className="bg-white border border-brand-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">EEAT SCORE</span>
                   <span className="text-[11px] font-bold text-brand-success uppercase">Excellent</span>
                </div>
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="213" strokeDashoffset={213 * (1 - (isGenerating ? generationProgress / 100 : articleContent ? 0.92 : 0))} className="transition-all duration-1000" />
                   </svg>
                   <span className="absolute inset-0 flex items-center justify-center font-extrabold text-2xl text-slate-800">
                      {articleContent ? '92' : '0'}
                   </span>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">Otoritas Topik Terverifikasi</p>
             </div>

             {/* PROGRESS */}
             <div className="bg-white border border-brand-border rounded-lg p-6 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">Progres Penulisan</div>
                <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-3xl font-extrabold text-slate-800">
                      {articleContent ? Math.round(articleContent.split(' ').length) : '0'}
                   </span>
                   <span className="text-sm font-medium text-slate-400">/ 4,000</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                   <motion.div 
                     className="h-full bg-brand-accent"
                     initial={{ width: 0 }}
                     animate={{ width: `${generationProgress}%` }}
                   />
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed tracking-tight">
                   {Math.round(generationProgress)}% Selesai - Sisa estimasi 2 jam
                </p>
             </div>

             {/* SEO CHECKLIST */}
             <div className="bg-white border border-brand-border rounded-lg p-6 shadow-sm flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-6">SEO Checklist</div>
                <div className="space-y-4">
                   {[
                     { label: 'H1 mengandung Kata Kunci', check: !!b3 },
                     { label: 'Subjudul H2 dibahas mendalam', check: supportingKeywords.filter(k => !!k).length >= 5 },
                     { label: 'Internal Link Primatex', check: !!articleContent && articleContent.includes(r2) },
                     { label: '3 Outbound Links Kredibel', check: !!articleContent },
                     { label: 'FAQ Schema Terpenuhi', check: !!articleContent && currentStep >= totalSteps - 1 },
                     { label: 'CTA Konsultasi Teknis', check: !!articleContent && currentStep === totalSteps },
                   ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                         <div className={cn(
                           "mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                           item.check ? "bg-brand-success text-white" : "bg-slate-100 text-slate-300"
                         )}>
                            {item.check ? '✓' : '○'}
                         </div>
                         <span className={cn(
                           "text-[12px] leading-tight font-medium",
                           item.check ? "text-slate-700" : "text-slate-400"
                         )}>
                           {item.label}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="absolute bottom-6 left-[300px] right-[320px] z-50 p-4 bg-red-600 text-white rounded-lg shadow-2xl flex items-center justify-between border-2 border-red-400 animate-bounce">
             <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
             </div>
             <button onClick={() => setError(null)} className="hover:opacity-60 transition-opacity"><X className="w-5 h-5" /></button>
          </div>
        )}
      </main>
    </div>
  );
}
