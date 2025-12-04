import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PENDING_TWO_FACTOR_EMAIL_KEY } from '../../../../Core/constants/auth.constants';
import { TwoFactorVerificationModel } from '../../../../Core/Models/login.model';
import { AuthService } from '../../../../Core/services/auth/auth.service';
import { AuthState } from '../../../../Core/services/auth/auth.state';

@Component({
  selector: 'app-two-factor',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './two-factor.component.html',
  styleUrl: './two-factor.component.css',
})
export class TwoFactorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private authState = inject(AuthState);

  email = '';
  loading = false;

  formCode: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const navigationEmail = navigation?.extras?.state?.['email'] as string | undefined;

    this.email = navigationEmail || sessionStorage.getItem(PENDING_TWO_FACTOR_EMAIL_KEY) || '';

    if (!this.email) {
      this.router.navigate(['/auth/login']);
    } else {
      sessionStorage.setItem(PENDING_TWO_FACTOR_EMAIL_KEY, this.email);
    }
  }

  get codeControl() {
    return this.formCode.get('code');
  }

  getErrorMessage(field: string): string {
    const control = this.formCode.get(field);
    if (control?.hasError('required')) {
      return 'El código es requerido';
    }
    if (control?.hasError('minlength') || control?.hasError('maxlength')) {
      return 'El código debe tener 6 caracteres';
    }
    return '';
  }

  confirmCode() {
    if (this.formCode.invalid || this.loading || !this.email) {
      this.formCode.markAllAsTouched();
      return;
    }

    const payload: TwoFactorVerificationModel = {
      email: this.email,
      code: String(this.formCode.value.code ?? '').trim(),
    };

    this.loading = true;

    Swal.fire({
      title: 'Verificando código...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.authService
      .ConfirmTwoFactorLogin(payload)
      .pipe(
        take(1),
        switchMap(() => this.authState.loadMe()),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (me) => {
          Swal.close();
          sessionStorage.removeItem(PENDING_TWO_FACTOR_EMAIL_KEY);

          if (!me) {
            Swal.fire({
              icon: 'error',
              title: 'No se pudo cargar tu sesión',
              text: 'Intenta nuevamente.',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Código verificado. Inicio de sesión exitoso.',
          });
          this.router.navigateByUrl('/home');
        },
        error: (err) => {
          Swal.close();
          const msg =
            err?.status === 401
              ? 'Código inválido o expirado.'
              : err?.error?.message || 'No se pudo verificar el código.';
          Swal.fire({ icon: 'error', title: 'Oops...', text: msg });
        },
      });
  }
}