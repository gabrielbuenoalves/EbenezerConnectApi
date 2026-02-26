import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PessoaService } from '../../../core/services/pessoa.service';
import { AuthService } from '../../../core/services/auth.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-importar-pessoas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="import-container">
      <div class="import-card">
        <div class="header">
          <h1>Importar Acampantes via Excel</h1>
          <p>Faça upload de uma planilha Excel para cadastrar múltiplos acampantes</p>
        </div>

        <div class="instructions">
          <h3>Instruções:</h3>
          <ol>
            <li>Baixe o <a href="#" (click)="downloadTemplate($event)">modelo de planilha</a></li>
            <li>Abra o arquivo no Excel (ou Google Sheets)</li>
            <li>Preencha os dados dos acampantes nas linhas seguintes</li>
            <li>Salve em formato Excel (.xlsx)</li>
            <li>Faça o upload do arquivo preenchido</li>
          </ol>
          
          <div class="info-box">
            <strong>Formato esperado:</strong>
            <ul>
              <li><strong>Coluna A:</strong> Nome completo (obrigatório)</li>
              <li><strong>Coluna B:</strong> E-mail (obrigatório)</li>
              <li><strong>Coluna C:</strong> CPF - apenas números (obrigatório)</li>
              <li><strong>Coluna D:</strong> Função (acampante, conselheiro ou admin)</li>
            </ul>
            <p class="note">
              <strong>Nota importante:</strong> Uma senha temporária será gerada automaticamente com os primeiros 6 dígitos do CPF. Os usuários deverão alterar a senha no primeiro acesso.
            </p>
          </div>
        </div>

        <div class="upload-area" 
             [class.drag-over]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)">
          <input 
            type="file" 
            #fileInput 
            (change)="onFileSelected($event)" 
            accept=".xlsx,.xls"
            style="display: none;"
          />
          
          <div class="upload-content" *ngIf="!selectedFile">
            <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Arraste o arquivo Excel aqui ou</p>
            <button type="button" class="btn-select" (click)="fileInput.click()">
              Selecionar Arquivo
            </button>
          </div>

          <div class="file-selected" *ngIf="selectedFile && !uploading">
            <svg class="file-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8" stroke="white" fill="none"></polyline>
            </svg>
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
            <button type="button" class="btn-remove" (click)="removeFile()">
              Remover
            </button>
          </div>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <div class="success-message" *ngIf="successMessage">
          <div class="success-content">
            <span class="success-icon">✓</span>
            <div class="success-text">
              <strong>Importação Concluída!</strong>
              <p>{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <div class="loading" *ngIf="uploading">
          <div class="spinner"></div>
          <p>Processando arquivo...</p>
        </div>

        <div class="actions">
          <button 
            type="button" 
            class="btn-primary" 
            [disabled]="!selectedFile || uploading"
            (click)="uploadFile()">
            <span *ngIf="!uploading">Importar</span>
            <span *ngIf="uploading">Importando...</span>
          </button>
          <button type="button" class="btn-secondary" [routerLink]="['/pessoas']">
            Voltar
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./importar-pessoas.component.scss']
})
export class ImportarPessoasComponent {
  selectedFile: File | null = null;
  isDragOver = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  resultado: any = null;

  constructor(
    private pessoaService: PessoaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Verificar permissão
    const user = this.authService.getCurrentUser();
    if (!user || !this.authService.isAdminOrConselheiro()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  validateAndSetFile(file: File): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.resultado = null;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.errorMessage = 'Formato inválido. Selecione um arquivo Excel (.xlsx ou .xls)';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.errorMessage = 'Arquivo muito grande. O tamanho máximo é 10MB.';
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    this.resultado = null;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.resultado = null;
    this.cdr.markForCheck();

    console.log('[Upload] Iniciando envio do arquivo:', this.selectedFile.name);

    this.pessoaService.importarExcel(this.selectedFile).subscribe({
      next: (response) => {
        console.log('[Upload] Resposta recebida:', response);
        console.log('[Upload] Tipo da resposta:', typeof response);
        
        this.uploading = false;
        this.resultado = response;
        this.cdr.markForCheck();

        const importados = Number(response?.importados ?? 0);
        const erros = Number(response?.erros ?? 0);

        console.log(`[Upload] Importados: ${importados}, Erros: ${erros}`);
        console.log(`[Upload] successMessage antes:`, this.successMessage);

        if (importados > 0 && erros === 0) {
          this.successMessage = `${importados} pessoa(s) cadastrada(s) com sucesso. Os dados foram importados ao sistema.`;
        } else if (importados > 0) {
          this.successMessage = `${importados} pessoa(s) cadastrada(s). Verifique os detalhes de ${erros} erro(s) abaixo.`;
        } else {
          this.errorMessage = '❌ Nenhuma pessoa foi importada. Verifique os detalhes abaixo.';
        }
        
        console.log(`[Upload] successMessage depois:`, this.successMessage);
        console.log(`[Upload] errorMessage:`, this.errorMessage);
        
        this.cdr.detectChanges();
        
        // Auto-scroll para ver a mensagem
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);

        // Auto-remover mensagem de sucesso após 8 segundos
        if (importados > 0) {
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 8000);
        }
      },
      error: (error) => {
        console.error('[Upload] Erro na importação:', error);
        this.uploading = false;
        this.cdr.markForCheck();
        
        let mensagemErro = 'Erro ao importar arquivo. Tente novamente.';
        
        if (error.status === 400) {
          mensagemErro = error.error?.mensagem || 'Arquivo inválido. Certifique-se de que é um Excel válido com formato correto.';
        } else if (error.status === 401) {
          mensagemErro = 'Você não tem permissão para importar. Apenas administradores e conselheiros podem fazer isso.';
        } else if (error.status === 500) {
          mensagemErro = error.error?.mensagem || 'Erro no servidor ao processar o arquivo.';
        } else if (error.status === 0) {
          mensagemErro = 'Erro de conexão com o servidor.';
        }
        
        this.errorMessage = mensagemErro;
        this.cdr.detectChanges();
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  downloadTemplate(event: Event): void {
    event.preventDefault();
    
    // Cria um Excel de verdade com os dados de exemplo
    const data = [
      ['Nome', 'Email', 'CPF', 'Funcao'],
      ['João Silva', 'joao@email.com', '12345678901', 'acampante'],
      ['Maria Santos', 'maria@email.com', '98765432109', 'conselheiro']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Acampantes");
    
    // Define largura das colunas
    worksheet['!cols'] = [
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 15 }, // CPF
      { wch: 15 }  // Funcao
    ];
    
    XLSX.writeFile(workbook, 'template-importacao-acampantes.xlsx');
  }
}
