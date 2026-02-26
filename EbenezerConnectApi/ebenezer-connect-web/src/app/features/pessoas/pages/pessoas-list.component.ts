import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PessoaService } from '../../../core/services/pessoa.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pessoa } from '../../../core/models';

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Gerenciar Pessoas</h1>
      <div class="header-actions">
        <button 
          *ngIf="isAdminOrConselheiro" 
          routerLink="/pessoas/importar" 
          class="btn-primary">
          📥 Importar via Excel
        </button>
        <button 
          *ngIf="isAdminOrConselheiro" 
          (click)="abrirModalCadastro()" 
          class="btn-primary">
          ➕ Cadastrar Pessoa
        </button>
      </div>
    </div>
    
    <div class="filters">
      <select [(ngModel)]="filtroFuncao" (change)="filtrar()" class="form-control">
        <option value="">Todas as Funções</option>
        <option value="acampante">Acampantes</option>
        <option value="conselheiro">Conselheiros</option>
        <option value="admin">Administradores</option>
      </select>
      <input type="text" [(ngModel)]="searchTerm" (input)="filtrar()" placeholder="Buscar..." class="form-control" />
    </div>

      <div class="table-container">
        <div *ngIf="isLoading" class="loading-message">
          Carregando pessoas...
        </div>
        <div *ngIf="!isLoading && pessoasFiltradas.length === 0" class="empty-message">
          Nenhuma pessoa encontrada
        </div>
        <table class="data-table" *ngIf="!isLoading && pessoasFiltradas.length > 0">
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
                <button (click)="editarPessoa(pessoa)" class="btn-sm btn-secondary" title="Editar">✏️</button>
                <button (click)="deletePessoa(pessoa.id)" class="btn-sm btn-danger">Remover</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal para cadastrar pessoa -->
      <div class="modal" *ngIf="showCadastroModal" (click)="closeCadastroModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Cadastrar Nova Pessoa</h3>
          
          <div class="info-message">
            ℹ️ A senha temporária será gerada automaticamente usando os 6 primeiros dígitos do CPF.
          </div>

          <div class="form-group">
            <label>Nome Completo <span class="required">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="novaPessoa.nome" 
              class="form-control" 
              placeholder="Digite o nome completo"
            />
          </div>

          <div class="form-group">
            <label>Email <span class="required">*</span></label>
            <input 
              type="email" 
              [(ngModel)]="novaPessoa.email" 
              class="form-control" 
              placeholder="exemplo@email.com"
            />
          </div>

          <div class="form-group">
            <label>CPF <span class="required">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="novaPessoa.cpf" 
              class="form-control" 
              placeholder="Apenas números (11 dígitos)" 
              maxlength="11"
              (input)="formatCpf($event)"
            />
            <small class="help-text">Será usado para gerar a senha temporária</small>
          </div>

          <div class="form-group">
            <label>Função <span class="required">*</span></label>
            <select [(ngModel)]="novaPessoa.funcao" class="form-control">
              <option value="">Selecione...</option>
              <option value="acampante">Acampante</option>
              <option value="conselheiro">Conselheiro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="error-message" *ngIf="cadastroError">
            {{ cadastroError }}
          </div>

          <div class="success-message" *ngIf="cadastroSucesso">
            ✅ {{ cadastroSucesso }}
          </div>

          <div class="modal-actions">
            <button (click)="closeCadastroModal()" class="btn-secondary" [disabled]="cadastrando">Cancelar</button>
            <button (click)="confirmarCadastro()" class="btn-primary" [disabled]="cadastrando">
              {{ cadastrando ? 'Cadastrando...' : 'Cadastrar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para editar pessoa -->
      <div class="modal" *ngIf="showEditModal" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Editar Pessoa</h3>
          
          <div class="form-group">
            <label>Nome</label>
            <input type="text" [(ngModel)]="pessoaEdit.nome" class="form-control" />
          </div>

          <div *ngIf="isAdmin" class="admin-only-section">
            <h4>Campos de Administrador Apenas</h4>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="pessoaEdit.email" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>CPF</label>
              <input type="text" [(ngModel)]="pessoaEdit.cpf" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Função</label>
              <select [(ngModel)]="pessoaEdit.funcao" class="form-control">
                <option value="acampante">Acampante</option>
                <option value="conselheiro">Conselheiro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button (click)="closeEditModal()" class="btn-secondary">Cancelar</button>
            <button (click)="confirmarEdicao()" class="btn-primary">Salvar</button>
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
  showEditModal: boolean = false;
  showCadastroModal: boolean = false;
  pessoaSelecionada: Pessoa | null = null;
  isLoading: boolean = true;
  pessoaEdit: any = {
    nome: '',
    email: '',
    cpf: '',
    funcao: ''
  };
  novaPessoa: any = {
    nome: '',
    email: '',
    cpf: '',
    funcao: ''
  };
  cadastrando: boolean = false;
  cadastroError: string = '';
  cadastroSucesso: string = '';
  isAdmin: boolean = false;
  isAdminOrConselheiro: boolean = false;

  constructor(
    private pessoaService: PessoaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Verificar se o usuário é admin
    const currentUser = this.authService.getCurrentUser();
    console.log('[Pessoas-List] Usuário atual:', currentUser);
    
    if (currentUser) {
      const funcaoLower = currentUser.funcao?.toLowerCase() || '';
      this.isAdmin = funcaoLower === 'admin' || funcaoLower === 'administrador';
      this.isAdminOrConselheiro = funcaoLower === 'admin' || funcaoLower === 'administrador' || funcaoLower === 'conselheiro';
      console.log('[Pessoas-List] Funcao:', currentUser.funcao);
      console.log('[Pessoas-List] Funcao em lower:', funcaoLower);
      console.log('[Pessoas-List] É admin?', this.isAdmin);
      console.log('[Pessoas-List] É admin ou conselheiro?', this.isAdminOrConselheiro);
    } else {
      console.log('[Pessoas-List] Nenhum usuário logado');
      this.isAdmin = false;
      this.isAdminOrConselheiro = false;
    }
    
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.loadPessoas();
  }

  loadPessoas(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.pessoaService.getAll().subscribe({
      next: (data) => {
        console.log('Dados carregados:', data);
        this.pessoas = data || [];
        this.pessoasFiltradas = [...this.pessoas];
        this.aplicarFiltros();
        this.isLoading = false;
        
        // Forçar detecção de mudanças após um pequeno delay
        setTimeout(() => {
          this.cdr.markForCheck();
        }, 10);
      },
      error: (err) => {
        console.error('Erro ao carregar pessoas:', err);
        this.pessoas = [];
        this.pessoasFiltradas = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrar(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultado = [...this.pessoas];

    // Aplicar filtro de função se houver
    if (this.filtroFuncao) {
      resultado = resultado.filter(p => p.funcao === this.filtroFuncao);
    }

    // Aplicar filtro de busca por texto se houver
    if (this.searchTerm) {
      resultado = resultado.filter(p => 
        p.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.pessoasFiltradas = resultado;
    this.cdr.markForCheck();
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

  editarPessoa(pessoa: Pessoa): void {
    console.log('[Pessoas-List] Abrindo modal para editar:', pessoa);
    console.log('[Pessoas-List] isAdmin:', this.isAdmin);
    
    this.pessoaSelecionada = pessoa;
    this.pessoaEdit = {
      nome: pessoa.nome,
      email: pessoa.email || '',
      cpf: pessoa.cpf || '',
      funcao: pessoa.funcao || ''
    };
    
    console.log('[Pessoas-List] pessoaEdit setado:', this.pessoaEdit);
    
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  confirmarEdicao(): void {
    if (!this.pessoaSelecionada) {
      alert('Nenhuma pessoa selecionada');
      return;
    }

    console.log('[Pessoas-List] Iniciando edição...');
    console.log('[Pessoas-List] isAdmin atual:', this.isAdmin);

    // Campos que sempre são atualizados
    const updateDto: any = {
      nome: this.pessoaEdit.nome
    };

    // Se for admin, incluir campos adicionais
    if (this.isAdmin) {
      console.log('[Pessoas-List] Usuário é admin, incluindo campos adicionais');
      updateDto.email = this.pessoaEdit.email;
      updateDto.cpf = this.pessoaEdit.cpf;
      updateDto.funcao = this.pessoaEdit.funcao;
    } else {
      console.log('[Pessoas-List] Usuário NÃO é admin, apenas nome será atualizado');
    }

    // Validação básica
    if (!updateDto.nome || updateDto.nome.trim() === '') {
      alert('Nome é obrigatório');
      return;
    }

    console.log('[Pessoas-List] Atualizando pessoa com dados:', updateDto);

    this.pessoaService.update(this.pessoaSelecionada.id, updateDto).subscribe({
      next: () => {
        console.log('[Pessoas-List] Pessoa atualizada com sucesso');
        alert('Pessoa atualizada com sucesso!');
        this.closeEditModal();
        this.loadPessoas();
      },
      error: (err) => {
        console.error('[Pessoas-List] Erro ao atualizar pessoa:', err);
        const errorMsg = err.error?.erro || err.message || 'Erro desconhecido';
        alert('Erro ao atualizar pessoa: ' + errorMsg);
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.pessoaSelecionada = null;
    this.pessoaEdit = {
      nome: '',
      email: '',
      cpf: '',
      funcao: ''
    };
  }

  trackByPessoaId(index: number, pessoa: Pessoa): number {
    return pessoa.id;
  }

  abrirModalCadastro(): void {
    this.novaPessoa = {
      nome: '',
      email: '',
      cpf: '',
      funcao: ''
    };
    this.cadastroError = '';
    this.cadastroSucesso = '';
    this.showCadastroModal = true;
  }

  closeCadastroModal(): void {
    if (!this.cadastrando) {
      this.showCadastroModal = false;
      this.novaPessoa = {
        nome: '',
        email: '',
        cpf: '',
        funcao: ''
      };
      this.cadastroError = '';
      this.cadastroSucesso = '';
    }
  }

  formatCpf(event: any): void {
    // Remove tudo que não for número
    let value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
    this.novaPessoa.cpf = value;
  }

  confirmarCadastro(): void {
    this.cadastroError = '';
    this.cadastroSucesso = '';

    // Validações
    if (!this.novaPessoa.nome || this.novaPessoa.nome.trim() === '') {
      this.cadastroError = 'Nome é obrigatório';
      return;
    }

    if (!this.novaPessoa.email || this.novaPessoa.email.trim() === '') {
      this.cadastroError = 'Email é obrigatório';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.novaPessoa.email)) {
      this.cadastroError = 'Email inválido';
      return;
    }

    if (!this.novaPessoa.cpf || this.novaPessoa.cpf.length !== 11) {
      this.cadastroError = 'CPF deve conter 11 dígitos';
      return;
    }

    if (!this.novaPessoa.funcao) {
      this.cadastroError = 'Função é obrigatória';
      return;
    }

    // Gera senha temporária (primeiros 6 dígitos do CPF)
    const senhaTemporaria = this.novaPessoa.cpf.substring(0, 6);

    const dadosCadastro = {
      nome: this.novaPessoa.nome,
      email: this.novaPessoa.email,
      cpf: this.novaPessoa.cpf,
      funcao: this.novaPessoa.funcao,
      telefone: '',
      senha: senhaTemporaria,
      confirmarSenha: senhaTemporaria
    };

    this.cadastrando = true;
    this.authService.register(dadosCadastro).subscribe({
      next: (response) => {
        this.cadastrando = false;
        this.cadastroSucesso = `Pessoa cadastrada com sucesso! Senha temporária: ${senhaTemporaria}`;
        
        setTimeout(() => {
          this.closeCadastroModal();
          this.loadPessoas();
        }, 3000);
      },
      error: (error) => {
        this.cadastrando = false;
        this.cadastroError = error.error?.mensagem || error.message || 'Erro ao cadastrar pessoa. Tente novamente.';
        console.error('Erro no cadastro:', error);
      }
    });
  }
}
