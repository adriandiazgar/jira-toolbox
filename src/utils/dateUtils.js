/**
 * Calculates the number of weekdays (Monday-Friday) between two dates.
 * @param {string} startDate - The start date in 'YYYY-MM-DD' format.
 * @param {string} endDate - The end date in 'YYYY-MM-DD' format.
 * @returns {number} The total number of weekdays.
 */
export function calculateWeekdays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  let start = new Date(startDate);
  let end = new Date(endDate);
  
  // Adjust for timezone offset to prevent off-by-one errors
  start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
  end.setMinutes(end.getMinutes() + end.getTimezoneOffset());

  let count = 0;
  const curDate = new Date(start.getTime());

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

/**
 * Calculates the number of business days from a given start date to today.
 * @param {string} startDate - The start date in 'YYYY-MM-DD' or ISO format.
 * @returns {number} The total number of business days.
 */
export function calculateBusinessDaysSince(startDate) {
    if (!startDate) return 0;

    let start = new Date(startDate);
    let now = new Date();
    let count = 0;
    const curDate = new Date(start.getTime());

    // Normalize dates to avoid time-of-day issues
    curDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    while (curDate <= now) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}
