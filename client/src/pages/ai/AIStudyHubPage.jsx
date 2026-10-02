import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { aiService } from '../../services/ai.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Sparkles,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  Award,
  Lightbulb,
  Brain,
  Layers,
  Plus,
  HelpCircle,
  X,
  Send,
  Target,
} from 'lucide-react';

export const AIStudyHubPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState('');
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'tutor'

  // Flashcards State
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [learningIds, setLearningIds] = useState(new Set());

  // Generate Deck Modal State
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [deckParams, setDeckParams] = useState({
    courseId: '',
    count: 8,
    topic: '',
  });

  // Fetch user courses
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });
  const courses = coursesData?.data?.courses || [];

  // Automatically select first course
  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(courses[0].id);
      setDeckParams((prev) => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses, selectedCourse]);

  // Generate Flashcards Mutation
  const generateDeckMutation = useMutation({
    mutationFn: (data) => aiService.generateFlashcards(data),
    onSuccess: (res) => {
      setCards(res.data || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setMasteredIds(new Set());
      setLearningIds(new Set());
      setShowDeckModal(false);
    },
  });

  // Initial load of default flashcards if none generated
  useEffect(() => {
    if (selectedCourse && cards.length === 0) {
      generateDeckMutation.mutate({
        courseId: selectedCourse,
        count: 8,
      });
    }
  }, [selectedCourse]);

  // Fetch Adaptive Tutor Recommendations
  const { data: tutorData, isLoading: loadingTutor } = useQuery({
    queryKey: ['tutorRecommendations', selectedCourse],
    queryFn: () => aiService.getTutorRecommendations({ courseId: selectedCourse || undefined }),
    enabled: activeTab === 'tutor',
  });
  const tutorDiagnostics = tutorData?.data;

  // Flashcard controls
  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const markMastered = (cardId) => {
    setMasteredIds((prev) => new Set([...prev, cardId]));
    setLearningIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    handleNext();
  };

  const markLearning = (cardId) => {
    setLearningIds((prev) => new Set([...prev, cardId]));
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    handleNext();
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-accent-600 to-brand-600 text-white shadow-soft-sm">
              <Brain className="w-6 h-6" />
            </div>
            AI Adaptive Study Hub & Memory Station
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Master course terminology with AI flashcards and view diagnostic recommendations based on your quiz performance.
          </p>
        </div>

        {/* Course Filter */}
        <div className="sm:w-72">
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setDeckParams((prev) => ({ ...prev, courseId: e.target.value }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'flashcards'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Interactive Flashcards ({cards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tutor')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'tutor'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Adaptive Tutor Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {masteredIds.size} Mastered
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {learningIds.size} Needs Review
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={() => setShowDeckModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate New Deck</span>
              </button>
            </div>
          </div>

          {/* 3D Flashcard Stage */}
          {generateDeckMutation.isPending ? (
            <div className="py-24 text-center">
              <LoadingSpinner />
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Synthesizing flashcards from course materials...
              </p>
            </div>
          ) : !currentCard ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No flashcards loaded.</p>
              <button
                onClick={() => setShowDeckModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Flashcard Deck</span>
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-4">
              {/* Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-80 w-full cursor-pointer select-none rounded-3xl border-2 border-slate-200/90 bg-white p-8 shadow-soft-lg hover:shadow-soft-xl hover:border-brand-400 transition flex flex-col justify-between"
              >
                {/* Top card metadata */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    Card {currentCardIndex + 1} of {cards.length}
                  </span>
                  <span className="text-xs font-bold text-brand-600 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    {isFlipped ? 'Answer Side' : 'Click to Flip'}
                  </span>
                </div>

                {/* Card Main Body */}
                <div className="my-auto text-center px-4">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase block">
                        {currentCard.topic || 'Concept Term'}
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">
                        {currentCard.front}
                      </h2>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <p className="text-sm text-slate-800 font-medium leading-relaxed">
                        {currentCard.back}
                      </p>
                      {currentCard.hint && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-xl">
                          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Mnemonic / Hint: {currentCard.hint}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom card status indicator */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Topic: {currentCard.topic}</span>
                  {masteredIds.has(currentCard.id) ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                    </span>
                  ) : learningIds.has(currentCard.id) ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Reviewing
                    </span>
                  ) : (
                    <span>Unmarked</span>
                  )}
                </div>
              </div>

              {/* Mastery Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => markLearning(currentCard.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Still Learning</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                    title="Previous card"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                    title="Next card"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <button
                  onClick={() => markMastered(currentCard.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mastered</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADAPTIVE TUTOR DIAGNOSTICS */}
      {activeTab === 'tutor' && (
        <div className="space-y-6">
          {loadingTutor ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : !tutorDiagnostics || !tutorDiagnostics.hasHistory ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Assessment History Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Take a quiz in your enrolled courses to generate targeted diagnostics and study gap remediation from your lecture notes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Performance Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Overall Quiz Accuracy
                  </h3>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {tutorDiagnostics.overallAccuracy}%
                    </span>
                    <span className="text-xs text-slate-400">
                      across {tutorDiagnostics.totalAttempts} quiz attempts
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50 text-brand-600">
                  <Brain className="w-8 h-8" />
                </div>
              </div>

              {/* Weak Areas & Remediation Plan */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-600" />
                  Targeted Learning Gap Remediation ({tutorDiagnostics.recommendations?.length || 0})
                </h3>

                <div className="space-y-4">
                  {tutorDiagnostics.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            {rec.missedQuestionsCount} missed questions
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">
                            Topic: {rec.topic}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {rec.studyAdvice}
                      </p>

                      {/* Recommended Course Readings */}
                      {rec.recommendedReadings?.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Recommended Course Reading Materials
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rec.recommendedReadings.map((reading, rIdx) => (
                              <div
                                key={rIdx}
                                className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between font-bold text-brand-900">
                                  <span className="truncate">{reading.documentTitle}</span>
                                  <span className="text-[10px] bg-brand-100 px-1.5 py-0.2 rounded">
                                    Page {reading.pageNumber}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                                  "{reading.snippet}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Flashcard Deck Modal */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-soft-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Generate Flashcard Deck
              </h2>
              <button
                onClick={() => setShowDeckModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateDeckMutation.mutate(deckParams);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course
                </label>
                <select
                  required
                  value={deckParams.courseId}
                  onChange={(e) => setDeckParams({ ...deckParams, courseId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Statistical Distributions, Chapter 3"
                  value={deckParams.topic}
                  onChange={(e) => setDeckParams({ ...deckParams, topic: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Cards
                </label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={deckParams.count}
                  onChange={(e) => setDeckParams({ ...deckParams, count: parseInt(e.target.value, 10) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeckModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateDeckMutation.isPending || !deckParams.courseId}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generateDeckMutation.isPending ? 'Generating...' : 'Synthesize Deck'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudyHubPage;
