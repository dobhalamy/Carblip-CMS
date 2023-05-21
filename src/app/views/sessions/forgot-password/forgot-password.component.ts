import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButton, MatProgressBar ,MatSnackBar} from '@angular/material';
import { AuthService } from 'app/shared/services/auth/auth.service';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  userEmail;
  error='';
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;
  constructor(private authService$: AuthService,private snack$: MatSnackBar,) {}

  ngOnInit() {}
  submitEmail() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
    this.authService$
    .forgotPassword(this.userEmail)
    .subscribe(res => {
      this.progressBar.mode = 'determinate';
      if (res) {
        this.submitButton.disabled = false;
        this.snack$.open('Please check you email to reset password', 'OK', {
          duration: 4000,
        });
      } else {
        this.error = res.error.message
        this.submitButton.disabled = false;
      }
    });
  }
}
