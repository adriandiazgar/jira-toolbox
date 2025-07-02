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
