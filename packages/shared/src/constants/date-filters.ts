export enum DefaultOperatorValue {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  YESTERDAY = 'yesterday',
  ONE_WEEK_AGO = 'oneWeekAgo',
  ONE_WEEK_FROM_NOW = 'oneWeekFromNow',
  ONE_MONTH_AGO = 'oneMonthAgo',
  ONE_MONTH_FROM_NOW = 'oneMonthFromNow',
  DAYS_AGO = 'daysAgo',
  DAYS_FROM_NOW = 'daysFromNow',
  EXACT_DAY = 'exactDay',
  EXACT_TIMESTAMP = 'exactTimestamp',
}

export enum IsWithinOperatorValue {
  PAST_WEEK = 'pastWeek',
  PAST_MONTH = 'pastMonth',
  PAST_YEAR = 'pastYear',
  NEXT_WEEK = 'nextWeek',
  NEXT_MONTH = 'nextMonth',
  NEXT_YEAR = 'nextYear',
  DAYS_FROM_NOW = 'daysFromNow',
  DAYS_AGO = 'daysAgo',
  CURRENT_WEEK = 'currentWeek',
  CURRENT_MONTH = 'currentMonth',
  CURRENT_YEAR = 'currentYear',
}
