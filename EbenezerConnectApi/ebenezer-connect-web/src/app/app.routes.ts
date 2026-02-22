import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
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
  
  // Protected Routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'pessoas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pessoas/pages/pessoas-list.component').then(m => m.PessoasListComponent)
  },
  {
    path: 'produtos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/produtos/pages/produtos-list.component').then(m => m.ProdutosListComponent)
  },
  {
    path: 'transacoes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transacoes/pages/transacoes.component').then(m => m.TransacoesComponent)
  },
  
  // Not found
  { path: '**', redirectTo: '/dashboard' }
];
