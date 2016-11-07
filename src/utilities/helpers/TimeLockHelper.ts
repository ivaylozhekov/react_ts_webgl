export class TimeLockHelper {

  public static reduceTimeLockData(timeLockDataAPI) {
    return timeLockDataAPI.reduce((a, b) => {
      a[b.projectId] = this.reduceTimeLockDataForProject(b.timeLocks);
      return a;
    }, {});
  };

  private static reduceTimeLockDataForProject(timeLocks) {
    return timeLocks.reduce((a, b) => {
      a[b.date] = b.locked;
      return a;
    }, {});
  };
}
