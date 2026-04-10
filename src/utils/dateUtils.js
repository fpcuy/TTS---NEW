function convertDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const match = dateStr.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/);
  if (match) {
    const [day, month, year, hour, minute] = dateStr.match(/\d+/g);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    return date.toISOString();
  }
  return dateStr;
}

module.exports = { convertDate };