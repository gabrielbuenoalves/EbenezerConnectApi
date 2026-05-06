import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ConsultaSaldoResponse {
  nome: string;
  saldo: number;
  quartoNome?: string;
}

@Component({
  selector: 'app-consultar-saldo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="consulta-container">
      <div class="consulta-card">
        <div class="logo-section">
          <h1>Ebenezer</h1>
          <p>Consulta de Saldo</p>
        </div>

        <div class="form-group">
          <label>Buscar por</label>
          <div class="tipo-busca">
            <button [class.active]="tipoBusca === 'cpf'" (click)="tipoBusca = 'cpf'; limpar()">
              CPF
            </button>
            <button [class.active]="tipoBusca === 'nome'" (click)="tipoBusca = 'nome'; limpar()">
              Nome
            </button>
          </div>
        </div>

        <div class="form-group">
          <input
            [(ngModel)]="termoBusca"
            [placeholder]="tipoBusca === 'cpf' ? 'Digite o CPF (apenas números)' : 'Digite o nome'"
            class="form-control"
            (keyup.enter)="consultar()"
          />
        </div>

        <button
          class="btn-primary"
          (click)="consultar()"
          [disabled]="loading || !termoBusca.trim()"
        >
          <span *ngIf="!loading">Consultar</span>
          <span *ngIf="loading">Consultando...</span>
        </button>

        <div class="error-message" *ngIf="erro">{{ erro }}</div>

        <div class="resultado" *ngIf="resultados.length > 0">
          <div class="resultado-item" *ngFor="let r of resultados">
            <div class="pessoa-nome">{{ r.nome }}</div>
            <div
              class="pessoa-saldo"
              [class.positivo]="r.saldo > 0"
              [class.zerado]="r.saldo === 0"
              [class.negativo]="r.saldo < 0"
            >
              {{ r.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </div>
            <div class="pessoa-quarto" *ngIf="r.quartoNome">Quarto: {{ r.quartoNome }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .consulta-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        padding: 1rem;
      }
      .consulta-card {
        background: #1e293b;
        border-radius: 12px;
        padding: 2rem;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      }
      .logo-section {
        text-align: center;
        margin-bottom: 2rem;
      }
      .logo-section h1 {
        color: #f8fafc;
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
      }
      .logo-section p {
        color: #94a3b8;
        margin: 0.25rem 0 0;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        color: #94a3b8;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      .tipo-busca {
        display: flex;
        gap: 0.5rem;
      }
      .tipo-busca button {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #334155;
        background: #0f172a;
        color: #94a3b8;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tipo-busca button.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: #fff;
      }
      .form-control {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #f8fafc;
        font-size: 1rem;
        box-sizing: border-box;
      }
      .form-control:focus {
        outline: none;
        border-color: #3b82f6;
      }
      .btn-primary {
        width: 100%;
        padding: 0.75rem;
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-top: 0.5rem;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .error-message {
        color: #f87171;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.875rem;
      }
      .resultado {
        margin-top: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .resultado-item {
        background: #0f172a;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #334155;
      }
      .pessoa-nome {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      .pessoa-saldo {
        font-size: 1.5rem;
        font-weight: 700;
      }
      .pessoa-saldo.positivo {
        color: #4ade80;
      }
      .pessoa-saldo.zerado {
        color: #94a3b8;
      }
      .pessoa-saldo.negativo {
        color: #f87171;
      }
      .pessoa-quarto {
        color: #64748b;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class ConsultarSaldoComponent {
  tipoBusca: 'cpf' | 'nome' = 'cpf';
  termoBusca = '';
  loading = false;
  erro = '';
  resultados: ConsultaSaldoResponse[] = [];

  private apiUrl = `${environment.apiUrl}/saldo/consultar`;

  constructor(private http: HttpClient) {}

  limpar() {
    this.termoBusca = '';
    this.erro = '';
    this.resultados = [];
  }

  consultar() {
    if (!this.termoBusca.trim()) return;
    this.loading = true;
    this.erro = '';
    this.resultados = [];

    const params = new HttpParams().set(this.tipoBusca, this.termoBusca.trim());

    this.http.get<unknown>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        const data = res as unknown;
        this.resultados = Array.isArray(data)
          ? (data as ConsultaSaldoResponse[])
          : [data as ConsultaSaldoResponse];
        if (this.resultados.length === 0) this.erro = 'Nenhum resultado encontrado.';
        this.loading = false;
      },
      error: (err) => {
        this.erro =
          err.status === 404 ? 'Pessoa não encontrada.' : 'Erro ao consultar. Tente novamente.';
        this.loading = false;
      },
    });
  }
}
