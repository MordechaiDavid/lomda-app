'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../../../lib/apiService';
import type { Course } from '../../../../types/course';

type WizardStep = 1 | 2 | 3 | 4;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function NewCampaignPage() {
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [passingScore, setPassingScore] = useState(70);

  // Step 2 — user selection
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [addingRecipients, setAddingRecipients] = useState(false);
  const [recipientMsg, setRecipientMsg] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch courses and users
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => apiService.getCourses(1, 100).then((r) => r.data.data.courses as Course[])
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => apiService.getUsers(1, 200).then((r) => r.data.data.users as UserRow[])
  });

  const publishedCourses = (coursesData ?? []).filter((c) => c.is_published);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return (usersData ?? []).filter(
      (u) => u.is_active && u.role === 'employee' &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [usersData, userSearch]);

  const toggleUser = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectAll = () => setSelectedEmails(new Set(filteredUsers.map((u) => u.email)));
  const clearAll  = () => setSelectedEmails(new Set());

  // ── Wizard actions ──────────────────────────────────────────────────────────
  const createCampaign = async () => {
    if (!title || !courseId) { setError('יש למלא שם קמפיין ולבחור לומדה'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiService.createCampaign({ title, course_id: courseId, due_date: dueDate || undefined, passing_score: passingScore });
      setCampaignId(res.data.data.id);
      setWizardStep(2);
    } catch { setError('שגיאה ביצירת הקמפיין'); }
    finally { setSaving(false); }
  };

  const addRecipients = async () => {
    if (!campaignId) return;

    // Combine selected users + manual emails
    const manualList = manualEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'));
    const allEmails = Array.from(new Set([...Array.from(selectedEmails), ...manualList]));

    if (allEmails.length === 0) { setError('יש לבחור לפחות נמען אחד'); return; }
    setAddingRecipients(true); setError('');
    try {
      await apiService.addCampaignRecipients(campaignId, allEmails);
      setRecipientMsg(`נוספו ${allEmails.length} נמענים`);
      setWizardStep(3);
    } catch { setError('שגיאה בהוספת נמענים'); }
    finally { setAddingRecipients(false); }
  };

  const sendCampaign = async () => {
    if (!campaignId) return;
    setSaving(true); setError('');
    try {
      const res = await apiService.sendCampaign(campaignId);
      setRecipientMsg(`נשלחו ${res.data.data.sent} מיילים`);
      setWizardStep(4);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'שגיאה בשליחה');
    }
    finally { setSaving(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <a href="/dashboard/campaigns" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← חזרה לקמפיינים
        </a>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">קמפיין חדש</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {([1,2,3] as const).map((s, i) => (
            <div key={s} className={`flex items-center gap-2 ${i < 2 ? 'flex-1' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                wizardStep > s ? 'bg-green-500 text-white' : wizardStep === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>{wizardStep > s ? '✓' : s}</div>
              {i < 2 && <div className={`flex-1 h-0.5 ${wizardStep > s ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}

        {/* ── Step 1: Details ── */}
        {wizardStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">שלב 1: פרטי הקמפיין</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">שם הקמפיין</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: הדרכת הגנת פרטיות 2025"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">בחר לומדה (מפורסמת)</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm">
                <option value="">בחר לומדה...</option>
                {publishedCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {coursesData && publishedCourses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">אין לומדות מפורסמות. <a href="/courses" className="underline">פרסם לומדה תחילה.</a></p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תאריך יעד להשלמה</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ציון עובר (%)</label>
              <input type="number" min={0} max={100} value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <button onClick={createCampaign} disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'שומר...' : 'הבא: הוסף נמענים →'}
            </button>
          </div>
        )}

        {/* ── Step 2: Recipients ── */}
        {wizardStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">שלב 2: בחר נמענים</h2>

            {/* User picker from DB */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">עובדים במערכת</label>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll} className="text-blue-600 hover:underline">בחר הכל</button>
                  <button onClick={clearAll} className="text-gray-400 hover:underline">נקה</button>
                </div>
              </div>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="חיפוש לפי שם או מייל..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2"
              />
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {filteredUsers.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">אין תוצאות</p>
                )}
                {filteredUsers.map((u) => {
                  const checked = selectedEmails.has(u.email);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                        checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(u.email)}
                        className="rounded accent-blue-600 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedEmails.size > 0 && (
                <p className="text-xs text-blue-600 mt-1">{selectedEmails.size} נבחרו</p>
              )}
            </div>

            {/* Manual email input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                מיילים נוספים (שאינם במערכת) — כל שורה / פסיק
              </label>
              <textarea
                rows={3}
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                placeholder="external@company.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono resize-none"
              />
            </div>

            <button onClick={addRecipients} disabled={addingRecipients}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {addingRecipients ? 'מוסיף...' : 'הבא: שלח קמפיין →'}
            </button>
          </div>
        )}

        {/* ── Step 3: Send ── */}
        {wizardStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-center">
            <h2 className="text-sm font-semibold text-slate-700">שלב 3: שלח מיילים</h2>
            <p className="text-sm text-gray-500">{recipientMsg}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ לא ניתן לבטל שליחה. ודא שהפרטים נכונים.
            </div>
            <button onClick={sendCampaign} disabled={saving}
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? 'שולח...' : '📨 שלח קמפיין'}
            </button>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {wizardStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-bold text-slate-900">הקמפיין נשלח!</h2>
            <p className="text-sm text-gray-600">{recipientMsg}</p>
            <div className="flex flex-col gap-2">
              <a href={`/dashboard/campaigns/${campaignId}`}
                className="block w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                צפה בניתוח הקמפיין
              </a>
              <a href="/dashboard/campaigns"
                className="block w-full py-3 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">
                חזרה לקמפיינים
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
