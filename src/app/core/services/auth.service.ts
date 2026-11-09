import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  DecodedUser,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyResetCodePayload,
} from '../models/auth-model';
import { decodeJwt } from '../utils/jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.baseUrl}/api/v1/auth/`;

  // --- Signal State ---
  readonly userToken = signal<string | null>(this.getInitialToken());
  readonly userData = signal<DecodedUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.userToken());
  readonly userId = computed(() => this.userData()?.id ?? '');

  // --- Backward Compatibility Aliases ---
  readonly currentUser = this.userData;
  readonly isLoggedIn = this.isAuthenticated;

  constructor() {
    this.restoreUserSession();
  }

  private getInitialToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userToken');
    }
    return null;
  }

  private restoreUserSession(): void {
    const token = this.userToken();
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
        this.userData.set(decoded);
      } else {
        this.logout();
      }
    }
  }

  // --- Canonical API Methods ---
  signup(payload: RegisterPayload): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${this.baseUrl}signup`, payload);
  }

  signin(payload: LoginPayload): Observable<AuthResponse> {
    return this.httpClient
      .post<AuthResponse>(`${this.baseUrl}signin`, payload)
      .pipe(
        tap((res) => {
          if (res.token) {
            this.saveToken(res.token);
          }
        })
      );
  }

  forgotPasswords(payload: ForgotPasswordPayload): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}forgotPasswords`, payload);
  }

  verifyResetCode(payload: VerifyResetCodePayload): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}verifyResetCode`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<AuthResponse> {
    return this.httpClient
      .put<AuthResponse>(`${this.baseUrl}resetPassword`, payload)
      .pipe(
        tap((res) => {
          if (res.token) {
            this.saveToken(res.token);
          }
        })
      );
  }

  // --- Compatibility Aliases for Existing UI Components ---
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.signup(payload);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.signin(payload);
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<any> {
    return this.forgotPasswords(payload);
  }

  // --- Token Lifecycle Management ---
  saveToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userToken', token);
    }
    this.userToken.set(token);
    const decoded = decodeJwt(token);
    this.userData.set(decoded);
  }

  getToken(): string | null {
    return this.userToken();
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userToken');
    }
    this.userToken.set(null);
    this.userData.set(null);
    this.router.navigate(['/login']);
  }
}

// Re-export alias for legacy imports expecting `Auth`
export { AuthService as Auth };
