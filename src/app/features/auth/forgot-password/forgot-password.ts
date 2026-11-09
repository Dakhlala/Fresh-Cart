import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Step 1: Email Form
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Step 2: Code Verification Form
  codeForm = this.fb.group({
    resetCode: ['', [Validators.required, Validators.minLength(4)]],
  });

  // Step 3: New Password Form
  resetForm = this.fb.group({
    newPassword: [
      '',
      [Validators.required, Validators.pattern(/^[A-Z][a-zA-Z0-9]{5,20}$/)],
    ],
  });

  userEmail = '';

  onSendCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const email = this.emailForm.get('email')?.value ?? '';
    this.userEmail = email;

    this.auth.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success(res.message || 'Reset code sent to your email!');
        this.currentStep.set(2);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Failed to send reset code. Please verify your email.'
        );
      },
    });
  }

  onVerifyCode(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const resetCode = this.codeForm.get('resetCode')?.value ?? '';

    this.auth.verifyResetCode({ resetCode }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success('Code verified successfully!');
        this.currentStep.set(3);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Invalid or expired reset code. Please try again.'
        );
      },
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const newPassword = this.resetForm.get('newPassword')?.value ?? '';

    this.auth
      .resetPassword({
        email: this.userEmail,
        newPassword,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.toast.success('Password updated successfully! Welcome back.');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Failed to update password. Please try again.'
          );
        },
      });
  }
}
