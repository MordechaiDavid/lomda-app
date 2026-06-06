'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../../../lib/apiService';
import type { Course } from '../../../../types/course';

type Step = 1 | 2 | 3 | 4;

export default function NewCampaignPage() {
  const [step, setStep] = useState<Step>(1);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [passingScore, setPassingScore] = useState(70);

  // Step 2 fields
  const [emailsRaw, setEmailsRaw] = useState('');
  const [addingRecipients, setAddingRecipients] = useState(false);
  const [recipientMsg, setRecipientMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => apiService.getCourses(1, 100).then((r) => r.data.data.courses as Course[])
  });

  const publishedCourses = (coursesData ?? []).filter((c) => c.is_published);

  const createCampaign = async () => {
    if (!title || !courseId) { setError('יש למלא שם קמפיין ולבחור קורס'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiService.createCampaign({
        title,
        course_id: courseId,
        due_date: dueDate || undefined,
        passing_score: passingScore
      });
      setCampaignId(res.data.data.id);
      setStep(2);
    } catch { setError('שגיאה ביצירת הקמפיין'); }
    finally { setSaving(false); }
  };

  const addRecipients = async () => {
    if (!campaignId) return;
    const emails = emailsRaw
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));

    if (emails.length === 0) { setError('יש להזין כתובת מייל אחת לפחות'); return; }
    setAddingRecipients(true); setError('');
    try {
      await apiService.addCampaignRecipients(campaignId, emails);
      setRecipientMsg(`נוספו ${emails.length} נמענים`);
      setStep(3);
    } catch { setError('שגיאה בהוספת נמענים'); }
    finally { setAddingRecipients(false); }
  };

  const sendCampaign = async () => {
    if (!campaignId) return;
    setSaving(true); setError('');
    try {
      const res = await apiService.sendCampaign(campaignId);
      const { sent } = res.data.data;
      setRecipientMsg(`נשלחו ${sent} מיילים`);
      setStep(4);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'שגיאה בשליחה');
    }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Breadcrumb */}
        <a href="/dashboard/campaigns" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← חזרה לקמפיינים
        </a>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">קמפיין חדש</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {([1,2,3] as const).map((s) => (
            <div key={s} className={`flex items-center gap-2 ${s < 4 ? 'flex-1' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>{step > s ? '✓' : s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">שלב 1: פרטי הקמפיין</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">שם הקמפיין</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: הדרכת הגנת פרטיות 2025"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">בחר קורס (מפורסם)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">בחר קורס...</option>
                {publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              {coursesData && publishedCourses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">אין קורסים מפורסמים. <a href="/courses" className="underline">פרסם קורס תחילה.</a></p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך יעד להשלמה</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ציון עובר (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={createCampaign}
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'שומר...' : 'הבא: הוסף נמענים →'}
            </button>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">שלב 2: נמענים</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                כתובות מייל (כל שורה / פסיק / נקודה-פסיק)
              </label>
              <textarea
                rows={8}
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                placeholder="employee1@company.com&#10;employee2@company.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono resize-none"
              />
            </div>
            <button
              onClick={addRecipients}
              disabled={addingRecipients}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {addingRecipients ? 'מוסיף...' : 'הבא: שלח קמפיין →'}
            </button>
          </div>
        )}

        {/* Step 3: Send */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-center">
            <h2 className="text-sm font-semibold text-slate-700">שלב 3: שלח מיילים</h2>
            <p className="text-sm text-gray-500">{recipientMsg}</p>
            <p className="text-sm text-gray-600">
              לחץ שלח — כל נמען יקבל מייל עם קישור ייחודי ללומדה.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ לא ניתן לבטל שליחה. ודא שהפרטים נכונים.
            </div>
            <button
              onClick={sendCampaign}
              disabled={saving}
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'שולח...' : '📨 שלח קמפיין'}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-bold text-slate-900">הקמפיין נשלח!</h2>
            <p className="text-sm text-gray-600">{recipientMsg}</p>
            <div className="flex flex-col gap-2">
              <a
                href={`/dashboard/campaigns/${campaignId}`}
                className="block w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                צפה בניתוח הקמפיין
              </a>
              <a
                href="/dashboard/campaigns"
                className="block w-full py-3 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50"
              >
                חזרה לקמפיינים
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
