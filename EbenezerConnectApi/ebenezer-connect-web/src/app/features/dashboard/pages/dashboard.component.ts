import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PessoaService } from '../../../core/services/pessoa.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Ebenezer</h2>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/pessoas" routerLinkActive="active" class="nav-item">
            <span class="icon">👥</span>
            <span>Pessoas</span>
          </a>
          <a routerLink="/produtos" routerLinkActive="active" class="nav-item">
            <span class="icon">📦</span>
            <span>Produtos</span>
          </a>
          <a routerLink="/transacoes" routerLinkActive="active" class="nav-item">
            <span class="icon">💳</span>
            <span>Transações</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-details">
              <div class="user-name">{{ currentUser?.nome }}</div>
              <div class="user-role">{{ getRoleName(currentUser?.funcao) }}</div>
            </div>
          </div>
          <button (click)="logout()" class="btn-logout">Sair</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="page-header">
          <h1>Dashboard</h1>
          <p>Bem-vindo ao sistema Ebenezer Connect</p>
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
            <div class="stat-icon produtos">📦</div>
            <div class="stat-info">
              <h3>{{ stats.produtos }}</h3>
              <p>Produtos</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon estoque-baixo">⚠️</div>
            <div class="stat-info">
              <h3>{{ stats.produtosBaixoEstoque }}</h3>
              <p>Estoque Baixo</p>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <h2>Ações Rápidas</h2>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/pessoas">
              <span class="action-icon">👤</span>
              <span>Gerenciar Pessoas</span>
            </button>
            <button class="action-btn" routerLink="/produtos">
              <span class="action-icon">📦</span>
              <span>Gerenciar Produtos</span>
            </button>
            <button class="action-btn" routerLink="/transacoes">
              <span class="action-icon">💳</span>
              <span>Nova Transação</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  userInitials: string = '';
  stats = {
    acampantes: 0,
    conselheiros: 0,
    produtos: 0,
    produtosBaixoEstoque: 0
  };

  constructor(
    private authService: AuthService,
    private pessoaService: PessoaService,
    private produtoService: ProdutoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userInitials = this.getInitials(this.currentUser?.nome || '');
    this.loadStats();
  }

  loadStats(): void {
    this.pessoaService.getByFuncao('acampante').subscribe({
      next: (data) => {
        this.stats.acampantes = data.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.pessoaService.getByFuncao('conselheiro').subscribe({
      next: (data) => {
        this.stats.conselheiros = data.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.produtoService.getAll().subscribe({
      next: (data) => {
        this.stats.produtos = data.length;
        this.stats.produtosBaixoEstoque = data.filter(p => p.quantidadeEmEstoque < 10).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleName(role?: string): string {
    const roles: any = {
      'acampante': 'Acampante',
      'conselheiro': 'Conselheiro',
      'admin': 'Administrador'
    };
    return roles[role || ''] || '';
  }

  logout(): void {
    this.authService.logout();
  }
}
