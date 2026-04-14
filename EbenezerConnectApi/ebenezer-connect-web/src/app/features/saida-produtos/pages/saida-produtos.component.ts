import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { FinanceiroHistorico } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import * as XLSX from 'xlsx';

interface SaidaProdutoResumo {
  produtoNome: string;
  quantidadeVendida: number;
  valorUnitarioMedio: number;
  valorTotalVendido: number;
  ultimaSaida: string;
}

@Component({
  selector: 'app-saida-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Saída de Produtos"
      subtitle="Resumo de quais produtos foram vendidos e em que quantidade"
    >
      <div header-actions>
        <button (click)="exportarParaExcel()" class="btn-export">
          📥 Exportar Excel
        </button>
      </div>
    </app-page-header>

    <div class="filters">
      <input
        type="text"
        [(ngModel)]="searchTerm"
        (input)="filtrar()"
        placeholder="Buscar produto..."
        class="form-control"
      />

      <select [(ngModel)]="statusFilter" (change)="filtrar()" class="form-control">
        <option value="">Todos os produtos</option>
        <option value="mais-vendidos">Mais vendidos</option>
        <option value="menos-vendidos">Menos vendidos</option>
      </select>

      <div class="summary-card">
        <span class="summary-label">Produtos vendidos</span>
        <strong>{{ resumoFiltrado.length }}</strong>
      </div>

      <div class="summary-card">
        <span class="summary-label">Unidades vendidas</span>
        <strong>{{ totalQuantidadeVendida }}</strong>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade Vendida</th>
            <th>Valor Unitário Médio</th>
            <th>Valor Total Vendido</th>
            <th>Última Saída</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of resumoFiltrado; trackBy: trackByProdutoNome">
            <td>{{ item.produtoNome }}</td>
            <td>
              <span class="quantity-badge">{{ item.quantidadeVendida }}</span>
            </td>
            <td>R$ {{ item.valorUnitarioMedio.toFixed(2) }}</td>
            <td>R$ {{ item.valorTotalVendido.toFixed(2) }}</td>
            <td>{{ formatarData(item.ultimaSaida) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="empty" *ngIf="resumoFiltrado.length === 0">
        Nenhuma saída de produto encontrada
      </div>
    </div>
  `,
  styleUrls: ['./saida-produtos.component.scss']
})
export class SaidaProdutosComponent implements OnInit {
  historico: FinanceiroHistorico[] = [];
  resumo: SaidaProdutoResumo[] = [];
  resumoFiltrado: SaidaProdutoResumo[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  totalQuantidadeVendida = 0;

  constructor(
    private financeiroService: FinanceiroService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarHistorico();
  }

  carregarHistorico(): void {
    this.financeiroService.getHistorico().subscribe({
      next: (data) => {
        this.historico = data;
        this.montarResumo();
        this.filtrar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar histórico de saída:', err);
      }
    });
  }

  montarResumo(): void {
    const agregados = new Map<string, SaidaProdutoResumo & { valorTotalBruto: number; precoUnitarioSoma: number; ocorrencias: number }>();

    this.historico
      .filter((item) => item.tipo === 'cantina' && !item.revertida)
      .forEach((item) => {
        const itens = item.itens || [];
        itens.forEach((produto) => {
          const chave = produto.produtoNome.trim().toLowerCase();
          const existente = agregados.get(chave);
          const valorTotalItem = produto.quantidade * produto.precoUnitario;

          if (existente) {
            existente.quantidadeVendida += produto.quantidade;
            existente.valorTotalBruto += valorTotalItem;
            existente.precoUnitarioSoma += produto.precoUnitario;
            existente.ocorrencias += 1;
            if (new Date(item.data).getTime() > new Date(existente.ultimaSaida).getTime()) {
              existente.ultimaSaida = item.data;
            }
          } else {
            agregados.set(chave, {
              produtoNome: produto.produtoNome,
              quantidadeVendida: produto.quantidade,
              valorUnitarioMedio: produto.precoUnitario,
              valorTotalVendido: valorTotalItem,
              ultimaSaida: item.data,
              valorTotalBruto: valorTotalItem,
              precoUnitarioSoma: produto.precoUnitario,
              ocorrencias: 1
            });
          }
        });
      });

    this.resumo = Array.from(agregados.values())
      .map((item) => ({
        produtoNome: item.produtoNome,
        quantidadeVendida: item.quantidadeVendida,
        valorUnitarioMedio: item.precoUnitarioSoma / item.ocorrencias,
        valorTotalVendido: item.valorTotalBruto,
        ultimaSaida: item.ultimaSaida
      }))
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

    this.totalQuantidadeVendida = this.resumo.reduce((acc, item) => acc + item.quantidadeVendida, 0);
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let itens = [...this.resumo];

    if (term) {
      itens = itens.filter((item) => item.produtoNome.toLowerCase().includes(term));
    }

    if (this.statusFilter === 'mais-vendidos') {
      itens = itens.sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);
    }

    if (this.statusFilter === 'menos-vendidos') {
      itens = itens.sort((a, b) => a.quantidadeVendida - b.quantidadeVendida);
    }

    this.resumoFiltrado = itens;
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleString('pt-BR');
  }

  trackByProdutoNome(index: number, item: SaidaProdutoResumo): string {
    return item.produtoNome;
  }

  exportarParaExcel(): void {
    if (this.resumoFiltrado.length === 0) {
      alert('Nenhuma saída para exportar');
      return;
    }

    const dados = this.resumoFiltrado.map((item) => ({
      'Produto': item.produtoNome,
      'Quantidade Vendida': item.quantidadeVendida,
      'Valor Unitário Médio': `R$ ${item.valorUnitarioMedio.toFixed(2)}`,
      'Valor Total Vendido': `R$ ${item.valorTotalVendido.toFixed(2)}`,
      'Última Saída': this.formatarData(item.ultimaSaida)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SaidasProdutos');

    const dataHora = new Date().toLocaleString('pt-BR').replace(/[\\/\s,:]/g, '-');
    const nomeArquivo = `saida-produtos-${dataHora}.xlsx`;

    XLSX.writeFile(workbook, nomeArquivo);
  }
}
