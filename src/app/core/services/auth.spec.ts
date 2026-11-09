import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService, Auth } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([{ path: 'login', component: class {} }]),
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose userToken, userData, isAuthenticated, and userId signals', () => {
    expect(service.userToken).toBeDefined();
    expect(service.userData).toBeDefined();
    expect(service.isAuthenticated).toBeDefined();
    expect(service.userId).toBeDefined();
    expect(service.userId()).toBe('');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should support Auth alias injection', () => {
    const legacyService = TestBed.inject(Auth);
    expect(legacyService).toBe(service);
  });

  it('should update signals when saving and clearing token', () => {
    // Generate a valid base64 payload for testing: { id: "12345", name: "Test User", role: "user" }
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({ id: '12345', name: 'Test User', role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 })
    );
    const fakeToken = `${header}.${payload}.signature`;

    service.saveToken(fakeToken);

    expect(service.userToken()).toBe(fakeToken);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userId()).toBe('12345');
    expect(service.userData()?.name).toBe('Test User');

    service.logout();
    expect(service.userToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.userId()).toBe('');
    expect(service.userData()).toBeNull();
  });
});
