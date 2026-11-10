import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';

import { DeadlineService } from './deadline.service';

@Component({
  selector: 'app-deadline-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deadline-countdown.html',
  styleUrl: './deadline-countdown.css',
})
export class DeadlineCountdown {
  private readonly deadline = inject(DeadlineService);

  protected readonly secondsLeft = this.deadline.secondsLeft;
  protected readonly error = this.deadline.error;

  constructor() {
    this.deadline.connect();
    inject(DestroyRef).onDestroy(() => this.deadline.disconnect());
  }
}
