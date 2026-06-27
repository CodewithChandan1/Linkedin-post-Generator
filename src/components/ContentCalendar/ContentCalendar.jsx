"use client";
// Content Calendar — 7-day ahead view with drag topic reorder
// PRD §6.8

import { useState, useEffect } from "react";
import {
  getCalendarDays,
  loadCalendar,
  updateCalendarDay,
  resetCalendarDay,
  AVAILABLE_TOPICS,
  AVAILABLE_FORMATS,
} from "@/lib/contentCalendar";

import { Calendar } from "lucide-react";

const FORMAT_COLORS = {
  text: "bg-gray-100 text-gray-700",
  carousel: "bg-blue-100 text-blue-700",
  poll: "bg-purple-100 text-purple-700",
};

export default function ContentCalendar({ onClose, onGenerateForDay }) {
  const [calendarOverrides, setCalendarOverrides] = useState({});
  const [days, setDays] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const overrides = loadCalendar();
    setCalendarOverrides(overrides);
    setDays(getCalendarDays(overrides));
  }, []);

  function openEdit(day) {
    setEditingDay(day.dateKey);
    setEditForm({
      topic: day.topic,
      format: day.format,
      customPrompt: day.customPrompt,
    });
  }

  function saveEdit(dateKey) {
    const updated = updateCalendarDay(dateKey, editForm);
    setCalendarOverrides(updated);
    setDays(getCalendarDays(updated));
    setEditingDay(null);
  }

  function resetDay(dateKey) {
    const updated = resetCalendarDay(dateKey);
    setCalendarOverrides(updated);
    setDays(getCalendarDays(updated));
    setEditingDay(null);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Calendar size={16} /> Content Calendar
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Next 7 days — click any day to customize</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-2">
          {days.map((day) => (
            <div
              key={day.dateKey}
              className={`rounded-xl border p-3 transition ${
                day.isToday
                  ? "border-linkedin bg-linkedin/5"
                  : day.overridden
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {editingDay === day.dateKey ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {day.dayName} · {day.shortDate}
                    </p>
                    <button
                      onClick={() => setEditingDay(null)}
                      className="text-gray-400 hover:text-gray-600 text-lg"
                    >
                      ×
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Topic</label>
                    <select
                      value={editForm.topic}
                      onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
                    >
                      {AVAILABLE_TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Format</label>
                    <div className="flex gap-2">
                      {AVAILABLE_FORMATS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setEditForm((ef) => ({ ...ef, format: f.value }))}
                          className={`flex-1 text-xs py-1.5 rounded-lg border transition ${
                            editForm.format === f.value
                              ? "border-linkedin bg-linkedin/10 text-linkedin"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Custom prompt (optional)</label>
                    <input
                      type="text"
                      value={editForm.customPrompt}
                      onChange={(e) => setEditForm((f) => ({ ...f, customPrompt: e.target.value }))}
                      placeholder="e.g. 'My experience with React Server Components'"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(day.dateKey)}
                      className="flex-1 bg-linkedin text-white text-sm py-1.5 rounded-full hover:bg-linkedin-hover"
                    >
                      Save
                    </button>
                    {day.overridden && (
                      <button
                        onClick={() => resetDay(day.dateKey)}
                        className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-3">
                  <div className="shrink-0 text-center w-10">
                    <p className="text-[10px] text-gray-400 uppercase">{day.dayName.slice(0, 3)}</p>
                    <p className={`text-lg font-bold ${day.isToday ? "text-linkedin" : "text-gray-700"}`}>
                      {day.shortDate.split(" ")[1]}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{day.topic}</p>
                      {day.isToday && (
                        <span className="text-[10px] bg-linkedin text-white px-1.5 py-0.5 rounded">TODAY</span>
                      )}
                      {day.overridden && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Custom</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[day.format]}`}>
                        {AVAILABLE_FORMATS.find((f) => f.value === day.format)?.label || day.format}
                      </span>
                      {day.customPrompt && (
                        <p className="text-[10px] text-gray-500 truncate">"{day.customPrompt}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {day.isToday && onGenerateForDay && (
                      <button
                        onClick={() => { onGenerateForDay(day); onClose(); }}
                        className="text-[10px] text-white bg-linkedin hover:bg-linkedin-hover px-2.5 py-1 rounded-full"
                      >
                        Generate
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(day)}
                      className="text-[10px] text-gray-500 border border-gray-200 px-2 py-1 rounded-full hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <p className="text-[11px] text-gray-400 text-center pt-2">
            Click "Edit" to change topic, format, or add a custom prompt for any day
          </p>
        </div>
      </div>
    </div>
  );
}
