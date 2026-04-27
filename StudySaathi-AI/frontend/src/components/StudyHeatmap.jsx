/**
 * StudyHeatmap Component
 * Calendar-style heatmap showing study intensity (streak days) over the last 5 months.
 */

const StudyHeatmap = ({ streakHistory }) => {
  // Defensive: streakHistory might be a number, null, or undefined from the API
  const safeHistory = Array.isArray(streakHistory) ? streakHistory : [];

  // Build a Set of date strings that have study activity
  const studiedDates = new Set(
    safeHistory
      .filter(h => h && typeof h.date === 'string')
      .map(h => h.date)
  );

  // Generate last 140 days (20 weeks)
  const today = new Date();
  const days = [];
  for (let i = 139; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      day: d.getDay(), // 0=Sun
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      studied: studiedDates.has(dateStr),
      isToday: i === 0,
    });
  }

  // Group by week
  const weeks = [];
  let currentWeek = new Array(days[0].day).fill(null); // padding
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const totalStudied = days.filter(d => d.studied).length;
  const currentStreak = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].studied) streak++;
      else break;
    }
    return streak;
  })();

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            📅 Study Heatmap
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">Last 20 weeks of activity</p>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">{totalStudied}</div>
            <div className="text-xs text-gray-400">days studied</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-500">{currentStreak}🔥</div>
            <div className="text-xs text-gray-400">current streak</div>
          </div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels column */}
          <div className="flex flex-col gap-1 mr-1">
            <div className="h-3" /> {/* spacer for month labels */}
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-3 w-3 text-[9px] text-gray-400 flex items-center">{i % 2 === 1 ? d : ''}</div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {/* Month label (show on 1st of month) */}
              <div className="h-3 text-[9px] text-gray-400 leading-3">
                {week.find(d => d && d.date.endsWith('-01'))
                  ? new Date(week.find(d => d && d.date.endsWith('-01')).date)
                      .toLocaleDateString('en-IN', { month: 'short' })
                  : ''}
              </div>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day.label}${day.studied ? ' ✓ Studied' : ''}` : ''}
                  className={`w-3 h-3 rounded-sm transition-all ${
                    !day
                      ? 'opacity-0'
                      : day.isToday
                      ? 'ring-1 ring-purple-500 ' + (day.studied ? 'bg-purple-600' : 'bg-purple-100')
                      : day.studied
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-gray-400">Less</span>
        {['bg-gray-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-600'].map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  );
};

export default StudyHeatmap;
