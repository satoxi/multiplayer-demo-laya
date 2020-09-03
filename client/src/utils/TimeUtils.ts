namespace Muse {
  export class TimeUtils {
    public static isBeforeToday(
      timestamp: number,
      nowTimestamp: number
    ): boolean {
      let result = false;
      if (timestamp === -1) {
        result = true;
      } else {
        const date = new Date(timestamp);
        const now = new Date(nowTimestamp);
        if (
          date.getFullYear() < now.getFullYear() ||
          (date.getFullYear() === now.getFullYear() &&
            date.getMonth() < now.getMonth()) ||
          (date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() < now.getDate())
        ) {
          result = true;
        }
      }

      return result;
    }

    public static isAfterToday(
      timestamp: number,
      nowTimestamp: number
    ): boolean {
      let result = false;
      if (timestamp === -1) {
        result = true;
      } else {
        const date = new Date(timestamp);
        const now = new Date(nowTimestamp);
        if (
          date.getFullYear() > now.getFullYear() ||
          (date.getFullYear() === now.getFullYear() &&
            date.getMonth() > now.getMonth()) ||
          (date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() > now.getDate())
        ) {
          result = true;
        }
      }

      return result;
    }
  }
}
