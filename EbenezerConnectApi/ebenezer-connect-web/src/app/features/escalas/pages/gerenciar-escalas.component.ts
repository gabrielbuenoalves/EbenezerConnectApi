import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface EscalaEntradaDto {
  id: number;
  dia: string;
  horarioInicio: string;
  horarioFim: string;
  atividade: string;
  capacidadeMaxima?: number;
  nomeConselheiro: string;
  destaque: boolean;
}

interface PessoaResumoDto {
  id: number;
  nome: string;
}

interface EscalaEventoDto {
  id: number;
  nome: string;
  dataInicio?: string;
  dataFim?: string;
  ativo: boolean;
  entradas: EscalaEntradaDto[];
}

const DIAS = ['QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

@Component({
  selector: 'app-gerenciar-escalas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Escalas</h2>
        <button class="btn-primary" (click)="mostrarFormNovo = !mostrarFormNovo">
          {{ mostrarFormNovo ? 'Cancelar' : '+ Nova Escala' }}
        </button>
      </div>

      @if (mostrarFormNovo) {
        <div class="form-card">
          <h3>Nova Escala</h3>
          <div class="form-row">
            <input [(ngModel)]="novaEscala.nome" placeholder="Nome do evento" class="input" required />
            <input [(ngModel)]="novaEscala.dataInicio" type="datetime-local" class="input" required />
            <input [(ngModel)]="novaEscala.dataFim" type="datetime-local" class="input" required />
            <button class="btn-primary" (click)="criarEscala()" [disabled]="salvando || !formularioEscalaValido()">
              {{ salvando ? 'Salvando...' : 'Criar' }}
            </button>
          </div>
          @if (erroGlobal) { <div class="erro">{{ erroGlobal }}</div> }
        </div>
      }

      @if (loading) {
        <div class="loading">Carregando...</div>
      }

      @for (escala of escalas; track escala.id) {
        <div class="escala-card">
          <div class="escala-header" (click)="toggleExpand(escala.id)">
            <div>
              <span class="escala-nome">{{ escala.nome }}</span>
              @if (escala.dataInicio) {
                <span class="escala-datas"> · {{ escala.dataInicio | date:'dd/MM/yyyy HH:mm' }} – {{ escala.dataFim | date:'dd/MM/yyyy HH:mm' }}</span>
              }
            </div>
            <div class="header-actions">
              <span class="count">{{ escala.entradas.length }} entradas</span>
              <button class="btn-danger-sm" (click)="excluirEscala(escala.id, $event)">Excluir</button>
              <span class="chevron">{{ expandido === escala.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          @if (expandido === escala.id) {
            <div class="escala-body">
              <div class="add-entrada-form">
                <h4>Adicionar Entrada</h4>
                <div class="form-row">
                  <select [(ngModel)]="novaEntrada.dia" class="input select">
                    <option value="">Dia</option>
                    @for (d of DIAS; track d) {
                      <option [value]="d">{{ d }}</option>
                    }
                  </select>
                  <input [(ngModel)]="novaEntrada.horarioInicio" placeholder="Início (07:00)" class="input input-sm" />
                  <input [(ngModel)]="novaEntrada.horarioFim" placeholder="Fim (09:30)" class="input input-sm" />
                  <input [(ngModel)]="novaEntrada.atividade" placeholder="Atividade" class="input" />
                  <div class="dropdown-conselheiros">
                    <input
                      [(ngModel)]="conselheiroBusca"
                      (focus)="mostrarDropdownConselheiros = true"
                      (input)="mostrarDropdownConselheiros = true"
                      (keydown.enter)="selecionarPrimeiroConselheiroFiltrado($event)"
                      placeholder="Buscar conselheiro"
                      class="input" />
                    @if (mostrarDropdownConselheiros && conselheirosFiltrados.length > 0) {
                      <div class="dropdown-lista">
                        @for (conselheiro of conselheirosFiltrados; track conselheiro.id) {
                          <button type="button" class="dropdown-item" (click)="adicionarConselheiroSelecionado(conselheiro.nome)">
                            {{ conselheiro.nome }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <input [(ngModel)]="novaEntrada.capacidadeMaxima" type="number" placeholder="Cap." class="input input-xs" min="1" />
                  <label class="check-label">
                    <input type="checkbox" [(ngModel)]="novaEntrada.destaque" />
                    Destaque
                  </label>
                  <button
                    class="btn-primary"
                    (click)="adicionarEntrada(escala.id)"
                    [disabled]="adicionando || !novaEntrada.dia || novaEntrada.nomesConselheiros.length === 0">
                    {{ adicionando ? '...' : 'Adicionar' }}
                  </button>
                </div>
                @if (novaEntrada.nomesConselheiros.length > 0) {
                  <div class="chips">
                    @for (nome of novaEntrada.nomesConselheiros; track nome) {
                      <span class="chip">
                        {{ nome }}
                        <button type="button" class="chip-remove" (click)="removerConselheiroSelecionado(nome)">x</button>
                      </span>
                    }
                  </div>
                }
                <small class="hint">Digite para filtrar e pressione Enter para adicionar o primeiro resultado.</small>
                @if (erroEntrada) {
                  <div class="erro" [class.erro-conflito]="ehErroConflitoAgenda">
                    @if (ehErroConflitoAgenda) {
                      <strong>Cadastro bloqueado:</strong>
                    }
                    {{ erroEntrada }}
                  </div>
                }
              </div>

              @if (escala.entradas.length > 0) {
                <table class="tabela">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Horário</th>
                      <th>Atividade</th>
                      <th>Nome</th>
                      <th>Cap.</th>
                      <th>Dest.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (e of escala.entradas; track e.id) {
                      <tr>
                        <td>{{ e.dia }}</td>
                        <td class="nowrap">{{ e.horarioInicio }} – {{ e.horarioFim }}</td>
                        <td>{{ e.atividade }}</td>
                        <td [class.destaque]="e.destaque">{{ e.nomeConselheiro }}</td>
                        <td>{{ e.capacidadeMaxima ?? '–' }}</td>
                        <td>{{ e.destaque ? 'Sim' : '' }}</td>
                        <td>
                          <button class="btn-danger-sm" (click)="removerEntrada(escala.id, e.id)">✕</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="empty">Nenhuma entrada. Adicione acima.</p>
              }
            </div>
          }
        </div>
      }

      @if (!loading && escalas.length === 0) {
        <div class="empty-state">Nenhuma escala criada.</div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-header h2 { margin: 0; font-size: 1.5rem; color: #1e293b; }
    .form-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .form-card h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #334155; }
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      min-width: 0;
      flex: 1;
      background: #fff;
    }
    .input.select { flex: 0 0 auto; min-width: 100px; }
    .dropdown-conselheiros { position: relative; flex: 0 0 260px; }
    .dropdown-lista {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      max-height: 210px;
      overflow: auto;
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
      z-index: 20;
    }
    .dropdown-item {
      width: 100%;
      border: none;
      background: #fff;
      text-align: left;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #334155;
      cursor: pointer;
    }
    .dropdown-item:hover { background: #f1f5f9; }
    .input.input-sm { flex: 0 0 100px; }
    .input.input-xs { flex: 0 0 70px; }
    .btn-primary {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger-sm {
      padding: 0.25rem 0.625rem;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .loading, .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 2rem;
    }
    .erro { color: #dc2626; font-size: 0.8rem; margin-top: 0.5rem; }
    .erro-conflito {
      background: #fff7ed;
      border: 1px solid #fdba74;
      color: #9a3412;
      padding: 0.5rem 0.65rem;
      border-radius: 6px;
      margin-top: 0.65rem;
    }
    .escala-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .escala-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      cursor: pointer;
      background: #f8fafc;
    }
    .escala-header:hover { background: #f1f5f9; }
    .escala-nome { font-weight: 600; color: #1e293b; }
    .escala-datas { color: #64748b; font-size: 0.875rem; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .count { color: #94a3b8; font-size: 0.8rem; }
    .chevron { color: #94a3b8; font-size: 0.75rem; }
    .escala-body { padding: 1.25rem; border-top: 1px solid #e2e8f0; }
    .add-entrada-form { margin-bottom: 1.25rem; }
    .add-entrada-form h4 { margin: 0 0 0.75rem; font-size: 0.875rem; color: #475569; font-weight: 600; }
    .check-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; color: #475569; white-space: nowrap; }
    .chips { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      padding: 0.2rem 0.55rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .chip-remove {
      border: none;
      background: transparent;
      color: #1e3a8a;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      font-size: 0.75rem;
    }
    .hint { display: block; color: #64748b; margin-top: 0.4rem; font-size: 0.75rem; }
    .tabela { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .tabela th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .tabela td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .tabela tr:last-child td { border-bottom: none; }
    .tabela td.destaque { font-weight: 600; color: #1d4ed8; }
    .nowrap { white-space: nowrap; }
    .empty { color: #94a3b8; font-size: 0.875rem; margin: 0; padding: 0.5rem 0; }
  `],
})
export class GerenciarEscalasComponent implements OnInit {
  escalas: EscalaEventoDto[] = [];
  conselheiros: PessoaResumoDto[] = [];
  loading = true;
  salvando = false;
  adicionando = false;
  expandido: number | null = null;
  mostrarFormNovo = false;
  erroGlobal = '';
  erroEntrada = '';
  conselheiroBusca = '';
  mostrarDropdownConselheiros = false;
  DIAS = DIAS;

  novaEscala = { nome: '', dataInicio: '', dataFim: '' };
  novaEntrada = this.entradaVazia();

  private apiUrl = `${environment.apiUrl}/escalas`;
  private pessoaApiUrl = `${environment.apiUrl}/pessoa`;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await Promise.all([this.carregarEscalas(), this.carregarConselheiros()]);
  }

  async carregarEscalas() {
    this.loading = true;
    try {
      this.escalas = await firstValueFrom(this.http.get<EscalaEventoDto[]>(this.apiUrl));
    } catch {
      this.erroGlobal = 'Erro ao carregar escalas.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  toggleExpand(id: number) {
    this.expandido = this.expandido === id ? null : id;
    this.novaEntrada = this.entradaVazia();
    this.erroEntrada = '';
    this.conselheiroBusca = '';
    this.mostrarDropdownConselheiros = false;
    this.cdr.detectChanges();
  }

  async criarEscala() {
    if (!this.formularioEscalaValido()) return;
    this.salvando = true;
    this.erroGlobal = '';
    try {
      const criada = await firstValueFrom(
        this.http.post<EscalaEventoDto>(this.apiUrl, {
          nome: this.novaEscala.nome,
          dataInicio: this.novaEscala.dataInicio || null,
          dataFim: this.novaEscala.dataFim || null,
        })
      );
      this.escalas = [criada, ...this.escalas];
      this.novaEscala = { nome: '', dataInicio: '', dataFim: '' };
      this.mostrarFormNovo = false;
      this.expandido = criada.id;
    } catch (error: any) {
      this.erroGlobal = this.extrairMensagemErro(error, 'Erro ao criar escala.');
    } finally {
      this.salvando = false;
      this.cdr.detectChanges();
    }
  }

  async excluirEscala(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Excluir esta escala e todas as suas entradas?')) return;
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
      this.escalas = this.escalas.filter(e => e.id !== id);
      if (this.expandido === id) this.expandido = null;
    } catch {
      alert('Erro ao excluir escala.');
    }
    this.cdr.detectChanges();
  }

  async adicionarEntrada(escalaId: number) {
    if (!this.novaEntrada.dia || this.novaEntrada.nomesConselheiros.length === 0) return;
    this.adicionando = true;
    this.erroEntrada = '';
    try {
      const entrada = await firstValueFrom(
        this.http.post<EscalaEntradaDto>(`${this.apiUrl}/${escalaId}/entradas`, {
          dia: this.novaEntrada.dia,
          horarioInicio: this.novaEntrada.horarioInicio,
          horarioFim: this.novaEntrada.horarioFim,
          atividade: this.novaEntrada.atividade,
          nomesConselheiros: this.novaEntrada.nomesConselheiros,
          capacidadeMaxima: this.novaEntrada.capacidadeMaxima || null,
          destaque: this.novaEntrada.destaque,
        })
      );
      const escala = this.escalas.find(e => e.id === escalaId);
      if (escala) escala.entradas = [...escala.entradas, entrada];
      this.novaEntrada = this.entradaVazia();
      this.conselheiroBusca = '';
      this.mostrarDropdownConselheiros = false;
    } catch (error: any) {
      this.erroEntrada = this.extrairMensagemErro(error, 'Erro ao adicionar entrada.');
    } finally {
      this.adicionando = false;
      this.cdr.detectChanges();
    }
  }

  get conselheirosFiltrados() {
    const termo = this.conselheiroBusca.trim().toLowerCase();
    return this.conselheiros
      .filter(c => !this.novaEntrada.nomesConselheiros.includes(c.nome))
      .filter(c => !termo || c.nome.toLowerCase().includes(termo))
      .slice(0, 10);
  }

  adicionarConselheiroSelecionado(nome: string) {
    if (this.novaEntrada.nomesConselheiros.includes(nome)) {
      return;
    }

    this.novaEntrada.nomesConselheiros = [...this.novaEntrada.nomesConselheiros, nome];
    this.conselheiroBusca = '';
    this.mostrarDropdownConselheiros = false;
    this.cdr.detectChanges();
  }

  removerConselheiroSelecionado(nome: string) {
    this.novaEntrada.nomesConselheiros = this.novaEntrada.nomesConselheiros.filter(n => n !== nome);
    this.cdr.detectChanges();
  }

  selecionarPrimeiroConselheiroFiltrado(event: Event) {
    event.preventDefault();
    const primeiro = this.conselheirosFiltrados[0];
    if (primeiro) {
      this.adicionarConselheiroSelecionado(primeiro.nome);
    }
  }

  async removerEntrada(escalaId: number, entradaId: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${escalaId}/entradas/${entradaId}`));
      const escala = this.escalas.find(e => e.id === escalaId);
      if (escala) escala.entradas = escala.entradas.filter(e => e.id !== entradaId);
    } catch {
      alert('Erro ao remover entrada.');
    }
    this.cdr.detectChanges();
  }

  async carregarConselheiros() {
    try {
      this.conselheiros = await firstValueFrom(
        this.http.get<PessoaResumoDto[]>(`${this.pessoaApiUrl}/funcao/conselheiro`)
      );
    } catch {
      this.erroEntrada = 'Erro ao carregar conselheiros cadastrados.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private entradaVazia() {
    return {
      dia: '',
      horarioInicio: '',
      horarioFim: '',
      atividade: '',
      nomesConselheiros: [] as string[],
      capacidadeMaxima: null as number | null,
      destaque: false,
    };
  }

  private extrairMensagemErro(error: any, mensagemPadrao: string) {
    const resposta = error?.error;

    if (typeof resposta === 'string' && resposta.trim()) {
      return resposta;
    }

    if (resposta?.erro) {
      return resposta.erro;
    }

    if (resposta?.title) {
      return resposta.title;
    }

    if (resposta?.message) {
      return resposta.message;
    }

    if (resposta?.errors) {
      const mensagens = Object.values(resposta.errors).flat() as string[];
      if (mensagens.length > 0) {
        return mensagens[0];
      }
    }

    return mensagemPadrao;
  }

  get ehErroConflitoAgenda() {
    return this.erroEntrada.toLowerCase().includes('conflito de agenda');
  }

  formularioEscalaValido() {
    return !!this.novaEscala.nome.trim() && !!this.novaEscala.dataInicio && !!this.novaEscala.dataFim;
  }
}
