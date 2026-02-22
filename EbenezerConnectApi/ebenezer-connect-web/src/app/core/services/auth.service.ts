import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  confirmarEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/confirmar-email?token=${token}`);
  }

  redefinirSenha(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/redefinir-senha`, data);
  }

  private setSession(authResult: LoginResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('token', authResult.token);
      const user: User = {
        id: authResult.id,
        nome: authResult.nome,
        email: authResult.email,
        funcao: authResult.funcao
      };
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next({
      id: authResult.id,
      nome: authResult.nome,
      email: authResult.email,
      funcao: authResult.funcao
    });
  }

  private getUserFromToken(): User | null {
    if (!this.isBrowser) {
      return null;
    }
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.funcao === 'admin';
  }
}
