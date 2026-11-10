import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEADLINE_URL, DeadlineService } from './deadline.service';

describe('DeadlineService', () => {
  let service: DeadlineService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeadlineService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.disconnect();
    http.verify();
    vi.useRealTimers();
  });

  it('fetches the deadline once and counts down from that absolute time', () => {
    service.connect();
    service.connect();
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: 10 });
    expect(service.secondsLeft()).toBe(10);

    vi.advanceTimersByTime(1000);
    expect(service.secondsLeft()).toBe(9);

    service.disconnect();
    vi.advanceTimersByTime(1000);
    expect(service.secondsLeft()).toBe(8);

    service.disconnect();
    vi.advanceTimersByTime(3000);
    expect(service.secondsLeft()).toBe(8);

    service.connect();
    http.expectNone(DEADLINE_URL);
    expect(service.secondsLeft()).toBe(5);
  });

  it('shows zero and stops when the deadline has already passed', () => {
    service.connect();
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: -4 });
    expect(service.secondsLeft()).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(service.secondsLeft()).toBe(0);
  });

  it('corrects the displayed second when the tab becomes visible', () => {
    service.connect();
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: 10 });

    vi.setSystemTime(new Date('2026-06-01T12:00:02.500Z'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.secondsLeft()).toBe(8);
  });

  it('reports an invalid payload without starting the countdown', () => {
    service.connect();
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: Number.POSITIVE_INFINITY });
    expect(service.secondsLeft()).toBeNull();
    expect(service.error()).toBe('The deadline response was invalid.');
  });

  it('retries after a failed request when a consumer connects again', () => {
    service.connect();
    http.expectOne(DEADLINE_URL).flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBe('Unable to load the deadline.');

    service.disconnect();
    service.connect();
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: 3 });
    expect(service.secondsLeft()).toBe(3);
    expect(service.error()).toBeNull();
  });
});
