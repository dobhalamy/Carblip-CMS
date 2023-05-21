import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { environment as env } from 'environments/environment';
import { Observable, TimeoutError } from 'rxjs';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/timeout';

import { AUTH } from 'app/core/errors';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { AppState } from 'app/store';
import { LogoutSuccessful } from 'app/store/auth/authentication.action';
import { AddError } from 'app/store/error/error.actions';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private store$: Store<AppState>,
    private router$: Router,
    private injector: Injector,
    private authService: AuthService,
    private snack$: MatSnackBar
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const timeout =
      Number(request.headers.get('timeout')) || env.requestTimeout;

    return next
      .handle(request)
      .timeout(timeout)
      .do(
        (event: HttpEvent<any>) => {
          const body = event['body'];
          if (event['status'] === 200) {
            if (body.message) {
              this.snack$.open(body.message, 'OK', {
                duration: 5000,
              });
            }
          }
        },
        (error: any) => {
          /*
           * Handled timeout over error
           */
          if (error instanceof TimeoutError) {
            this.store$.dispatch(
              new AddError({
                type: AUTH.TYPE,
                message: AUTH.NO_INTERNET,
              })
            );
          } else if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              this.unauthorizedHandler(error);
            } else {
              this.standardHandler(error);
            }
          }
        }
      );
  }

  /*
   * Handled 401 - unauthroized error response
   * @param error object
   */
  unauthorizedHandler(error) {
    if (this.authService.isLoggedIn()) {
      this.store$.dispatch(
        new AddError({
          type: AUTH.TYPE,
          message: AUTH.SESSION_EXPIRED,
        })
      );
      this.store$.dispatch(new LogoutSuccessful());
    }
  }

  /*
   * Handled Standard Errors
   * @param error object
   */
  standardHandler(error) {
    if (error.error && error.error.message) {
      this.snack$.open(error.error.message, 'OK', {
        duration: 5000,
        panelClass: ['danger-snack'],
      });
    } else if (error.error && error.error.errors) {
      if (typeof error.error.errors === 'object') {
        const errorData = error.error.errors;
        const message = Object.keys(errorData).map(key => errorData[key]);
        this.snack$.open(message[0], 'OK', {
          duration: 5000,
          panelClass: ['danger-snack'],
        });
      }
    }
  }
}
