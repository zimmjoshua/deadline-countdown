import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DeadlineCountdown } from './deadline-countdown';
import { DEADLINE_URL } from './deadline.service';

describe('DeadlineCountdown', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('displays the seconds returned by /api/deadline', () => {
    const fixture = TestBed.createComponent(DeadlineCountdown);
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: 12 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('Seconds left to deadline: 12');
    fixture.destroy();
  });

  it('keeps the sentence on screen when zero seconds remain', () => {
    const fixture = TestBed.createComponent(DeadlineCountdown);
    http.expectOne(DEADLINE_URL).flush({ secondsLeft: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('Seconds left to deadline: 0');
    fixture.destroy();
  });
});
