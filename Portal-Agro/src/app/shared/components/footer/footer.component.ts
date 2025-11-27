import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  email: string = 'portalagrocomercialhuila@gmail.com';
  location: string = 'Neiva, Huila  Colombia';

 
  appDownloadUrl: string = 'https://example.com/app.apk';

}
