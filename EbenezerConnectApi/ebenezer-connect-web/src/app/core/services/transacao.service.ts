import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistrarTransacaoDto } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {
  private apiUrl = `${environment.apiUrl}/transacaocantina`;

  constructor(private http: HttpClient) {}

  registrarTransacao(data: RegistrarTransacaoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar`, data);
  }
}
