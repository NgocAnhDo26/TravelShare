/**
 * Generate schedule array for the travel plan
 * @param startDate - Start date of the trip
 * @param endDate - End date of the trip
 * @returns Array of daily schedule objects
 */
export function generateSchedule(startDate: Date, endDate: Date) {
  const schedule = [];

  // Generate one day at a time
  const currentDate = new Date(startDate);
  let dayNumber = 1;

  while (currentDate <= endDate) {
    schedule.push({
      dayNumber,
      date: new Date(currentDate),
      items: [],
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    dayNumber++;
  }

  return schedule;
}
