import { Component } from '@angular/core';

import { DeadlineCountdown } from './deadline/deadline-countdown';

@Component({
  selector: 'app-root',
  imports: [DeadlineCountdown],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
