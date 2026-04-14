import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PessoaService } from '../../../core/services/pessoa.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Dashboard"
      subtitle="Bem-vindo ao sistema Ebenezer Connect"
    />

    <!-- Seção de Pessoas -->
    <div class="section">
      <div class="section-header">
        <h2>👥 Pessoas</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon acampantes">👥</div>
          <div class="stat-info">
            <h3>{{ stats.acampantes }}</h3>
            <p>Acampantes</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon conselheiros">🎯</div>
          <div class="stat-info">
            <h3>{{ stats.conselheiros }}</h3>
            <p>Conselheiros</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon total">👤</div>
          <div class="stat-info">
            <h3>{{ stats.acampantes + stats.conselheiros }}</h3>
            <p>Total de Pessoas</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção de Produtos e Estoque -->
    <div class="section">
      <div class="section-header">
        <h2>📦 Produtos e Estoque</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon produtos">📦</div>
          <div class="stat-info">
            <h3>{{ stats.produtos }}</h3>
            <p>Produtos Cadastrados</p>
          </div>
        </div>

        <div class="stat-card" [class.alert]="stats.produtosBaixoEstoque > 0">
          <div class="stat-icon estoque-baixo">⚠️</div>
          <div class="stat-info">
            <h3>{{ stats.produtosBaixoEstoque }}</h3>
            <p>Estoque Baixo</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção de Cantina e Financeiro -->
    <div class="section">
      <div class="section-header">
        <h2>💳 Cantina e Financeiro</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card" [class.alert]="stats.saldoDevedor > 0">
          <div class="stat-icon saldo-devedor">⚠️</div>
          <div class="stat-info">
            <h3>{{ stats.saldoDevedor | currency:'BRL' }}</h3>
            <p>Saldo Devedor</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon faturamento">💰</div>
          <div class="stat-info">
            <h3>{{ stats.faturamento | currency:'BRL' }}</h3>
            <p>Faturamento</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon vendas">🛒</div>
          <div class="stat-info">
            <h3>{{ stats.quantidadeVendas }}</h3>
            <p>Quantidade de Vendas</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon saldo-nao-utilizado">💵</div>
          <div class="stat-info">
            <h3>{{ stats.saldoNaoUtilizado | currency:'BRL' }}</h3>
            <p>Saldo Não Utilizado</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção de Ações Rápidas -->
    <div class="section">
      <div class="section-header">
        <h2>⚡ Ações Rápidas</h2>
      </div>
      <div class="actions-grid">
        <button class="action-card" routerLink="/pessoas">
          <span class="action-icon">👤</span>
          <div class="action-content">
            <h3>Gerenciar Pessoas</h3>
            <p>Cadastro e edição</p>
          </div>
        </button>
        <button class="action-card" routerLink="/produtos">
          <span class="action-icon">📦</span>
          <div class="action-content">
            <h3>Gerenciar Produtos</h3>
            <p>Estoque e preços</p>
          </div>
        </button>
        <button class="action-card" routerLink="/transacoes">
          <span class="action-icon">🛒</span>
          <div class="action-content">
            <h3>Nova Venda</h3>
            <p>Registrar transação</p>
          </div>
        </button>
        <button class="action-card" routerLink="/adicionar-saldo">
          <span class="action-icon">💰</span>
          <div class="action-content">
            <h3>Adicionar Saldo</h3>
            <p>Creditar valor</p>
          </div>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = {
    acampantes: 0,
    conselheiros: 0,
    produtos: 0,
    produtosBaixoEstoque: 0,
    saldoDevedor: 0,
    faturamento: 0,
    quantidadeVendas: 0,
    saldoNaoUtilizado: 0
  };

  constructor(
    private pessoaService: PessoaService,
    private produtoService: ProdutoService,
    private financeiroService: FinanceiroService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // Carregar todos os dados em paralelo
    forkJoin({
      acampantes: this.pessoaService.getByFuncao('acampante'),
      conselheiros: this.pessoaService.getByFuncao('conselheiro'),
      produtos: this.produtoService.getAll(),
      historico: this.financeiroService.getHistorico(),
      todasPessoas: this.pessoaService.getAll()
    }).subscribe({
      next: (data) => {
        // Estatísticas de pessoas
        this.stats.acampantes = data.acampantes.length;
        this.stats.conselheiros = data.conselheiros.length;

        // Estatísticas de produtos
        this.stats.produtos = data.produtos.length;
        this.stats.produtosBaixoEstoque = data.produtos.filter(p => p.quantidadeEmEstoque < 10).length;

        // Estatísticas financeiras
        // Quantidade de vendas
        this.stats.quantidadeVendas = data.historico.filter(
          h => h.tipo === 'cantina' && !h.revertida
        ).length;

        // Saldo não utilizado (saldo positivo que as pessoas têm)
        this.stats.saldoNaoUtilizado = data.todasPessoas
          .filter(p => p.saldo > 0)
          .reduce((acc, p) => acc + p.saldo, 0);

        // Total de vendas
        const faturamento = data.historico
          .filter(h => h.tipo === 'cantina' && !h.revertida)
          .reduce((acc, h) => acc + h.valor, 0);

        // Saldo devedor (pessoas com saldo negativo)
        this.stats.saldoDevedor = data.todasPessoas
          .filter(p => p.saldo < 0)
          .reduce((acc, p) => acc + Math.abs(p.saldo), 0);

        this.stats.faturamento = faturamento;

        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }
}
