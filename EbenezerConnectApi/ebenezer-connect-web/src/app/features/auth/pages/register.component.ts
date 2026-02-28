import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="header">
          <h1>Criar Conta</h1>
          <p>Preencha os dados para se cadastrar</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label for="nome">Nome Completo</label>
            <input 
              type="text" 
              id="nome" 
              formControlName="nome" 
              class="form-control"
              [class.is-invalid]="isFieldInvalid('nome')"
              placeholder="João Silva"
            />
            <div class="invalid-feedback" *ngIf="isFieldInvalid('nome')">Nome é obrigatório</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cpf">CPF</label>
              <input 
                type="text" 
                id="cpf" 
                formControlName="cpf" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('cpf')"
                placeholder="00000000000"
                maxlength="11"
              />
              <div class="invalid-feedback" *ngIf="isFieldInvalid('cpf')">CPF é obrigatório (apenas números)</div>
            </div>

            <div class="form-group">
              <label for="funcao">Função</label>
              <select 
                id="funcao" 
                formControlName="funcao" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('funcao')"
              >
                <option value="">Selecione...</option>
                <option value="acampante">Acampante</option>
                <option value="conselheiro">Conselheiro</option>
                <option value="admin">Administrador</option>
              </select>
              <div class="invalid-feedback" *ngIf="isFieldInvalid('funcao')">Função é obrigatória</div>
            </div>
          </div>

          <div class="form-group">
            <label for="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control"
              [class.is-invalid]="isFieldInvalid('email')"
              placeholder="seu@email.com"
            />
            <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">E-mail é obrigatório</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">E-mail inválido</span>
            </div>
          </div>

          <div class="form-group">
            <label for="igreja">Igreja (opcional)</label>
            <input 
              type="text" 
              id="igreja" 
              formControlName="igreja" 
              class="form-control"
              placeholder="Igreja..."
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="senha">Senha</label>
              <input 
                type="password" 
                id="senha" 
                formControlName="senha" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('senha')"
                placeholder="••••••••"
              />
              <div class="invalid-feedback" *ngIf="isFieldInvalid('senha')">
                <span *ngIf="registerForm.get('senha')?.errors?.['required']">Senha é obrigatória</span>
                <span *ngIf="registerForm.get('senha')?.errors?.['minlength']">Senha deve ter no mínimo 6 caracteres</span>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmarSenha">Confirmar Senha</label>
              <input 
                type="password" 
                id="confirmarSenha" 
                formControlName="confirmarSenha" 
                class="form-control"
                [class.is-invalid]="isFieldInvalid('confirmarSenha')"
                placeholder="••••••••"
              />
              <div class="invalid-feedback" *ngIf="isFieldInvalid('confirmarSenha')">
                <span *ngIf="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmarSenha')?.touched">
                  As senhas não coincidem
                </span>
              </div>
            </div>
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || loading">
            <span *ngIf="!loading">Cadastrar</span>
            <span *ngIf="loading">Cadastrando...</span>
          </button>

          <div class="links">
            <span>Já tem uma conta?</span>
            <a routerLink="/auth/login">Faça login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      email: ['', [Validators.required, Validators.email]],
      funcao: ['', Validators.required],
      igreja: [''],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const senha = form.get('senha');
    const confirmarSenha = form.get('confirmarSenha');
    
    if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Erro ao cadastrar. Tente novamente.';
      }
    });
  }
}
