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
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    const initialUser = this.getUserFromToken();
    this.currentUserSubject = new BehaviorSubject<User | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    console.log('[AuthService] Inicializado com usuário:', initialUser);
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
    console.log('[AuthService] setSession chamado com:', authResult);
    
    if (this.isBrowser) {
      localStorage.setItem('token', authResult.token);
      const user: User = {
        id: authResult.id,
        nome: authResult.nome,
        email: authResult.email,
        funcao: authResult.funcao
      };
      console.log('[AuthService] Salvando user no localStorage:', user);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      console.log('[AuthService] currentUserSubject atualizado:', user);
    }
  }

  private getUserFromToken(): User | null {
    if (!this.isBrowser) {
      console.log('[AuthService] getUserFromToken: não está em browser');
      return null;
    }
    const userStr = localStorage.getItem('user');
    console.log('[AuthService] getUserFromToken - userStr do localStorage:', userStr);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('[AuthService] getUserFromToken - user parseado:', user);
        return user;
      } catch (e) {
        console.error('[AuthService] Erro ao parsear user do localStorage:', e);
        return null;
      }
    }
    console.log('[AuthService] getUserFromToken - localStorage vazio');
    return null;
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
    const user = this.currentUserSubject.value;
    console.log('[AuthService] getCurrentUser() chamado, retornando:', user);
    return user;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const funcaoLower = user.funcao?.toLowerCase() || '';
    return funcaoLower === 'admin' || funcaoLower === 'administrador';
  }
}
