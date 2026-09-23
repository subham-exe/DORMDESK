export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class DemoClock implements Clock {
  private currentTime: Date;

  constructor(initialDate: Date = new Date()) {
    this.currentTime = initialDate;
  }

  now(): Date {
    // Return a clone to prevent external manipulation of internal state
    return new Date(this.currentTime.getTime());
  }

  set(date: Date) {
    this.currentTime = date;
  }

  advanceBy(ms: number) {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }
}
