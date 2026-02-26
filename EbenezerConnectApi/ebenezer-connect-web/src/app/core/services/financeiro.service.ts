import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinanceiroHistorico, ReverterFinanceiroDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FinanceiroService {
  private apiUrl = `${environment.apiUrl}/financeiro`;

  constructor(private http: HttpClient) {}

  getHistorico(): Observable<FinanceiroHistorico[]> {
    return this.http.get<FinanceiroHistorico[]>(`${this.apiUrl}/historico`);
  }

  reverter(dto: ReverterFinanceiroDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/reverter`, dto);
  }
}
