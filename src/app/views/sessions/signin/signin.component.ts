import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton, MatProgressBar } from '@angular/material';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { AuthService } from 'app/shared/services/auth/auth.service';
import { LocalStorageService } from 'app/shared/services/local-storage.service';
import { AppState } from 'app/store';
import * as actions from 'app/store/auth/authentication.action';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  signinForm: FormGroup;
  error: null;
  constructor(
    private authService$: AuthService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private router$: Router,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    if (this.authService$.isLoggedIn()) {
      this.router$.navigate(['/dashboard']);
    }
    this.signinForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false, Validators.required],
    });
  }

  signin() {
    const signinData = this.signinForm.value;

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
    this.error = null;
    this.authService$
      .login(signinData.email, signinData.password)
      .pipe(
        map(result => result),
        catchError(error => of(error))
      )
      .subscribe(res => {
        this.progressBar.mode = 'determinate';
        if (res.token_type) {
          this.localStorageService.storeAuthorization(
            `${res.token_type} ${res.access_token}`
          );
          this.store.dispatch(new actions.LoginSuccessful(res));
        } else {
          this.error = res.error.message
          this.submitButton.disabled = false;
        }
      });
  }
}
