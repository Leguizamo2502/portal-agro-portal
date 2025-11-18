import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AdminDashboard, OrderStatusBucket, TopProducerStat, TopProductStat } from '../../models/dashboard.model';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule,BaseChartDirective],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = false;
  error?: string;

  data?: AdminDashboard;

  topLimit = 5;

  // ================== CHART.JS: Funnel (bar horizontal) ==================
  orderFunnelBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  orderFunnelBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // barras horizontales
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  // ================== CHART.JS: Resumen pagos (doughnut) ==================
  paymentDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [],
  };

  paymentDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  constructor(private dashboardSrv: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.error = undefined;

    this.dashboardSrv.getOverview(this.topLimit).subscribe({
      next: (res) => {
        this.data = res;
        this.buildFunnelChart();
        this.buildPaymentChart();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el dashboard.';
        this.loading = false;
      },
    });
  }

  onChangeTopLimit(limit: number): void {
    this.topLimit = Number(limit);
    this.loadOverview();
  }

  // ================== Helpers generales ==================

  getFunnelBuckets(): OrderStatusBucket[] {
    if (!this.data) return [];
    return [...this.data.orderFunnel.buckets].sort((a, b) => b.count - a.count);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PendingReview':
      case 'PendingAcceptance':
        return '#9e9e9e'; // gris
      case 'AcceptedAwaitingPayment':
      case 'AwaitingPaymentProof':
        return '#1976d2'; // azul
      case 'PaymentSubmitted':
      case 'PaymentProofPendingReview':
        return '#ff9800'; // naranja
      case 'ReadyForDelivery':
      case 'Dispatched':
        return '#7b1fa2'; // morado
      case 'Completed':
      case 'CompletedWithProof':
        return '#388e3c'; // verde
      default:
        return '#607d8b'; // gris azulado
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  trackByProducer = (_: number, item: TopProducerStat) => item.producerId;
  trackByProduct = (_: number, item: TopProductStat) => item.productId;

  // ================== Mapeos a gráficos ==================

  private buildFunnelChart(): void {
    if (!this.data) return;

    const buckets = this.getFunnelBuckets();

    this.orderFunnelBarData = {
      labels: buckets.map((b) => b.status),
      datasets: [
        {
          data: buckets.map((b) => b.count),
          label: 'Pedidos',
          borderWidth: 1,
          backgroundColor: buckets.map((b) => this.getStatusColor(b.status)),
        },
      ],
    };
  }

  private buildPaymentChart(): void {
    if (!this.data) return;

    const p = this.data.payments;

    const labels = [
      'Por aceptación',
      'Esperando comprobante',
      'Comprobante en revisión',
      'Listos para entrega',
      'Finalizados con comprobante',
    ];

    const values = [
      p.pendingAcceptance,
      p.awaitingPaymentProof,
      p.paymentProofPendingReview,
      p.readyForDelivery,
      p.completedWithProof,
    ];

    this.paymentDoughnutData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#9e9e9e',
            '#1976d2',
            '#ff9800',
            '#7b1fa2',
            '#388e3c',
          ],
        },
      ],
    };
  }
}