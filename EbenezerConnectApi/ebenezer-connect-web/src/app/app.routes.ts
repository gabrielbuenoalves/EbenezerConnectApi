import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { adminConselheiroGuard } from './core/guards/admin-conselheiro.guard';
import { MainLayoutComponent } from './shared/layouts/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Public Routes
  {
    path: 'saldo/consultar',
    loadComponent: () => import('./features/saldo/pages/consultar-saldo.component').then(m => m.ConsultarSaldoComponent)
  },
  {
    path: 'escala',
    loadComponent: () => import('./features/escalas/pages/visualizar-escala.component').then(m => m.VisualizarEscalaComponent)
  },

  // Auth Routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  
  // Protected Routes with Layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pessoas',
        loadComponent: () => import('./features/pessoas/pages/pessoas-list.component').then(m => m.PessoasListComponent)
      },
      {
        path: 'pessoas/importar',
        loadComponent: () => import('./features/pessoas/pages/importar-pessoas.component').then(m => m.ImportarPessoasComponent),
        canActivate: [adminConselheiroGuard]
      },
      {
        path: 'produtos',
        loadComponent: () => import('./features/produtos/pages/produtos-list.component').then(m => m.ProdutosListComponent)
      },
      {
        path: 'transacoes',
        loadComponent: () => import('./features/transacoes/pages/transacoes.component').then(m => m.TransacoesComponent)
      },
      {
        path: 'adicionar-saldo',
        loadComponent: () => import('./features/pessoas/pages/adicionar-saldo.component').then(m => m.AdicionarSaldoComponent)
      },
      {
        path: 'controle-financeiro',
        loadComponent: () => import('./features/financeiro/pages/controle-financeiro.component').then(m => m.ControleFinanceiroComponent)
      },
      {
        path: 'saida-produtos',
        loadComponent: () => import('./features/saida-produtos/pages/saida-produtos.component').then(m => m.SaidaProdutosComponent)
      },
      {
        path: 'escalas',
        loadComponent: () => import('./features/escalas/pages/gerenciar-escalas.component').then(m => m.GerenciarEscalasComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  
  // Not found
  { path: '**', redirectTo: '/dashboard' }
];
