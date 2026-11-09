import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  shareAppLink(event: Event, emailInput: HTMLInputElement): void {
    event.preventDefault();
    if (emailInput.value && emailInput.value.trim()) {
      alert(`Link sent to ${emailInput.value.trim()}! Check your phone.`);
      emailInput.value = '';
    }
  }
}
