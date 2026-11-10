import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { millisUntilNextDisplayChange, secondsRemaining } from './countdown';

export const DEADLINE_URL = '/api/deadline';

export interface DeadlineResponse {
  secondsLeft: number;
}

@Injectable({ providedIn: 'root' })
export class DeadlineService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone, { optional: true });

  private readonly secondsLeftState = signal<number | null>(null);
  private readonly errorState = signal<string | null>(null);

  /** Whole seconds remaining. Null until the first successful response. */
  readonly secondsLeft = this.secondsLeftState.asReadonly();
  readonly error = this.errorState.asReadonly();

  private consumers = 0;
  private deadlineMs: number | null = null;
  private request: Subscription | null = null;
  private timerId: ReturnType<typeof setTimeout> | undefined;
  private removeVisibilityListener: (() => void) | null = null;

  /**
   * Show the countdown. Several components can connect at once; they share one
   * request and one timer.
   */
  connect(): void {
    this.consumers += 1;
    if (this.consumers > 1) {
      return;
    }
    this.watchVisibility();
    this.ensureLoaded();
  }

  /** Drop one consumer. The timer stops when the last consumer disconnects. */
  disconnect(): void {
    if (this.consumers === 0) {
      return;
    }
    this.consumers -= 1;
    if (this.consumers > 0) {
      return;
    }
    this.clearTimer();
    this.unwatchVisibility();
  }

  private ensureLoaded(): void {
    if (this.deadlineMs !== null) {
      this.publish();
      this.schedule();
      return;
    }
    if (this.request) {
      return;
    }

    this.request = this.http.get<DeadlineResponse>(DEADLINE_URL).subscribe({
      next: (body) => {
        this.request = null;
        const secondsLeft = body?.secondsLeft;
        if (typeof secondsLeft !== 'number' || !Number.isFinite(secondsLeft)) {
          this.errorState.set('The deadline response was invalid.');
          return;
        }
        // The payload is seconds remaining at the moment the response arrives.
        // The deadline never changes, so keep that absolute time and tick locally.
        this.deadlineMs = Date.now() + secondsLeft * 1000;
        this.errorState.set(null);
        if (this.consumers === 0) {
          return;
        }
        this.publish();
        this.schedule();
      },
      error: () => {
        this.request = null;
        this.errorState.set('Unable to load the deadline.');
      },
    });
  }

  private publish(): void {
    if (this.deadlineMs === null) {
      return;
    }
    this.secondsLeftState.set(secondsRemaining(this.deadlineMs, Date.now()));
  }

  private schedule(): void {
    this.clearTimer();
    if (!isPlatformBrowser(this.platformId) || this.consumers === 0 || this.deadlineMs === null) {
      return;
    }
    const now = Date.now();
    if (secondsRemaining(this.deadlineMs, now) <= 0) {
      return;
    }
    const delay = millisUntilNextDisplayChange(this.deadlineMs, now);
    // Outside NgZone, a zoned app does not change-detect the whole tree every
    // second. The signal update still refreshes this countdown. Zoneless apps
    // have no NgZone, and the signal update is enough there too.
    this.runOutsideAngular(() => {
      this.timerId = setTimeout(() => {
        this.timerId = undefined;
        this.publish();
        this.schedule();
      }, delay);
    });
  }

  private runOutsideAngular(work: () => void): void {
    if (this.ngZone) {
      this.ngZone.runOutsideAngular(work);
    } else {
      work();
    }
  }

  private clearTimer(): void {
    if (this.timerId !== undefined) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }

  private watchVisibility(): void {
    if (!isPlatformBrowser(this.platformId) || this.removeVisibilityListener) {
      return;
    }
    const onChange = () => {
      if (
        document.visibilityState !== 'visible' ||
        this.deadlineMs === null ||
        this.consumers === 0
      ) {
        return;
      }
      this.publish();
      this.schedule();
    };
    document.addEventListener('visibilitychange', onChange);
    this.removeVisibilityListener = () =>
      document.removeEventListener('visibilitychange', onChange);
  }

  private unwatchVisibility(): void {
    this.removeVisibilityListener?.();
    this.removeVisibilityListener = null;
  }
}
