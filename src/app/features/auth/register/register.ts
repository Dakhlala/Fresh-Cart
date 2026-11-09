import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly showRePassword = signal<boolean>(false);

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Z][a-zA-Z0-9]{5,20}$/),
        ],
      ],
      rePassword: ['', [Validators.required]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^01[0125]\d{8}$/)],
      ],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: this.confirmPassword }
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleRePasswordVisibility(): void {
    this.showRePassword.update((v) => !v);
  }

  getPasswordStrength(): { label: string; score: number; colorClass: string } {
    const val = this.registerForm.get('password')?.value || '';
    if (!val) {
      return { label: 'Empty', score: 0, colorClass: 'bg-gray-200' };
    }
    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (val.length >= 8) score++;

    if (score <= 1) {
      return { label: 'Weak', score: 1, colorClass: 'bg-red-500' };
    } else if (score <= 2) {
      return { label: 'Fair', score: 2, colorClass: 'bg-amber-500' };
    } else {
      return { label: 'Strong', score: 3, colorClass: 'bg-emerald-500' };
    }
  }

  confirmPassword(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const rePassword = control.get('rePassword')?.value;
    if (!password || !rePassword) return null;
    return password === rePassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { name, email, password, rePassword, phone } =
      this.registerForm.getRawValue();

    this.auth
      .register({
        name: name ?? '',
        email: email ?? '',
        password: password ?? '',
        rePassword: rePassword ?? '',
        phone: phone ?? '',
      })
      .subscribe({
        next: (value) => {
          this.isLoading.set(false);
          if (value.message === 'success') {
            this.toast.success('Account created successfully! Please sign in.');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMsg.set(
            err.error?.message ||
              'Registration failed. Please check your data and try again.'
          );
        },
      });
  }
}
