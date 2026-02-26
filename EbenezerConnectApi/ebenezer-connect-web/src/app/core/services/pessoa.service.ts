import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pessoa, AtualizarPessoaDto, AdicionarCreditoDto } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PessoaService {
  private apiUrl = `${environment.apiUrl}/pessoa`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.apiUrl);
  }

  getById(id: number): Observable<Pessoa> {
    return this.http.get<Pessoa>(`${this.apiUrl}/${id}`);
  }

  getByFuncao(funcao: string): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(`${this.apiUrl}/funcao/${funcao}`);
  }

  update(id: number, data: AtualizarPessoaDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  adicionarCredito(data: AdicionarCreditoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/creditos`, data);
  }

  importarExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('arquivo', file);
    return this.http.post(`${this.apiUrl}/importar-excel`, formData);
  }

  importarPessoasJson(dados: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/importar-json`, dados);
  }
}
