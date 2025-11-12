"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsWithinOperatorValue = exports.DefaultOperatorValue = void 0;
var DefaultOperatorValue;
(function (DefaultOperatorValue) {
    DefaultOperatorValue["TODAY"] = "today";
    DefaultOperatorValue["TOMORROW"] = "tomorrow";
    DefaultOperatorValue["YESTERDAY"] = "yesterday";
    DefaultOperatorValue["ONE_WEEK_AGO"] = "oneWeekAgo";
    DefaultOperatorValue["ONE_WEEK_FROM_NOW"] = "oneWeekFromNow";
    DefaultOperatorValue["ONE_MONTH_AGO"] = "oneMonthAgo";
    DefaultOperatorValue["ONE_MONTH_FROM_NOW"] = "oneMonthFromNow";
    DefaultOperatorValue["DAYS_AGO"] = "daysAgo";
    DefaultOperatorValue["DAYS_FROM_NOW"] = "daysFromNow";
    DefaultOperatorValue["EXACT_DAY"] = "exactDay";
    DefaultOperatorValue["EXACT_TIMESTAMP"] = "exactTimestamp";
})(DefaultOperatorValue || (exports.DefaultOperatorValue = DefaultOperatorValue = {}));
var IsWithinOperatorValue;
(function (IsWithinOperatorValue) {
    IsWithinOperatorValue["PAST_WEEK"] = "pastWeek";
    IsWithinOperatorValue["PAST_MONTH"] = "pastMonth";
    IsWithinOperatorValue["PAST_YEAR"] = "pastYear";
    IsWithinOperatorValue["NEXT_WEEK"] = "nextWeek";
    IsWithinOperatorValue["NEXT_MONTH"] = "nextMonth";
    IsWithinOperatorValue["NEXT_YEAR"] = "nextYear";
    IsWithinOperatorValue["DAYS_FROM_NOW"] = "daysFromNow";
    IsWithinOperatorValue["DAYS_AGO"] = "daysAgo";
    IsWithinOperatorValue["CURRENT_WEEK"] = "currentWeek";
    IsWithinOperatorValue["CURRENT_MONTH"] = "currentMonth";
    IsWithinOperatorValue["CURRENT_YEAR"] = "currentYear";
})(IsWithinOperatorValue || (exports.IsWithinOperatorValue = IsWithinOperatorValue = {}));
//# sourceMappingURL=date-filters.js.map