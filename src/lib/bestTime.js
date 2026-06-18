// Best posting-time recommendation based on LinkedIn 2026 engagement research.
// Tue-Thu are highest-reach days; mornings (8-9) and evenings (5-6) IST peak
// for an Indian developer audience.

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getBestTime(date = new Date()) {
  const day = date.getDay();
  const dayName = DAYS[day];

  // reach tier per day of week
  const highReach = [2, 3, 4]; // Tue, Wed, Thu
  const midReach = [1, 5]; // Mon, Fri

  let tier, note;
  if (highReach.includes(day)) {
    tier = "high";
    note = `${dayName} is a peak reach day — great choice.`;
  } else if (midReach.includes(day)) {
    tier = "medium";
    note = `${dayName} gets solid reach. Tue–Thu peak if you can shift.`;
  } else {
    tier = "low";
    note = `${dayName} is quieter. Keep the streak, but Tue–Thu reach more.`;
  }

  return {
    dayName,
    tier,
    note,
    slot: "8:00–9:00 AM IST",
    altSlot: "5:00–6:00 PM IST",
    recommendedTime: "08:30",
  };
}

export function tierColor(tier) {
  return {
    high: "text-green-700 bg-green-50",
    medium: "text-amber-700 bg-amber-50",
    low: "text-gray-600 bg-gray-100",
  }[tier];
}
