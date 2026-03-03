import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { FinanceiroHistorico } from '../../../core/models';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-controle-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Controle Financeiro"
      subtitle="Historico de transacoes da cantina e adicoes de saldo"
    />

    <div class="filters">
      <input
        type="text"
        [(ngModel)]="searchTerm"
        (input)="filtrar()"
        placeholder="Buscar por pessoa..."
        class="form-control"
      />

      <select [(ngModel)]="tipoFilter" (change)="filtrar()" class="form-control">
        <option value="">Todos os tipos</option>
        <option value="cantina">Cantina</option>
        <option value="saldo">Adicao de saldo</option>
      </select>

      <select [(ngModel)]="statusFilter" (change)="filtrar()" class="form-control">
        <option value="">Todos os status</option>
        <option value="ativas">Ativas</option>
        <option value="revertidas">Revertidas</option>
      </select>

      <button (click)="exportarParaExcel()" class="btn-export">
        📥 Exportar Excel
      </button>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Pessoa</th>
            <th>Tipo</th>
            <th>Total</th>
            <th>Pagamento</th>
            <th>Produtos</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of historicoFiltrado; trackBy: trackByHistoricoId" [class.revertida]="item.revertida">
            <td>{{ formatarData(item.data) }}</td>
            <td>{{ item.pessoaNome }}</td>
            <td class="tipo">{{ item.tipo === 'cantina' ? 'Cantina' : 'Saldo' }}</td>
            <td>R$ {{ item.valor.toFixed(2) }}</td>
            <td>{{ formatarPagamento(item.pagamento) }}</td>
            <td class="itens">
              <span *ngIf="!item.itens || item.itens.length === 0">-</span>
              <span *ngIf="item.itens && item.itens.length > 0">
                {{ formatarItens(item.itens) }}
              </span>
            </td>
            <td class="acoes">
              <span *ngIf="item.revertida" class="badge">Revertida</span>
              <button
                *ngIf="!item.revertida"
                class="btn-danger"
                (click)="abrirModal(item)"
              >
                Reverter
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="empty" *ngIf="historicoFiltrado.length === 0">
        Nenhum registro encontrado
      </div>
    </div>

    <div class="modal" *ngIf="modalAberto">
      <div class="modal-content">
        <h3>Confirmar reversao</h3>
        <p>
          Voce tem certeza que deseja reverter esta operacao?
          Essa acao ira desfazer o saldo e o estoque, quando aplicavel.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" (click)="fecharModal()">Cancelar</button>
          <button class="btn-danger" (click)="confirmarReversao()" [disabled]="revertendo">
            {{ revertendo ? 'Revertendo...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./controle-financeiro.component.scss']
})
export class ControleFinanceiroComponent implements OnInit {
  historico: FinanceiroHistorico[] = [];
  historicoFiltrado: FinanceiroHistorico[] = [];
  searchTerm: string = '';
  tipoFilter: string = '';
  statusFilter: string = '';

  modalAberto: boolean = false;
  itemSelecionado: FinanceiroHistorico | null = null;
  revertendo: boolean = false;

  constructor(private financeiroService: FinanceiroService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carregarHistorico();
  }

  carregarHistorico(): void {
    this.financeiroService.getHistorico().subscribe({
      next: (data) => {
        this.historico = data;
        this.filtrar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar historico:', err);
      }
    });
  }

  filtrar(): void {
    const term = this.searchTerm.toLowerCase();

    this.historicoFiltrado = this.historico.filter((item) => {
      const matchesSearch = item.pessoaNome.toLowerCase().includes(term);
      const matchesTipo = !this.tipoFilter || item.tipo === this.tipoFilter;
      const matchesStatus =
        !this.statusFilter ||
        (this.statusFilter === 'ativas' && !item.revertida) ||
        (this.statusFilter === 'revertidas' && item.revertida);

      return matchesSearch && matchesTipo && matchesStatus;
    });
  }

  formatarItens(itens: NonNullable<FinanceiroHistorico['itens']>): string {
    return itens.map((i) => `${i.produtoNome} x${i.quantidade}`).join(', ');
  }

  formatarPagamento(pagamento: string): string {
    const map: Record<string, string> = {
      saldo: 'Saldo',
      avista: 'A vista',
      credito: 'Credito'
    };
    return map[pagamento] || pagamento;
  }

  formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
  }

  abrirModal(item: FinanceiroHistorico): void {
    this.itemSelecionado = item;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.itemSelecionado = null;
  }

  confirmarReversao(): void {
    if (!this.itemSelecionado) return;

    this.revertendo = true;
    this.financeiroService.reverter({
      id: this.itemSelecionado.id,
      tipo: this.itemSelecionado.tipo
    }).subscribe({
      next: () => {
        this.revertendo = false;
        this.fecharModal();
        this.carregarHistorico();
      },
      error: (err) => {
        this.revertendo = false;
        console.error('Erro ao reverter:', err);
        alert('Erro ao reverter a operacao.');
      }
    });
  }

  trackByHistoricoId(index: number, item: FinanceiroHistorico): string {
    return `${item.tipo}-${item.id}`;
  }

  exportarParaExcel(): void {
    if (this.historicoFiltrado.length === 0) {
      alert('Nenhum registro para exportar');
      return;
    }

    const dados = this.historicoFiltrado.map((item) => ({
      'Data/Hora': this.formatarData(item.data),
      'Pessoa': item.pessoaNome,
      'Tipo': item.tipo === 'cantina' ? 'Cantina' : 'Saldo',
      'Valor': `R$ ${item.valor.toFixed(2)}`,
      'Pagamento': this.formatarPagamento(item.pagamento),
      'Produtos': item.itens && item.itens.length > 0 ? this.formatarItens(item.itens) : '-',
      'Status': item.revertida ? 'Revertida' : 'Ativa'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historico');

    const dataHora = new Date().toLocaleString('pt-BR').replace(/[\\/\\s,:]/g, '-');
    const nomeArquivo = `controle-financeiro-${dataHora}.xlsx`;

    XLSX.writeFile(workbook, nomeArquivo);
  }
}
