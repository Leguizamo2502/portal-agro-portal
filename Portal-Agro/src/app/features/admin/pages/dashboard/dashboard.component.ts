import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AdminDashboard, OrderStatusBucket, TopProducerStat, TopProductStat } from '../../models/dashboard.model';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { StatusTranslatePipe } from '../../../../shared/pipes/StatusTranslatePipe/status-translate-pipe.pipe';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule,BaseChartDirective,StatusTranslatePipe],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = false;
  error?: string;
  private translate = new StatusTranslatePipe(); 

  data?: AdminDashboard;

  topLimit = 5;

  public funnelLegend = [
    { label: 'Pendiente / Revisión', color: '#9e9e9e' }, // Gris
    { label: 'Aceptado / Esperando Pago', color: '#1976d2' }, // Azul
    { label: 'Pago Enviado / Revisión', color: '#ff9800' }, // Naranja
    { label: 'Listo / Despachado', color: '#7b1fa2' }, // Morado
    { label: 'Completado', color: '#388e3c' }, // Verde
    { label: 'Cancelado / Otros', color: '#607d8b' } // Gris Azulado
  ];

  // ================== CHART.JS: Funnel (bar horizontal) ==================
  orderFunnelBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          color: '#909090',
          font: { size: 11 }
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#424242',
          font: {
            size: 12,
            weight: 'bold'
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        cornerRadius: 8,
        displayColors: false
      },
    },
    layout: {
      padding: {
        right: 20
      }
    }
  };

  // ================== CHART.JS: Resumen pagos (doughnut) ==================
  paymentDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [],
  };

  paymentDoughnutOptions: ChartOptions<'doughnut'> = {
    animation: {
    animateRotate: true,
    animateScale: true,
    duration: 900,
  },
    responsive: true,
    maintainAspectRatio: false,
    radius: '100%',
    cutout: '0%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'start',
        labels: {
          boxWidth: 30,
          font: { size: 12 },
        }
      },
    },
    layout: {
      padding: {
        left: 20
      }
    }
  };
  

  constructor(private dashboardSrv: AdminDashboardService) {}

  public orderFunnelBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

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
      labels: buckets.map((b) => this.translate.transform(b.status)),
      datasets: [
        {
          data: buckets.map((b) => b.count),
          label: 'Pedidos',
          backgroundColor: buckets.map((b) => this.getStatusColor(b.status)),
          
          barPercentage: 0.6,
          categoryPercentage: 0.9,
          borderRadius: 6,
          borderSkipped: false,
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