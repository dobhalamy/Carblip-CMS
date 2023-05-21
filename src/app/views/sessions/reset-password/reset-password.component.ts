import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButton, MatProgressBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/shared/services/auth/auth.service';
import { CustomValidators } from 'ng2-validation';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  resetPasswordForm: FormGroup;
  error;
  resetData={
    email: "",
    password: "",
    password_confirmation: "",
    token: ""
  }
  constructor(private authService$: AuthService,private snack$: MatSnackBar,
    private fb: FormBuilder,private router:Router,
    private route: ActivatedRoute) {
      this.route.params.subscribe(params => {
        this.resetData.token = params.token;
      });
      this.route.queryParams.subscribe(params=>{
        this.resetData.email = params['email'];
      })
    }

  ngOnInit() {
    const password = new FormControl('', [Validators.required,Validators.minLength(6),]);
    const confirmPassword = new FormControl(
      '',
      CustomValidators.equalTo(password)
    );

    const formFields = {
			password: password,
			confirmPassword: confirmPassword,
		};
		this.resetPasswordForm = this.fb.group(formFields);
  }

  resetPassword() { 
    this.resetData.password= this.resetPasswordForm.get('password').value;
    this.resetData.password_confirmation= this.resetPasswordForm.get('confirmPassword').value;
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
    this.authService$
      .resetPassword(this.resetData)
    .subscribe(res => {
      this.progressBar.mode = 'determinate';
      if (res) {
        this.submitButton.disabled = false;
        this.router.navigate(['/sessions/signin']);
      } else {
        this.error = res.error.message
        this.submitButton.disabled = false;
      }
    });
  }
}
