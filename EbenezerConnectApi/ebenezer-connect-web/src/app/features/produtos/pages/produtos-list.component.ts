import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProdutoService } from '../../../core/services/produto.service';
import { Produto, CriarProdutoDto } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';

@Component({
  selector: 'app-produtos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Gerenciar Produtos"
      subtitle="Controle de estoque, preços e informações dos produtos da cantina"
    >
      <div header-actions>
        <button (click)="openModal()" class="btn-primary header-btn">+ Novo Produto</button>
      </div>
    </app-page-header>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Estoque</th>
            <th>Preço Compra</th>
            <th>Preço Venda</th>
            <th>Margem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let produto of produtos; trackBy: trackByProdutoId" [class.low-stock]="produto.quantidadeEmEstoque < 10">
            <td>{{ produto.nome }}</td>
            <td>
              <span class="stock-badge" [class.low]="produto.quantidadeEmEstoque < 10">
                {{ produto.quantidadeEmEstoque }}
              </span>
            </td>
            <td>R$ {{ produto.precoCompraAtual.toFixed(2) }}</td>
            <td>R$ {{ produto.precoVendaAtual.toFixed(2) }}</td>
            <td>{{ calcularMargem(produto) }}%</td>
            <td>
              <button (click)="editProduto(produto)" class="btn-sm btn-primary">Editar</button>
              <button (click)="deleteProduto(produto.id)" class="btn-sm btn-danger">Remover</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>{{ isEditing ? 'Editar Produto' : 'Novo Produto' }}</h3>
        <form [formGroup]="produtoForm" (ngSubmit)="salvar()">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" formControlName="nome" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantidade</label>
              <input type="number" formControlName="quantidadeEstoque" class="form-control" />
            </div>
            <div class="form-group">
              <label>Preço Compra</label>
              <input type="number" formControlName="precoCompra" class="form-control" step="0.01" />
            </div>
            <div class="form-group">
              <label>Preço Venda</label>
              <input type="number" formControlName="precoVenda" class="form-control" step="0.01" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" (click)="closeModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="produtoForm.invalid">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./produtos-list.component.scss']
})
export class ProdutosListComponent implements OnInit {
  produtos: Produto[] = [];
  showModal: boolean = false;
  isEditing: boolean = false;
  produtoEditId?: number;
  produtoForm: FormGroup;

  constructor(
    private produtoService: ProdutoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      quantidadeEstoque: [0, [Validators.required, Validators.min(0)]],
      precoCompra: [0, [Validators.required, Validators.min(0)]],
      precoVenda: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProdutos();
  }

  loadProdutos(): void {
    this.produtoService.getAll().subscribe({
      next: (data) => {
        this.produtos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  openModal(): void {
    this.isEditing = false;
    this.produtoForm.reset();
    this.showModal = true;
  }

  editProduto(produto: Produto): void {
    this.isEditing = true;
    this.produtoEditId = produto.id;
    this.produtoForm.patchValue({
      nome: produto.nome,
      quantidadeEstoque: produto.quantidadeEmEstoque,
      precoCompra: produto.precoCompraAtual,
      precoVenda: produto.precoVendaAtual
    });
    this.showModal = true;
  }

  salvar(): void {
    if (this.produtoForm.invalid) return;

    const data = this.produtoForm.value;

    if (this.isEditing && this.produtoEditId) {
      this.produtoService.update(this.produtoEditId, data).subscribe({
        next: () => {
          alert('Produto atualizado!');
          this.closeModal();
          this.loadProdutos();
        },
        error: (err) => alert('Erro ao atualizar produto')
      });
    } else {
      this.produtoService.create(data).subscribe({
        next: () => {
          alert('Produto criado!');
          this.closeModal();
          this.loadProdutos();
        },
        error: (err) => alert('Erro ao criar produto')
      });
    }
  }

  deleteProduto(id: number): void {
    if (confirm('Deseja realmente remover este produto?')) {
      this.produtoService.delete(id).subscribe({
        next: () => {
          alert('Produto removido!');
          this.loadProdutos();
        },
        error: (err) => alert('Erro ao remover produto')
      });
    }
  }

  calcularMargem(produto: Produto): string {
    const margem = ((produto.precoVendaAtual - produto.precoCompraAtual) / produto.precoCompraAtual) * 100;
    return margem.toFixed(1);
  }

  trackByProdutoId(index: number, produto: Produto): number {
    return produto.id;
  }

  closeModal(): void {
    this.showModal = false;
    this.produtoForm.reset();
  }
}
