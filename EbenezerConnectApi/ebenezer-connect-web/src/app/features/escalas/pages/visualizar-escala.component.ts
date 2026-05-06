import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
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

interface EscalaEventoDto {
  id: number;
  nome: string;
  dataInicio?: string;
  dataFim?: string;
  entradas: EscalaEntradaDto[];
}

interface ConselheiroItem {
  nome: string;
  destaque: boolean;
}

interface AtividadeGroup {
  atividade: string;
  capacidadeMaxima?: number;
  conselheiros: ConselheiroItem[];
}

interface TurnoGroup {
  horarioInicio: string;
  horarioFim: string;
  atividades: AtividadeGroup[];
}

interface DiaGroup {
  dia: string;
  label: string;
  turnos: TurnoGroup[];
}

const DIA_ORDER = ['QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
const DIA_LABELS: Record<string, string> = {
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

@Component({
  selector: 'app-visualizar-escala',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Ebenezer</h1>
        <p>Escala de Conselheiros</p>
      </div>

      @if (loading) {
        <div class="loading">Carregando escala...</div>
      }

      @if (erro) {
        <div class="erro">{{ erro }}</div>
      }

      @if (!loading && !erro && escalas.length > 1) {
        <div class="selector">
          <label>Selecione o evento</label>
          <div class="opcoes">
            @for (e of escalas; track e.id) {
              <button
                [class.active]="escalaSelecionada?.id === e.id"
                (click)="selecionarEscala(e)">
                {{ e.nome }}
              </button>
            }
          </div>
        </div>
      }

      @if (escalaSelecionada) {
        <div class="escala-nome">{{ escalaSelecionada.nome }}</div>

        <div class="dias-tabs">
          @for (dia of diasDisponiveis; track dia) {
            <button
              [class.active]="diaAtivo === dia"
              (click)="diaAtivo = dia"
              class="dia-tab">
              {{ DIA_LABELS[dia] }}
            </button>
          }
        </div>

        @for (diaGroup of diasAgrupados; track diaGroup.dia) {
          @if (diaGroup.dia === diaAtivo) {
            <div class="dia-content">
              @for (turno of diaGroup.turnos; track turno.horarioInicio + turno.horarioFim) {
                <div class="turno-card">
                  <div class="turno-header">
                    {{ turno.horarioInicio }} – {{ turno.horarioFim }}
                  </div>
                  <div class="atividades">
                    @for (atv of turno.atividades; track atv.atividade) {
                      <div class="atividade">
                        <div class="atividade-nome">
                          {{ atv.atividade }}
                          @if (atv.capacidadeMaxima) {
                            <span class="cap">({{ atv.capacidadeMaxima }})</span>
                          }
                        </div>
                        <div class="conselheiros">
                          @for (c of atv.conselheiros; track c.nome) {
                            <span class="chip" [class.destaque]="c.destaque">{{ c.nome }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      background: #0f172a;
      padding: 1.5rem 1rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      color: #f8fafc;
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }
    .header p {
      color: #94a3b8;
      margin: 0.25rem 0 0;
    }
    .loading, .erro {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }
    .erro { color: #f87171; }
    .selector {
      margin-bottom: 1.5rem;
    }
    .selector label {
      display: block;
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .opcoes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .opcoes button, .dia-tab {
      padding: 0.5rem 1rem;
      border: 1px solid #334155;
      background: #1e293b;
      color: #94a3b8;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }
    .opcoes button.active, .dia-tab.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
    .escala-nome {
      color: #f8fafc;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-align: center;
    }
    .dias-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .turno-card {
      background: #1e293b;
      border-radius: 10px;
      margin-bottom: 1rem;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .turno-header {
      background: #0f172a;
      color: #3b82f6;
      font-weight: 700;
      padding: 0.625rem 1rem;
      font-size: 0.9rem;
      border-bottom: 1px solid #334155;
    }
    .atividades {
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .atividade-nome {
      color: #cbd5e1;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }
    .cap {
      color: #64748b;
      font-weight: 400;
      margin-left: 0.25rem;
    }
    .conselheiros {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }
    .chip {
      background: #334155;
      color: #f8fafc;
      border-radius: 9999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
    }
    .chip.destaque {
      background: #1d4ed8;
      font-weight: 600;
    }
  `],
})
export class VisualizarEscalaComponent implements OnInit {
  escalas: EscalaEventoDto[] = [];
  escalaSelecionada: EscalaEventoDto | null = null;
  diasAgrupados: DiaGroup[] = [];
  diasDisponiveis: string[] = [];
  diaAtivo = '';
  loading = true;
  erro = '';
  DIA_LABELS = DIA_LABELS;

  private apiUrl = `${environment.apiUrl}/escalas`;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.http.get<EscalaEventoDto[]>(this.apiUrl));
      this.escalas = data;
      if (data.length === 1) {
        this.selecionarEscala(data[0]);
      } else if (data.length === 0) {
        this.erro = 'Nenhuma escala disponível.';
      }
    } catch {
      this.erro = 'Erro ao carregar escala.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  selecionarEscala(escala: EscalaEventoDto) {
    this.escalaSelecionada = escala;
    this.diasAgrupados = this.agrupar(escala.entradas);
    this.diasDisponiveis = this.diasAgrupados.map(d => d.dia);
    this.diaAtivo = this.diasDisponiveis[0] ?? '';
    this.cdr.detectChanges();
  }

  private agrupar(entradas: EscalaEntradaDto[]): DiaGroup[] {
    const diaMap = new Map<string, Map<string, Map<string, AtividadeGroup>>>();

    for (const e of entradas) {
      if (!diaMap.has(e.dia)) diaMap.set(e.dia, new Map());
      const turnoKey = `${e.horarioInicio}|${e.horarioFim}`;
      const turnoMap = diaMap.get(e.dia)!;
      if (!turnoMap.has(turnoKey)) turnoMap.set(turnoKey, new Map());
      const atvMap = turnoMap.get(turnoKey)!;
      if (!atvMap.has(e.atividade)) {
        atvMap.set(e.atividade, {
          atividade: e.atividade,
          capacidadeMaxima: e.capacidadeMaxima,
          conselheiros: [],
        });
      }
      const nomes = e.nomeConselheiro
        .split(',')
        .map(nome => nome.trim())
        .filter(nome => nome.length > 0);

      for (const nome of nomes) {
        atvMap.get(e.atividade)!.conselheiros.push({ nome, destaque: e.destaque });
      }
    }

    const result: DiaGroup[] = [];
    for (const dia of DIA_ORDER) {
      if (!diaMap.has(dia)) continue;
      const turnoMap = diaMap.get(dia)!;
      const turnos: TurnoGroup[] = [];
      for (const [key, atvMap] of turnoMap) {
        const [horarioInicio, horarioFim] = key.split('|');
        turnos.push({ horarioInicio, horarioFim, atividades: Array.from(atvMap.values()) });
      }
      turnos.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
      result.push({ dia, label: DIA_LABELS[dia], turnos });
    }
    return result;
  }
}
