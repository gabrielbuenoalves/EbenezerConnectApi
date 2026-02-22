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

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-layout">
      <div class="page-header">
        <h1>Nova Transação - Cantina</h1>
      </div>

      <div class="transacao-container">
        <div class="left-panel">
          <div class="card">
            <h3>Selecionar Pessoa</h3>
            <select [(ngModel)]="pessoaSelecionadaId" (change)="selecionarPessoa()" class="form-control">
              <option value="">Selecione uma pessoa...</option>
              <option *ngFor="let pessoa of pessoas; trackBy: trackByPessoaId" [value]="pessoa.id">
                {{ pessoa.nome }} - R$ {{ pessoa.saldo.toFixed(2) }}
              </option>
            </select>
            
            <div *ngIf="pessoaSelecionada" class="pessoa-info">
              <p><strong>Saldo Disponível:</strong> R$ {{ pessoaSelecionada.saldo.toFixed(2) }}</p>
            </div>
          </div>

          <div class="card">
            <h3>Adicionar Produtos</h3>
            <div class="produto-select">
              <select [(ngModel)]="produtoSelecionadoId" class="form-control">
                <option value="">Selecione um produto...</option>
                <option *ngFor="let produto of produtos; trackBy: trackByProdutoId" [value]="produto.id">
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
    </div>
  `,
  styleUrls: ['./transacoes.component.scss']
})
export class TransacoesComponent implements OnInit {
  pessoas: Pessoa[] = [];
  produtos: Produto[] = [];
  pessoaSelecionadaId: string = '';
  pessoaSelecionada: Pessoa | null = null;
  produtoSelecionadoId: string = '';
  quantidade: number = 1;
  tipoPagamento: 'saldo' | 'avista' = 'saldo';
  carrinho: ItemCarrinho[] = [];

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
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadProdutos(): void {
    this.produtoService.getAll().subscribe({
      next: (data) => {
        this.produtos = data.filter(p => p.quantidadeEmEstoque > 0);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
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

    if (produto.quantidadeEmEstoque < this.quantidade) {
      alert('Estoque insuficiente');
      return;
    }

    this.carrinho.push({
      produtoId: produto.id,
      quantidade: this.quantidade,
      produtoNome: produto.nome,
      precoUnitario: produto.precoVendaAtual
    });

    this.quantidade = 1;
    this.produtoSelecionadoId = '';
  }

  removerDoCarrinho(index: number): void {
    this.carrinho.splice(index, 1);
  }

  calcularTotal(): number {
    return this.carrinho.reduce((sum, item) => sum + (item.quantidade * (item.precoUnitario || 0)), 0);
  }

  podeFinalizara(): boolean {
    return !!(
      this.pessoaSelecionada && 
      this.carrinho.length > 0 && 
      (this.tipoPagamento === 'avista' || this.calcularTotal() <= this.pessoaSelecionada.saldo)
    );
  }

  finalizarTransacao(): void {
    if (!this.podeFinalizara()) return;

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
        this.carrinho = [];
        this.pessoaSelecionadaId = '';
        this.pessoaSelecionada = null;
        this.loadPessoas();
        this.loadProdutos();
      },
      error: (err) => alert('Erro ao realizar transação: ' + err.message)
    });
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
