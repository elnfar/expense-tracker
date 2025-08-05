import Logger from './Logger';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateFormatOptions {
  includeTime?: boolean;
  timezone?: string;
  locale?: string;
}

export class DateUtils {
  // ISO string validation and parsing
  static isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const isValid =
        !isNaN(date.getTime()) && dateString === date.toISOString();

      if (!isValid) {
        Logger.debug(`Invalid ISO date string: ${dateString}`);
      }

      return isValid;
    } catch (error) {
      Logger.debug(`Error validating ISO date string: ${dateString}`, {
        error,
      });
      return false;
    }
  }

  static parseISOString(dateString: string): Date {
    if (!DateUtils.isValidISOString(dateString)) {
      Logger.warn(`Attempted to parse invalid ISO date string: ${dateString}`);
      throw new Error(`Invalid ISO date string: ${dateString}`);
    }

    const date = new Date(dateString);
    Logger.debug(
      `Parsed ISO date string: ${dateString} -> ${date.toISOString()}`
    );
    return date;
  }

  // Date range validation
  static isValidDateRange(
    startDate: string | Date,
    endDate: string | Date
  ): boolean {
    try {
      const start =
        typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

      const isValid = start <= end;

      if (!isValid) {
        Logger.debug(
          `Invalid date range: ${start.toISOString()} to ${end.toISOString()}`
        );
      }

      return isValid;
    } catch (error) {
      Logger.debug('Error validating date range', {
        startDate,
        endDate,
        error,
      });
      return false;
    }
  }

  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date
  ): DateRange {
    const start =
      typeof startDate === 'string'
        ? DateUtils.parseISOString(startDate)
        : startDate;
    const end =
      typeof endDate === 'string' ? DateUtils.parseISOString(endDate) : endDate;

    if (!DateUtils.isValidDateRange(start, end)) {
      Logger.warn(
        `Invalid date range provided: ${start.toISOString()} to ${end.toISOString()}`
      );
      throw new Error('Start date must be before or equal to end date');
    }

    Logger.debug(
      `Validated date range: ${start.toISOString()} to ${end.toISOString()}`
    );
    return { start, end };
  }

  // Date formatting utilities
  static formatDate(date: Date, options: DateFormatOptions = {}): string {
    const { includeTime = false, timezone = 'UTC', locale = 'en-US' } = options;

    try {
      const formatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      };

      if (includeTime) {
        formatOptions.hour = '2-digit';
        formatOptions.minute = '2-digit';
        formatOptions.second = '2-digit';
      }

      const formatted = new Intl.DateTimeFormat(locale, formatOptions).format(
        date
      );
      Logger.debug(`Formatted date: ${date.toISOString()} -> ${formatted}`);
      return formatted;
    } catch (error) {
      Logger.error('Error formatting date', { date, options, error });
      throw new Error(`Failed to format date: ${error}`);
    }
  }

  // Expense-specific date utilities
  static getExpenseDateRange(days: number): DateRange {
    Logger.debug(`Generating expense date range for last ${days} days`);

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const range = { start, end };
    Logger.debug(
      `Generated date range: ${start.toISOString()} to ${end.toISOString()}`
    );
    return range;
  }

  static isExpenseDateRecent(expenseDate: Date, days: number = 30): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const isRecent = expenseDate >= cutoffDate;
    Logger.debug(
      `Expense date ${expenseDate.toISOString()} is ${isRecent ? 'recent' : 'old'} (within ${days} days)`
    );
    return isRecent;
  }

  // Current timestamp utilities
  static getCurrentTimestamp(): Date {
    const now = new Date();
    Logger.debug(`Generated current timestamp: ${now.toISOString()}`);
    return now;
  }

  static getCurrentISOString(): string {
    const isoString = new Date().toISOString();
    Logger.debug(`Generated current ISO string: ${isoString}`);
    return isoString;
  }

  // Date comparison utilities
  static isSameDay(date1: Date, date2: Date): boolean {
    const same = date1.toDateString() === date2.toDateString();
    Logger.debug(
      `Comparing dates: ${date1.toDateString()} === ${date2.toDateString()} -> ${same}`
    );
    return same;
  }

  static daysBetween(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.floor(
      (endDate.getTime() - startDate.getTime()) / msPerDay
    );
    Logger.debug(
      `Days between ${startDate.toISOString()} and ${endDate.toISOString()}: ${days}`
    );
    return days;
  }

  // Date manipulation utilities
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    Logger.debug(
      `Added ${days} days to ${date.toISOString()}: ${result.toISOString()}`
    );
    return result;
  }

  static subtractDays(date: Date, days: number): Date {
    return DateUtils.addDays(date, -days);
  }

  static startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    Logger.debug(
      `Start of day for ${date.toISOString()}: ${start.toISOString()}`
    );
    return start;
  }

  static endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    Logger.debug(`End of day for ${date.toISOString()}: ${end.toISOString()}`);
    return end;
  }

  // Period utilities for expense reporting
  static getCurrentMonth(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    Logger.debug(
      `Current month range: ${start.toISOString()} to ${end.toISOString()}`
    );
    return { start, end };
  }

  static getCurrentYear(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    Logger.debug(
      `Current year range: ${start.toISOString()} to ${end.toISOString()}`
    );
    return { start, end };
  }

  // Timezone utilities
  static convertToTimezone(date: Date, timezone: string): Date {
    try {
      const converted = new Date(
        date.toLocaleString('en-US', { timeZone: timezone })
      );
      Logger.debug(
        `Converted ${date.toISOString()} to ${timezone}: ${converted.toISOString()}`
      );
      return converted;
    } catch (error) {
      Logger.error(`Error converting date to timezone ${timezone}`, {
        date,
        error,
      });
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  }
}

// Export both the class and individual utility functions for convenience
export const dateUtils = DateUtils;

// Export commonly used functions
export const {
  isValidISOString,
  parseISOString,
  isValidDateRange,
  validateDateRange,
  formatDate,
  getExpenseDateRange,
  isExpenseDateRecent,
  getCurrentTimestamp,
  getCurrentISOString,
  isSameDay,
  daysBetween,
  addDays,
  subtractDays,
  startOfDay,
  endOfDay,
  getCurrentMonth,
  getCurrentYear,
  convertToTimezone,
} = DateUtils;
