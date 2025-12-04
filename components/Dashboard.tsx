import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Trash2, Eye, Download, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { SchoolConfig, ExamPaperData } from '../types';

interface SavedPaper {
  id: string;
  title: string;
  subject: string;
  created_at: string;
  updated_at: string;
  content: ExamPaperData;
  config: SchoolConfig;
}

interface DashboardProps {
  session: any;
  onLoadPaper: (paperData: ExamPaperData, config: SchoolConfig) => void;
  onNewPaper: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ session, onLoadPaper, onNewPaper }) => {
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, [session]);

  const fetchPapers = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('exam_papers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPapers(data || []);
    } catch (e: any) {
      console.error('Error fetching papers:', e);
      setError('Failed to load your papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!window.confirm('Are you sure you want to delete this paper? This action cannot be undone.')) {
      return;
    }

    setDeleting(paperId);
    try {
      const { error: deleteError } = await supabase
        .from('exam_papers')
        .delete()
        .eq('id', paperId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;
      setPapers(papers.filter(p => p.id !== paperId));
    } catch (e: any) {
      console.error('Error deleting paper:', e);
      alert('Failed to delete paper. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPaper = (paper: SavedPaper) => {
    const jsonString = JSON.stringify(paper.content, null, 2);
    const element = document.createElement("a");
    const file = new Blob([jsonString], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${paper.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLoadPaper = (paper: SavedPaper) => {
    onLoadPaper(paper.content, paper.config);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with New Paper Button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Exam Papers</h2>
          <p className="text-gray-600">View and manage your saved question papers</p>
        </div>
        <button
          onClick={onNewPaper}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-200 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Paper</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {papers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No saved papers yet</p>
          <p className="text-sm text-gray-500 mt-1">Create and save your first exam paper to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {paper.config?.className} • {paper.subject}
                  </p>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Updated: {formatDate(paper.updated_at)}</p>
                  <p>Questions: {paper.content?.sections?.reduce((sum, s) => sum + s.questions.length, 0) || 0}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleLoadPaper(paper)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm font-medium"
                    title="Load and edit this paper"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Load</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPaper(paper)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    title="Download as JSON"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>
                  <button
                    onClick={() => handleDeletePaper(paper.id)}
                    disabled={deleting === paper.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    title="Delete this paper"
                  >
                    {deleting === paper.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
