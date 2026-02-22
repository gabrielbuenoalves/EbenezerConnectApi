import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PessoaService } from '../../../core/services/pessoa.service';
import { Pessoa } from '../../../core/models';

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-layout">
      <div class="page-header">
        <h1>Gerenciar Pessoas</h1>
        <div class="filters">
          <select [(ngModel)]="filtroFuncao" (change)="filtrar()" class="form-control">
            <option value="">Todas as Funções</option>
            <option value="acampante">Acampantes</option>
            <option value="conselheiro">Conselheiros</option>
            <option value="admin">Administradores</option>
          </select>
          <input type="text" [(ngModel)]="searchTerm" (input)="filtrar()" placeholder="Buscar..." class="form-control" />
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>CPF</th>
              <th>Função</th>
              <th>Saldo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pessoa of pessoasFiltradas; trackBy: trackByPessoaId">
              <td>{{ pessoa.nome }}</td>
              <td>{{ pessoa.email }}</td>
              <td>{{ pessoa.cpf }}</td>
              <td>
                <span class="badge" [class]="pessoa.funcao">{{ pessoa.funcao }}</span>
              </td>
              <td>R$ {{ pessoa.saldo.toFixed(2) }}</td>
              <td>
                <button (click)="adicionarCreditos(pessoa)" class="btn-sm btn-primary">+ Créditos</button>
                <button (click)="deletePessoa(pessoa.id)" class="btn-sm btn-danger">Remover</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal para adicionar créditos -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Adicionar Créditos</h3>
          <p>{{ pessoaSelecionada?.nome }}</p>
          <input type="number" [(ngModel)]="valorCredito" placeholder="Valor" class="form-control" />
          <div class="modal-actions">
            <button (click)="closeModal()" class="btn-secondary">Cancelar</button>
            <button (click)="confirmarCreditos()" class="btn-primary">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pessoas-list.component.scss']
})
export class PessoasListComponent implements OnInit {
  pessoas: Pessoa[] = [];
  pessoasFiltradas: Pessoa[] = [];
  filtroFuncao: string = '';
  searchTerm: string = '';
  showModal: boolean = false;
  pessoaSelecionada: Pessoa | null = null;
  valorCredito: number = 0;

  constructor(private pessoaService: PessoaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPessoas();
  }

  loadPessoas(): void {
    const request = this.filtroFuncao 
      ? this.pessoaService.getByFuncao(this.filtroFuncao)
      : this.pessoaService.getAll();
    
    request.subscribe({
      next: (data) => {
        this.pessoas = data;
        // Aplicar filtro de busca por texto após carregar dados
        if (!this.filtroFuncao && this.searchTerm) {
          this.pessoasFiltradas = this.pessoas.filter(p => 
            p.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        } else {
          this.pessoasFiltradas = this.pessoas;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  filtrar(): void {
    if (!this.filtroFuncao) {
      // Filtrar por search term quando não há filtro de função
      this.pessoasFiltradas = this.pessoas.filter(p => 
        p.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      // Quando há filtro de função, a requisição já traz os dados filtrados
      this.pessoasFiltradas = this.pessoas;
    }
  }

  adicionarCreditos(pessoa: Pessoa): void {
    this.pessoaSelecionada = pessoa;
    this.valorCredito = 0;
    this.showModal = true;
  }

  confirmarCreditos(): void {
    if (this.pessoaSelecionada && this.valorCredito > 0) {
      this.pessoaService.adicionarCredito({
        pessoaId: this.pessoaSelecionada.id,
        valor: this.valorCredito
      }).subscribe({
        next: () => {
          alert('Créditos adicionados com sucesso!');
          this.closeModal();
          this.loadPessoas();
        },
        error: (err) => alert('Erro ao adicionar créditos')
      });
    }
  }

  deletePessoa(id: number): void {
    if (confirm('Deseja realmente remover esta pessoa?')) {
      this.pessoaService.delete(id).subscribe({
        next: () => {
          alert('Pessoa removida com sucesso!');
          this.loadPessoas();
        },
        error: (err) => alert('Erro ao remover pessoa')
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.pessoaSelecionada = null;
  }

  trackByPessoaId(index: number, pessoa: Pessoa): number {
    return pessoa.id;
  }
}
