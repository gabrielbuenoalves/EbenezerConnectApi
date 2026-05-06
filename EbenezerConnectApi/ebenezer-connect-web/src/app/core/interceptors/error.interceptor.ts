import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isAuthRequest = /\/auth\/(login|register|confirmar-email|redefinir-senha)/i.test(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest && !!authService.getToken()) {
        authService.logout();
      }

      let errorMessage = 'Ocorreu um erro desconhecido';
      
      if (error.error instanceof ErrorEvent) {
        // Erro do lado do cliente
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        // Erro do lado do servidor
        if (typeof error.error === 'string' && error.error.trim()) {
          errorMessage = error.error;
        } else if (error.error?.erro) {
          errorMessage = error.error.erro;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.error?.errors) {
          const mensagens = Object.values(error.error.errors).flat() as string[];
          errorMessage = mensagens[0] || error.message || `Erro ${error.status}`;
        } else {
          errorMessage = error.message || `Erro ${error.status}`;
        }
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};
