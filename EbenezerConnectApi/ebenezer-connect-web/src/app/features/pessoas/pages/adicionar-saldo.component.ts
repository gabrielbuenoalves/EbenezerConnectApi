import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PessoaService } from '../../../core/services/pessoa.service';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { Pessoa, FinanceiroHistorico } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';

interface ResumoAdicaoSaldo {
  pessoaNome: string;
  saldoAtual: number;
  valorAdicionar: number;
  novoSaldo: number;
}

@Component({
  selector: 'app-adicionar-saldo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Adicionar Saldo"
      subtitle="Recarregue o saldo das pessoas cadastradas no sistema"
    />

    <div class="adicionar-saldo-container">
      <div class="card">
        <h3>Selecionar Pessoa</h3>
        
        <div class="search-filter">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterPessoas()"
            placeholder="Buscar por nome..." 
            class="form-control"
          />
          
          <select [(ngModel)]="funcaoFilter" (change)="filterPessoas()" class="form-control">
            <option value="">Todas as funções</option>
            <option value="acampante">Acampantes</option>
            <option value="conselheiro">Conselheiros</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div class="pessoas-list">
          <div 
            *ngFor="let pessoa of pessoasFiltradas; trackBy: trackByPessoaId" 
            class="pessoa-item"
            [class.selected]="pessoaSelecionada?.id === pessoa.id"
            (click)="selecionarPessoa(pessoa)"
          >
            <div class="pessoa-info">
              <strong>{{ pessoa.nome }}</strong>
              <span class="pessoa-funcao">{{ getFuncaoLabel(pessoa.funcao) }}</span>
            </div>
            <div class="pessoa-saldo" [class.negativo]="pessoa.saldo < 0">
              R$ {{ pessoa.saldo.toFixed(2) }}
            </div>
          </div>
          <div *ngIf="pessoasFiltradas.length === 0" class="empty-list">
            Nenhuma pessoa encontrada
          </div>
        </div>
      </div>

      <div class="card estorno-card" *ngIf="pessoaSelecionada">
        <h3>Estorno de Crédito</h3>

        <div *ngIf="creditosDaPessoa.length === 0" class="empty-list">
          Nenhum crédito ativo para estorno
        </div>

        <div class="creditos-list" *ngIf="creditosDaPessoa.length > 0">
          <div class="credito-item" *ngFor="let c of creditosDaPessoa">
            <div class="credito-info">
              <span class="credito-valor">+ R$ {{ c.valor.toFixed(2) }}</span>
              <span class="credito-data">{{ formatarData(c.data) }}</span>
            </div>
            <button class="btn-estorno" (click)="abrirModalEstorno(c)">Estornar</button>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="pessoaSelecionada">
        <h3>Adicionar Saldo</h3>
        
        <div class="pessoa-selecionada">
          <div class="info-row">
            <span class="label">Pessoa:</span>
            <span class="value">{{ pessoaSelecionada.nome }}</span>
          </div>
          <div class="info-row">
            <span class="label">Saldo Atual:</span>
            <span class="value" [class.negativo]="pessoaSelecionada.saldo < 0">
              R$ {{ pessoaSelecionada.saldo.toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Valor a Adicionar (R$)</label>
          <input 
            type="number" 
            [(ngModel)]="valorAdicionar" 
            min="0.01"
            step="0.01"
            placeholder="0.00" 
            class="form-control"
          />
        </div>

        <div class="novo-saldo" *ngIf="valorAdicionar > 0">
          <strong>Novo Saldo:</strong>
          <span [class.positivo]="(pessoaSelecionada.saldo + valorAdicionar) >= 0">
            R$ {{ (pessoaSelecionada.saldo + valorAdicionar).toFixed(2) }}
          </span>
        </div>

        <button 
          (click)="abrirModalConfirmacao()" 
          class="btn-primary" 
          [disabled]="!podeAdicionar()">
          Confirmar Adição
        </button>
      </div>
    </div>

    <div class="modal" *ngIf="modalAberta">
      <div class="modal-content">
        <h2>Confirmar Adição de Saldo</h2>
        <div *ngIf="resumoAdicao" class="resumo">
          <div class="resumo-item">
            <span class="label">Pessoa:</span>
            <span class="valor">{{ resumoAdicao.pessoaNome }}</span>
          </div>
          <div class="resumo-item">
            <span class="label">Saldo Atual:</span>
            <span class="valor" [class.negativo]="resumoAdicao.saldoAtual < 0">
              R$ {{ resumoAdicao.saldoAtual.toFixed(2) }}
            </span>
          </div>
          <div class="resumo-item destaque">
            <span class="label">Valor a Adicionar:</span>
            <span class="valor positivo">+ R$ {{ resumoAdicao.valorAdicionar.toFixed(2) }}</span>
          </div>
          <div class="resumo-total">
            <span class="label">Novo Saldo:</span>
            <span class="valor" [class.positivo]="resumoAdicao.novoSaldo >= 0" [class.negativo]="resumoAdicao.novoSaldo < 0">
              R$ {{ resumoAdicao.novoSaldo.toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="modal-actions">
          <button (click)="cancelarAdicao()" class="btn-secondary">Cancelar</button>
          <button (click)="confirmarAdicao()" class="btn-primary" [disabled]="processandoAdicao">
            {{ processandoAdicao ? 'Processando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal" *ngIf="modalEstornoAberta && creditoParaEstornar">
      <div class="modal-content">
        <h2>Confirmar Estorno</h2>
        <div class="resumo">
          <div class="resumo-item">
            <span class="label">Pessoa:</span>
            <span class="valor">{{ creditoParaEstornar!.pessoaNome }}</span>
          </div>
          <div class="resumo-item destaque">
            <span class="label">Valor a estornar:</span>
            <span class="valor negativo">- R$ {{ creditoParaEstornar!.valor.toFixed(2) }}</span>
          </div>
          <div class="resumo-item">
            <span class="label">Data do crédito:</span>
            <span class="valor">{{ formatarData(creditoParaEstornar!.data) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button (click)="modalEstornoAberta = false" class="btn-secondary">Cancelar</button>
          <button (click)="confirmarEstorno()" class="btn-danger-modal" [disabled]="processandoEstorno">
            {{ processandoEstorno ? 'Processando...' : 'Confirmar Estorno' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adicionar-saldo-container {
      display: flex;
      gap: 2rem;
      margin: 0;
      width: 100%;
    }

    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .card:first-child {
      flex: 1;
      min-width: 0;
    }

    .card:last-child {
      width: 350px;
    }

    .card h3 {
      margin: 0;
      padding: 1.5rem 1.5rem 1rem;
      color: #333;
      border-bottom: 1px solid #eee;
      font-size: 1.05rem;
      font-weight: 600;
    }

    .search-filter {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.95rem;
    }

    .pessoas-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .pessoa-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    }

    .pessoa-item:hover {
      background: #f5f5f5;
    }

    .pessoa-item.selected {
      background: #e8f5e9;
      border-left: 4px solid #4CAF50;
      padding-left: calc(1.5rem - 4px);
    }

    .pessoa-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .pessoa-info strong {
      font-size: 0.95rem;
      color: #333;
    }

    .pessoa-funcao {
      font-size: 0.8rem;
      color: #666;
      text-transform: capitalize;
    }

    .pessoa-saldo {
      font-weight: 600;
      color: #4CAF50;
      font-size: 0.95rem;
    }

    .pessoa-saldo.negativo {
      color: #f44336;
    }

    .empty-list {
      padding: 2rem 1.5rem;
      text-align: center;
      color: #999;
      font-size: 0.95rem;
    }

    .pessoa-selecionada {
      background: #f9f9f9;
      padding: 1rem 1.5rem;
      margin: 1rem 1.5rem 0;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.95rem;
    }

    .info-row .label {
      color: #666;
      font-weight: 500;
    }

    .info-row .value {
      font-weight: 600;
      color: #333;
    }

    .info-row .value.negativo {
      color: #f44336;
    }

    .form-group {
      margin: 0 1.5rem;
      padding: 1rem 0 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .novo-saldo {
      background: #e3f2fd;
      padding: 1rem 1.5rem;
      margin: 1rem 1.5rem;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
    }

    .novo-saldo strong {
      color: #1976d2;
    }

    .novo-saldo span {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1976d2;
    }

    .novo-saldo .positivo {
      color: #4CAF50;
    }

    .btn-primary {
      width: calc(100% - 3rem);
      margin: 1rem 1.5rem 1.5rem;
      padding: 0.5rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
      font-weight: 500;
    }

    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(2rem);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-content h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .resumo {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }

    .resumo-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
    }

    .resumo-item.destaque {
      padding: 0.75rem 0;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      margin: 0.5rem 0;
    }

    .resumo-item .label {
      color: #666;
      font-weight: 500;
    }

    .resumo-item .valor {
      font-weight: 600;
      color: #333;
    }

    .resumo-item .valor.positivo {
      color: #4CAF50;
    }

    .resumo-item .valor.negativo {
      color: #f44336;
    }

    .resumo-total {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      font-size: 1rem;
      background: #e3f2fd;
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 0.5rem;
    }

    .resumo-total .label {
      color: #1976d2;
      font-weight: 600;
    }

    .resumo-total .valor {
      font-weight: 700;
      color: #1976d2;
      font-size: 1.1rem;
    }

    .resumo-total .valor.positivo {
      color: #4CAF50;
    }

    .resumo-total .valor.negativo {
      color: #f44336;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-secondary {
      flex: 1;
      padding: 0.5rem;
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #d0d0d0;
    }

    .modal-actions .btn-primary {
      flex: 1;
      margin: 0;
      width: auto;
    }

    .estorno-card {
      width: 320px;
    }

    .creditos-list {
      padding: 0.5rem 0;
    }

    .credito-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .credito-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .credito-valor {
      font-weight: 600;
      color: #4CAF50;
      font-size: 0.95rem;
    }

    .credito-data {
      font-size: 0.78rem;
      color: #999;
    }

    .btn-estorno {
      padding: 0.35rem 0.75rem;
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ffb74d;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-estorno:hover {
      background: #ffe0b2;
    }

    .btn-danger-modal {
      flex: 1;
      padding: 0.5rem;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-danger-modal:hover:not(:disabled) {
      background: #d32f2f;
    }

    .btn-danger-modal:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .adicionar-saldo-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdicionarSaldoComponent implements OnInit {
  pessoas: Pessoa[] = [];
  pessoasFiltradas: Pessoa[] = [];
  pessoaSelecionada: Pessoa | null = null;
  valorAdicionar: number = 0;
  searchTerm: string = '';
  funcaoFilter: string = '';
  modalAberta: boolean = false;
  resumoAdicao: ResumoAdicaoSaldo | null = null;
  processandoAdicao: boolean = false;

  creditosDaPessoa: FinanceiroHistorico[] = [];
  creditoParaEstornar: FinanceiroHistorico | null = null;
  modalEstornoAberta: boolean = false;
  processandoEstorno: boolean = false;

  constructor(
    private pessoaService: PessoaService,
    private financeiroService: FinanceiroService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPessoas();
  }

  loadPessoas(): void {
    this.pessoaService.getAll().subscribe({
      next: (data) => {
        this.pessoas = data;
        this.filterPessoas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar pessoas:', err)
    });
  }

  filterPessoas(): void {
    this.pessoasFiltradas = this.pessoas.filter(pessoa => {
      const matchesSearch = pessoa.nome.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFuncao = !this.funcaoFilter || pessoa.funcao === this.funcaoFilter;
      return matchesSearch && matchesFuncao;
    });
  }

  selecionarPessoa(pessoa: Pessoa): void {
    this.pessoaSelecionada = pessoa;
    this.valorAdicionar = 0;
    this.carregarCreditosDaPessoa(pessoa.id);
  }

  carregarCreditosDaPessoa(pessoaId: number): void {
    this.financeiroService.getHistorico().subscribe({
      next: (historico) => {
        this.creditosDaPessoa = historico.filter(
          h => h.tipo === 'saldo' && h.pessoaId === pessoaId && !h.revertida
        );
        this.cdr.detectChanges();
      },
      error: () => { this.creditosDaPessoa = []; }
    });
  }

  abrirModalEstorno(credito: FinanceiroHistorico): void {
    this.creditoParaEstornar = credito;
    this.modalEstornoAberta = true;
  }

  confirmarEstorno(): void {
    if (!this.creditoParaEstornar) return;
    this.processandoEstorno = true;

    this.financeiroService.reverter({ id: this.creditoParaEstornar.id, tipo: 'saldo' }).subscribe({
      next: () => {
        alert(`Estorno de R$ ${this.creditoParaEstornar!.valor.toFixed(2)} realizado com sucesso!`);
        this.modalEstornoAberta = false;
        this.creditoParaEstornar = null;
        this.processandoEstorno = false;
        this.loadPessoas();
        if (this.pessoaSelecionada) this.carregarCreditosDaPessoa(this.pessoaSelecionada.id);
      },
      error: (err) => {
        this.processandoEstorno = false;
        const msg = err.error?.erro || err.message || 'Erro ao realizar estorno';
        alert(msg);
      }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  getFuncaoLabel(funcao: string): string {
    const labels: Record<string, string> = {
      'acampante': 'Acampante',
      'conselheiro': 'Conselheiro',
      'admin': 'Administrador'
    };
    return labels[funcao] || funcao;
  }

  podeAdicionar(): boolean {
    return !!(this.pessoaSelecionada && this.valorAdicionar > 0);
  }

  abrirModalConfirmacao(): void {
    if (!this.podeAdicionar() || !this.pessoaSelecionada) return;

    this.resumoAdicao = {
      pessoaNome: this.pessoaSelecionada.nome,
      saldoAtual: this.pessoaSelecionada.saldo,
      valorAdicionar: this.valorAdicionar,
      novoSaldo: this.pessoaSelecionada.saldo + this.valorAdicionar
    };

    this.modalAberta = true;
  }

  cancelarAdicao(): void {
    this.modalAberta = false;
    this.resumoAdicao = null;
  }

  confirmarAdicao(): void {
    if (!this.podeAdicionar() || !this.pessoaSelecionada) return;

    this.processandoAdicao = true;

    const dto = {
      pessoaId: this.pessoaSelecionada.id,
      valor: this.valorAdicionar
    };

    this.pessoaService.adicionarCredito(dto).subscribe({
      next: () => {
        alert(`Saldo de R$ ${this.valorAdicionar.toFixed(2)} adicionado com sucesso!`);
        this.processandoAdicao = false;
        this.modalAberta = false;
        this.resumoAdicao = null;
        this.valorAdicionar = 0;
        this.pessoaSelecionada = null;
        this.loadPessoas();
      },
      error: (err) => {
        this.processandoAdicao = false;
        let mensagemErro = 'Erro ao adicionar saldo';
        if (err.error && err.error.erro) {
          mensagemErro = err.error.erro;
        } else if (err.message) {
          mensagemErro = err.message;
        }
        alert(mensagemErro);
        console.error('Erro ao adicionar saldo:', err);
      }
    });
  }

  trackByPessoaId(index: number, pessoa: Pessoa): number {
    return pessoa.id;
  }
}
