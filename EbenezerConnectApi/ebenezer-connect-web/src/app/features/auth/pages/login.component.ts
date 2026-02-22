import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <h1>Ebenezer Connect</h1>
          <p>Sistema de Gerenciamento</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="seu@email.com"
            />
            <div class="invalid-feedback" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">E-mail é obrigatório</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">E-mail inválido</span>
            </div>
          </div>

          <div class="form-group">
            <label for="senha">Senha</label>
            <input
              type="password"
              id="senha"
              formControlName="senha"
              class="form-control"
              [class.is-invalid]="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched"
              placeholder="••••••••"
            />
            <div class="invalid-feedback" *ngIf="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched">
              Senha é obrigatória
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || loading">
            <span *ngIf="!loading">Entrar</span>
            <span *ngIf="loading">Entrando...</span>
          </button>

          <div class="links">
            <a routerLink="/auth/register">Criar conta</a>
            <a routerLink="/auth/esqueci-senha">Esqueci minha senha</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
      }
    });
  }
}
