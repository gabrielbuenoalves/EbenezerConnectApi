import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransacaoService } from '../../../core/services/transacao.service';
import { PessoaService } from '../../../core/services/pessoa.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { Pessoa, Produto, ItemTransacaoDto } from '../../../core/models';

interface ItemCarrinho extends ItemTransacaoDto {
  produtoNome?: string;
  precoUnitario?: number;
}

interface ResumoCompra {
  pessoaNome: string;
  tipoPagamento: string;
  itens: ItemCarrinho[];
  total: number;
}

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-header">
      <h1>Cantina</h1>
    </div>

    <div class="transacao-container">
        <div class="left-panel">
          <div class="card">
            <h3>Selecionar Pessoa</h3>
            <input 
              type="text" 
              [(ngModel)]="pessoaBuscaTexto" 
              (input)="atualizarPessoasFiltradas()"
              class="search-input"
              placeholder="Buscar por nome..." />
            <select [(ngModel)]="pessoaSelecionadaId" (change)="selecionarPessoa()" class="form-control">
              <option value="">Selecione uma pessoa...</option>
              <option *ngFor="let pessoa of pessoasFiltradas; trackBy: trackByPessoaId" [value]="pessoa.id">
                {{ pessoa.nome }} - R$ {{ pessoa.saldo.toFixed(2) }}
              </option>
            </select>
            
            <div *ngIf="pessoaSelecionada" class="pessoa-info">
              <p><strong>Saldo Disponível:</strong> R$ {{ pessoaSelecionada.saldo.toFixed(2) }}</p>
            </div>
          </div>

          <div class="card">
            <h3>Adicionar Produtos</h3>
            <input 
              type="text" 
              [(ngModel)]="produtoBuscaTexto" 
              (input)="atualizarProdutosFiltrados()"
              class="search-input"
              placeholder="Buscar por nome..." />
            <div class="produto-select">
              <select [(ngModel)]="produtoSelecionadoId" class="form-control">
                <option value="">Selecione um produto...</option>
                <option *ngFor="let produto of produtosFiltrados; trackBy: trackByProdutoId" [value]="produto.id">
                  {{ produto.nome }} - R$ {{ produto.precoVendaAtual.toFixed(2) }} (Estoque: {{ produto.quantidadeEmEstoque }})
                </option>
              </select>
              <input type="number" [(ngModel)]="quantidade" min="1" placeholder="Qtd" class="form-control-sm" />
              <button (click)="adicionarAoCarrinho()" class="btn-primary">Adicionar</button>
            </div>
          </div>

          <div class="card">
            <h3>Tipo de Pagamento</h3>
            <div class="radio-group">
              <label>
                <input type="radio" [(ngModel)]="tipoPagamento" value="saldo" name="tipo" />
                Pagar com Saldo
              </label>
              <label>
                <input type="radio" [(ngModel)]="tipoPagamento" value="avista" name="tipo" />
                Pagar à Vista
              </label>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="card carrinho">
            <h3>Carrinho</h3>
            <div *ngIf="carrinho.length === 0" class="empty-cart">
              Nenhum item adicionado
            </div>
            <div *ngFor="let item of carrinho; let i = index; trackBy: trackByIndex" class="cart-item">
              <div class="item-info">
                <strong>{{ item.produtoNome }}</strong>
                <span>{{ item.quantidade }}x R$ {{ item.precoUnitario?.toFixed(2) }}</span>
              </div>
              <div class="item-total">
                R$ {{ (item.quantidade * (item.precoUnitario || 0)).toFixed(2) }}
                <button (click)="removerDoCarrinho(i)" class="btn-remove">×</button>
              </div>
            </div>

            <div class="cart-total">
              <strong>Total: R$ {{ calcularTotal().toFixed(2) }}</strong>
            </div>

            <button 
              (click)="finalizarTransacao()" 
              class="btn-finalizar" 
              [disabled]="!podeFinalizara()">
              Finalizar Transação
            </button>
          </div>
        </div>
      </div>

    <div class="modal" *ngIf="modalAberta">
      <div class="modal-content">
        <h2>Confirmar Compra</h2>
        <div *ngIf="resumoCompra" class="resumo">
          <div class="info-pessoas">
            <p><strong>Pessoa:</strong> {{ resumoCompra.pessoaNome }}</p>
            <p><strong>Forma de Pagamento:</strong> {{ formatarTipoPagamento(resumoCompra.tipoPagamento) }}</p>
          </div>

          <div class="itens-lista">
            <h4>Produtos:</h4>
            <div *ngFor="let item of resumoCompra.itens" class="item-resumo">
              <div class="item-detalhes">
                <span class="produto-nome">{{ item.produtoNome }}</span>
                <span class="quantidade-preco">{{ item.quantidade }}x R$ {{ item.precoUnitario?.toFixed(2) }}</span>
              </div>
              <div class="subtotal">
                R$ {{ (item.quantidade * (item.precoUnitario || 0)).toFixed(2) }}
              </div>
            </div>
          </div>

          <div class="total-resumo">
            <strong>Total: R$ {{ resumoCompra.total.toFixed(2) }}</strong>
          </div>
        </div>

        <div class="modal-actions">
          <button (click)="cancelarCompra()" class="btn-secondary">Cancelar</button>
          <button (click)="confirmarCompra()" class="btn-primary" [disabled]="processandoTransacao">
            {{ processandoTransacao ? 'Processando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./transacoes.component.scss']
})
export class TransacoesComponent implements OnInit {
  pessoas: Pessoa[] = [];
  produtos: Produto[] = [];
  pessoasFiltradas: Pessoa[] = [];
  produtosFiltrados: Produto[] = [];
  pessoaSelecionadaId: string = '';
  pessoaSelecionada: Pessoa | null = null;
  pessoaBuscaTexto: string = '';
  produtoSelecionadoId: string = '';
  produtoBuscaTexto: string = '';
  quantidade: number = 1;
  tipoPagamento: 'saldo' | 'avista' = 'saldo';
  carrinho: ItemCarrinho[] = [];
  modalAberta: boolean = false;
  resumoCompra: ResumoCompra | null = null;
  processandoTransacao: boolean = false;

  constructor(
    private transacaoService: TransacaoService,
    private pessoaService: PessoaService,
    private produtoService: ProdutoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPessoas();
    this.loadProdutos();
  }

  loadPessoas(): void {
    this.pessoaService.getAll().subscribe({
      next: (data) => {
        this.pessoas = data;
        this.atualizarPessoasFiltradas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadProdutos(): void {
    this.produtoService.getAll().subscribe({
      next: (data) => {
        this.produtos = data.filter(p => p.quantidadeEmEstoque > 0);
        this.atualizarProdutosFiltrados();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  atualizarPessoasFiltradas(): void {
    const texto = this.pessoaBuscaTexto.toLowerCase();
    if (!texto) {
      this.pessoasFiltradas = this.pessoas;
    } else {
      this.pessoasFiltradas = this.pessoas.filter(p => 
        p.nome.toLowerCase().includes(texto)
      );
    }
  }

  atualizarProdutosFiltrados(): void {
    const texto = this.produtoBuscaTexto.toLowerCase();
    if (!texto) {
      this.produtosFiltrados = this.produtos;
    } else {
      this.produtosFiltrados = this.produtos.filter(p => 
        p.nome.toLowerCase().includes(texto)
      );
    }
  }

  selecionarPessoa(): void {
    this.pessoaSelecionada = this.pessoas.find(p => p.id.toString() === this.pessoaSelecionadaId) || null;
  }

  adicionarAoCarrinho(): void {
    if (!this.produtoSelecionadoId || this.quantidade <= 0) {
      alert('Selecione um produto e quantidade válida');
      return;
    }

    const produto = this.produtos.find(p => p.id.toString() === this.produtoSelecionadoId);
    if (!produto) return;

    // Calcula a quantidade total deste produto já no carrinho
    const quantidadeNoCarrinho = this.carrinho
      .filter(item => item.produtoId === produto.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    // Calcula o estoque disponível real (mostrado + no carrinho)
    const quantidadeDisponivel = produto.quantidadeEmEstoque + quantidadeNoCarrinho;

    // Valida se a quantidade total (carrinho + nova) não excede o estoque disponível
    const quantidadeTotal = quantidadeNoCarrinho + this.quantidade;
    if (quantidadeDisponivel < quantidadeTotal) {
      alert(
        `Estoque insuficiente! Disponível: ${quantidadeDisponivel} unidades. ` +
        `Você já possui ${quantidadeNoCarrinho} no carrinho. ` +
        `Pode adicionar apenas ${Math.max(0, quantidadeDisponivel - quantidadeNoCarrinho)} unidades.`
      );
      return;
    }

    // Procura se o produto já existe no carrinho
    const itemExistente = this.carrinho.find(item => item.produtoId === produto.id);

    if (itemExistente) {
      // Se existe, incrementa a quantidade
      itemExistente.quantidade += this.quantidade;
    } else {
      // Se não existe, adiciona novo
      this.carrinho.push({
        produtoId: produto.id,
        quantidade: this.quantidade,
        produtoNome: produto.nome,
        precoUnitario: produto.precoVendaAtual
      });
    }

    // Decrementa a quantidade do produto na lista
    produto.quantidadeEmEstoque -= this.quantidade;

    this.quantidade = 1;
    this.produtoSelecionadoId = '';
  }

  removerDoCarrinho(index: number): void {
    const itemRemovido = this.carrinho[index];
    
    // Encontra o produto original na lista e incrementa a quantidade
    const produto = this.produtos.find(p => p.id === itemRemovido.produtoId);
    if (produto) {
      produto.quantidadeEmEstoque += itemRemovido.quantidade;
    }

    // Remove do carrinho
    this.carrinho.splice(index, 1);
  }

  calcularTotal(): number {
    return this.carrinho.reduce((sum, item) => sum + (item.quantidade * (item.precoUnitario || 0)), 0);
  }

  podeFinalizara(): boolean {
    return !!(
      this.pessoaSelecionada && 
      this.carrinho.length > 0
    );
  }

  finalizarTransacao(): void {
    if (!this.podeFinalizara()) return;

    this.resumoCompra = {
      pessoaNome: this.pessoaSelecionada?.nome || '',
      tipoPagamento: this.tipoPagamento,
      itens: this.carrinho,
      total: this.calcularTotal()
    };

    this.modalAberta = true;
  }

  cancelarCompra(): void {
    this.modalAberta = false;
    this.resumoCompra = null;
  }

  confirmarCompra(): void {
    if (!this.podeFinalizara()) return;

    this.processandoTransacao = true;

    const transacao = {
      pessoaId: parseInt(this.pessoaSelecionadaId),
      tipoPagamento: this.tipoPagamento,
      itens: this.carrinho.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    };

    this.transacaoService.registrarTransacao(transacao).subscribe({
      next: () => {
        alert('Transação realizada com sucesso!');
        this.processandoTransacao = false;
        this.modalAberta = false;
        this.resumoCompra = null;
        this.carrinho = [];
        this.pessoaSelecionadaId = '';
        this.pessoaSelecionada = null;
        this.loadPessoas();
        this.loadProdutos();
      },
      error: (err) => {
        this.processandoTransacao = false;
        let mensagemErro = 'Erro ao realizar transação';
        if (err.error && err.error.erro) {
          mensagemErro = err.error.erro;
        } else if (err.message) {
          mensagemErro = err.message;
        }
        alert(mensagemErro);
        console.error('Erro na transação:', err);
      }
    });
  }

  formatarTipoPagamento(tipo: string): string {
    const map: Record<string, string> = {
      saldo: 'Pagar com Saldo',
      avista: 'Pagar à Vista',
      credito: 'Crédito'
    };
    return map[tipo] || tipo;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByPessoaId(index: number, pessoa: Pessoa): number {
    return pessoa.id;
  }

  trackByProdutoId(index: number, produto: Produto): number {
    return produto.id;
  }
}
