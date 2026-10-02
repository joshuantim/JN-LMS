import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lmsService } from '../../services/lms.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Award,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const AcademicCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ASSIGNMENT' | 'QUIZ'

  // Fetch all calendar events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => lmsService.getCalendarEvents(),
  });

  const allEvents = eventsData?.data || [];

  const filteredEvents = allEvents.filter((ev) => {
    if (filterType === 'ALL') return true;
    return ev.type === filterType;
  });

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Get events on a specific day of this month
  const getEventsForDay = (day) => {
    return filteredEvents.filter((ev) => {
      const d = new Date(ev.date);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <CalendarIcon className="w-6 h-6" />
            </div>
            Academic Schedule & Deadlines
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of assignment due dates, quiz testing windows, and milestone deliverables.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Deadlines
          </button>
          <button
            onClick={() => setFilterType('ASSIGNMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'ASSIGNMENT'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setFilterType('QUIZ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'QUIZ'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            Quizzes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 columns on lg) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={today}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-50 text-slate-600 transition"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-50 text-slate-600 transition border-l border-slate-200"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-xl bg-slate-50/50 p-1" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-24 rounded-xl border p-1.5 flex flex-col justify-between transition ${
                    isToday
                      ? 'border-brand-500 bg-brand-50/20'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => navigate(ev.linkUrl)}
                        title={`${ev.courseCode}: ${ev.title}`}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold cursor-pointer transition ${
                          ev.type === 'ASSIGNMENT'
                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {ev.courseCode}: {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] font-bold text-slate-400 pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines Sidebar (1 column) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-brand-600" />
              Chronological Deliverables ({filteredEvents.length})
            </h2>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs">No upcoming due dates found!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredEvents.map((ev) => {
                  const isSubmitted = ev.status === 'SUBMITTED' || ev.status === 'COMPLETED' || ev.status === 'GRADED';

                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate(ev.linkUrl)}
                      className="group rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:bg-white hover:border-brand-200 hover:shadow-soft-sm transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {ev.type === 'ASSIGNMENT' ? (
                            <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                            {ev.courseCode}
                          </span>
                        </div>

                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            <AlertCircle className="w-3 h-3" /> Due Soon
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition mt-2 truncate">
                        {ev.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          {new Date(ev.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendarPage;
