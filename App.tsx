import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { FileUpload } from './components/FileUpload';
import { PaperRenderer } from './components/PaperRenderer';
import { Dashboard } from './components/Dashboard';
import { Feedback } from './components/Feedback';
import { Landing } from './Landing';
import { SchoolConfig, AppState, ExamPaperData } from './types';
import { geminiService } from './services/gemini';
import { checkAndIncrementTrial, getRemainingTrials } from './services/usageService';
import { Auth } from './Auth';
import { Sparkles, Printer, LayoutTemplate, Loader2, AlertCircle, PenTool, Download, ImagePlus, X, LogOut, CloudUpload, LayoutGrid, MessageCircle, ArrowLeft } from 'lucide-react';

const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "SRI’S MODEL SCHOOL",
  examName: "SUMMATIVE ASSESSMENT TEST - I",
  className: "UKG",
  subject: "ENGLISH",
  marks: "50",
  time: "2 ½ Hrs",
  date: "",
  logoUrl: null
};

const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) { return defaultValue; }
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // App State
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<SchoolConfig>(() => loadState('examGenConfig', DEFAULT_CONFIG));
  const [paperData, setPaperData] = useState<ExamPaperData | null>(() => loadState('examGen_data', null));

  // Navigation
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'editor'>(() => {
    return (localStorage.getItem('examGen_currentView') as any) || 'landing';
  });
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Usage
  const [remainingTrials, setRemainingTrials] = useState<number | null>(null);
  const [trialCheckLoading, setTrialCheckLoading] = useState(false);

  // Auth & Init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user?.id) {
        fetchRemainingTrials(session.user.id);
        if (!['landing','auth'].includes(localStorage.getItem('examGen_currentView') || '')) setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user?.id) fetchRemainingTrials(session.user.id);
      else setCurrentView('landing');
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRemainingTrials = async (userId: string) => {
    const remaining = await getRemainingTrials(userId);
    setRemainingTrials(remaining);
  };

  // Persistence
  useEffect(() => { localStorage.setItem('examGenConfig', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('examGen_currentView', currentView); }, [currentView]);
  useEffect(() => {
    if (paperData) localStorage.setItem('examGen_data', JSON.stringify(paperData));
    else localStorage.removeItem('examGen_data');
  }, [paperData]);

  useEffect(() => {
    if (status === AppState.ANALYZING) return;
    if (paperData) setStatus(AppState.READY);
    else setStatus(AppState.IDLE);
  }, [paperData, status]);

  // Handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPaperData(null);
    setFiles([]);
    setStatus(AppState.IDLE);
    setCurrentView('landing');
    window.location.reload();
  };

  const handleNewPaper = () => {
    setPaperData(null);
    setFiles([]);
    setStatus(AppState.IDLE);
    setCurrentView('editor');
  };

  const handleSaveToCloud = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('exam_papers').upsert({
        user_id: session.user.id,
        title: config.examName,
        subject: config.subject,
        content: { type: 'ai', data: paperData },
        config: config,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert("Paper saved to cloud successfully!");
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPaper = (content: any, config: SchoolConfig) => {
    setPaperData(content.data || content);
    setConfig(config);
    setStatus(AppState.READY);
    setCurrentView('editor');
  };

  // THE UNIFIED ANALYZE FUNCTION
  const handleAnalyze = async () => {
    if (files.length === 0) return;
    if (!session?.user?.id) return;

    setTrialCheckLoading(true);
    try {
      const result = await checkAndIncrementTrial(session.user.id);
      if (!result.allowed) {
        setErrorMsg(`Trial limit exceeded. ${result.message}`);
        setTrialCheckLoading(false);
        return;
      }
      setRemainingTrials(result.remaining);

      setStatus(AppState.ANALYZING);
      setErrorMsg(null);

      // Standard Analysis - No Cropping, No Boxes
      let jsonResult = await geminiService.analyzeExamSheet(files);
      jsonResult = jsonResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsedData: ExamPaperData = JSON.parse(jsonResult);
      
      setPaperData(parsedData);
      setStatus(AppState.READY);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to analyze content.");
      setStatus(AppState.ERROR);
    } finally {
      setTrialCheckLoading(false);
    }
  };

  // UI Actions
  const handlePrint = () => window.print();
  
  const handleDownloadJson = () => {
    if (!paperData) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(paperData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `exam-paper.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (currentView === 'landing' && !session) return <Landing onGetStarted={() => setCurrentView('auth')} />;
  if (currentView === 'auth' || !session) return <Auth />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20 print:pb-0 print:bg-white print:h-auto print:overflow-visible">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><LayoutTemplate className="w-5 h-5 text-white" /></div>
            <h1 className="font-bold text-xl tracking-tight">ExamGen<span className="text-indigo-600">AI</span></h1>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'editor' ? (
               <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
              </button>
            ) : (
              <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg transition-colors text-sm font-medium">
                <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
            <button onClick={() => setShowFeedback(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><MessageCircle className="w-5 h-5" /></button>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg mr-2"><LogOut className="w-5 h-5" /></button>

            {status === AppState.READY && (
              <>
                <button onClick={handleSaveToCloud} disabled={isSaving} className="flex items-center gap-2 px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />} <span className="hidden sm:inline">Save</span>
                </button>
                <button onClick={handleDownloadJson} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">JSON</span>
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm hover:shadow-md">
                  <Printer className="w-4 h-4" /> Save as PDF
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showFeedback && <Feedback session={session} onClose={() => setShowFeedback(false)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:w-full print:max-w-none">
        {currentView === 'dashboard' ? (
          <Dashboard session={session} onLoadPaper={handleLoadPaper} onNewPaper={handleNewPaper} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 print:block">
            {/* Sidebar */}
            <div className="w-full lg:w-[350px] flex-shrink-0 space-y-6 print:hidden">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">1. School Details</h2>
                <div className="space-y-4">
                  {/* Logo Logic */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">School Logo</label>
                    {config.logoUrl ? (
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 relative">
                        <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded border border-gray-100" />
                        <span className="text-xs text-gray-500 flex-1 truncate">Logo Saved</span>
                        <button onClick={() => setConfig(p => ({...p, logoUrl: null}))} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="relative group">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 bg-white group-hover:bg-gray-50 transition-all"><ImagePlus className="w-4 h-4" /> <span className="text-xs">Upload logo...</span></div>
                      </div>
                    )}
                  </div>
                  {[ { label: 'School Name', key: 'schoolName' }, { label: 'Exam Title', key: 'examName' }, { label: 'Class', key: 'className' }, { label: 'Subject', key: 'subject' }, { label: 'Marks', key: 'marks' }, { label: 'Time', key: 'time' }, { label: 'Date', key: 'date' } ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input type="text" value={(config as any)[field.key]} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">2. Generate Paper</h2>
                <FileUpload files={files} setFiles={setFiles} />
                <button
                  onClick={handleAnalyze}
                  disabled={files.length === 0 || status === AppState.ANALYZING || trialCheckLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {status === AppState.ANALYZING || trialCheckLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Sparkles className="w-5 h-5" /> Digitize Paper</>}
                </button>
                {remainingTrials !== null && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center font-medium">Trials: {remainingTrials}/3</div>}
                {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errorMsg}</div>}
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex justify-center bg-gray-100 print:bg-white print:w-full print:p-0">
              {status === AppState.IDLE ? (
                <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 text-center max-w-md mx-auto">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4"><PenTool className="w-12 h-12 text-indigo-200" /></div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Digitize</h3>
                  <p className="text-sm">Upload any handwritten or printed exam paper. <br/>We will convert it to an editable format.<br/>You can then <b>delete</b> the questions you don't need.</p>
                </div>
              ) : (
                <PaperRenderer config={config} data={paperData} onUpdateData={setPaperData} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;