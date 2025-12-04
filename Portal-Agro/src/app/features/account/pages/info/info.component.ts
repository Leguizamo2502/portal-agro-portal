import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { AuthService } from '../../../../Core/services/auth/auth.service';
import { UserSelectModel } from '../../../../Core/Models/user.model';
import { ButtonComponent } from "../../../../shared/components/button/button.component";

@Component({
  selector: 'app-info',
  imports: [CommonModule, MatIconModule, MatSlideToggleModule, ButtonComponent],
  templateUrl: './info.component.html',
  styleUrl: './info.component.css'
})
export class InfoComponent implements OnInit {

  authService = inject(AuthService);
  person?: UserSelectModel;
  isUpdating2FA = false;

  ngOnInit(): void {
    this.loadPerson();
  }

  loadPerson() {
    this.authService.GetDataBasic().subscribe((data) => {
      this.person = data;
      console.log("Usuario cargado:", data);
    });
  }

  onToggleTwoFactor(event: any) {
    if (!this.person) return;

    const enabled = event.checked;

    this.isUpdating2FA = true;

    this.authService.UpdateTwoFactorPreference(enabled).subscribe({
      next: () => {
        if (this.person) {
          this.person.isTwoFactorEnabled = enabled;
        }
        this.isUpdating2FA = false;
      },
      error: (err) => {
        console.error("Error al actualizar 2FA:", err);
        // Revertir el toggle si hubo error
        if (this.person) {
          this.person.isTwoFactorEnabled = !enabled;
        }
        this.isUpdating2FA = false;
      }
    });
  }
}
