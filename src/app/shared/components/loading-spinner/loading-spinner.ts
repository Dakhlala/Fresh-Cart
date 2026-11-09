import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinnerComponent {
  readonly loadingService = inject(LoadingService);
}
