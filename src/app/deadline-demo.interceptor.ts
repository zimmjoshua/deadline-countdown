import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { DEADLINE_URL } from './deadline/deadline.service';

/** Stable for this page load so the preview counts down instead of resetting. */
const demoDeadlineMs = Date.now() + 90_000;

/**
 * Demo stand-in for GET /api/deadline. A real app should serve that endpoint
 * and leave this interceptor out of the providers.
 */
export const deadlineDemoInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url !== DEADLINE_URL) {
    return next(request);
  }
  const secondsLeft = Math.max(0, Math.ceil((demoDeadlineMs - Date.now()) / 1000));
  return of(new HttpResponse({ status: 200, body: { secondsLeft } }));
};
