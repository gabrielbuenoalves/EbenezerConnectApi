import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-main-layout',
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
            <span>Cantina</span>
          </a>
          <a routerLink="/adicionar-saldo" routerLinkActive="active" class="nav-item">
            <span class="icon">💰</span>
            <span>Adicionar Saldo</span>
          </a>
          <a routerLink="/controle-financeiro" routerLinkActive="active" class="nav-item">
            <span class="icon">📒</span>
            <span>Controle Financeiro</span>
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

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  currentUser: User | null = null;
  userInitials: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userInitials = this.getInitials(this.currentUser?.nome || '');
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
