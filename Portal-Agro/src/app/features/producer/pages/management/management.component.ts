import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductService } from '../../../../shared/services/product/product.service';
import { finalize } from 'rxjs';
import { ProductSelectModel } from '../../../../shared/models/product/product.model';

@Component({
  selector: 'app-management',
  imports: [MatTabsModule, RouterOutlet, RouterLink, RouterLinkActive,CommonModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.css'
})
export class ManagementComponent implements OnInit{
  private productService = inject(ProductService);
 tabs = [
    { label: 'Productos', path: 'product' },
    { label: 'Fincas', path: 'farm' }
  ];
   lowStockProducts: ProductSelectModel[] = [];
  loadingLowStock = false;
  errorLoadingLowStock = false;

  ngOnInit(): void {
    this.loadLowStockProducts();
  }

  private loadLowStockProducts(): void {
    this.loadingLowStock = true;
    this.errorLoadingLowStock = false;

    this.productService
      .getLowStockByProducer()
      .pipe(finalize(() => (this.loadingLowStock = false)))
      .subscribe({
        next: (products) => (this.lowStockProducts = products ?? []),
        error: () => (this.errorLoadingLowStock = true),
      });
  }
}
