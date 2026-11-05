import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, ToastController } from '@ionic/angular';
import * as d3 from 'd3';
import { Tab3Service } from './tab3.service';

interface ChartInput {
  labels: string[];
  data: Array<number | string>;
}
interface Punto {
  label: string;
  value: number;
}

const MARGIN = { top: 20, right: 20, bottom: 30, left: 34 };
const COLORES_ESTADO: Record<string, string> = {
  Pendiente: '#f1c40f',
  Leyendo: '#3498db',
  'Leído': '#2ecc71',
};

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class Tab3Page {
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('ratingChart') ratingChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLDivElement>;

  public metrics = { total_users: 0, total_books: 0, reading_books: 0, read_books: 0 };

  constructor(
    private tab3Service: Tab3Service,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.loadDashboard();
  }

  async loadDashboard() {
    try {
      const data = await this.tab3Service.getDashboardData();
      if (!data?.success) {
        this.presentToast('No se pudo cargar el dashboard');
        return;
      }

      this.metrics = data.metrics;
      this.cdr.detectChanges(); // pinta los contenedores antes de dibujar los SVG

      // Limpiar contenedores
      for (const ref of [this.statusChartRef, this.ratingChartRef, this.trendChartRef]) {
        d3.select(ref.nativeElement).selectAll('*').remove();
      }

      this.drawDonutChart(this.toPuntos(data.status_chart));
      this.drawBarChart(this.toPuntos(data.rating_chart));
      this.drawLineChart(this.toPuntos(data.trend_chart));
    } catch (error: any) {
      console.error('Error al cargar dashboard', error);
      this.presentToast(error.response?.data?.message || 'Sin conexión: no se pudo cargar el dashboard');
    }
  }

  private toPuntos(chart: ChartInput | undefined): Punto[] {
    if (!chart || !Array.isArray(chart.labels)) {
      return [];
    }
    return chart.labels.map((label, i) => ({ label: String(label), value: Number(chart.data?.[i]) || 0 }));
  }

  /** SVG responsivo (viewBox) con un <g> ya desplazado por los márgenes */
  private crearSvg(host: HTMLElement, width: number, height: number, margin = MARGIN) {
    const svg = d3
      .select(host)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .style('max-width', `${width}px`)
      .style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    return { svg, g, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };
  }

  private mensajeVacio(host: HTMLElement, texto = 'Sin datos todavía') {
    d3.select(host).append('p').style('text-align', 'center').style('color', '#999').text(texto);
  }

  // 1. GRÁFICA DE DONA (Estados) con leyenda
  private drawDonutChart(data: Punto[]) {
    const host = this.statusChartRef.nativeElement;
    const total = d3.sum(data, (d) => d.value);
    if (data.length === 0 || total === 0) {
      this.mensajeVacio(host);
      return;
    }

    const width = 320;
    const height = 220;
    const radius = 90;
    const color = d3
      .scaleOrdinal<string, string>()
      .domain(Object.keys(COLORES_ESTADO))
      .range(Object.values(COLORES_ESTADO))
      .unknown('#95a5a6');

    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').style('max-width', `${width}px`);
    const g = svg.append('g').attr('transform', `translate(${radius + 15},${height / 2})`);

    const pie = d3.pie<Punto>().sort(null).value((d) => d.value);
    const arc = d3.arc<d3.PieArcDatum<Punto>>().innerRadius(radius * 0.55).outerRadius(radius);

    g.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('fill', (d) => color(d.data.label))
      .attr('d', (d) => arc(d) ?? '')
      .style('opacity', 0.92);

    g.append('text').text(String(total)).attr('text-anchor', 'middle').attr('dy', '0.1em').style('font-size', '22px').style('font-weight', '600').style('fill', '#444');
    g.append('text').text('libros').attr('text-anchor', 'middle').attr('dy', '1.6em').style('font-size', '11px').style('fill', '#888');

    // Leyenda
    const legend = svg.append('g').attr('transform', `translate(${radius * 2 + 40},${height / 2 - data.length * 12})`);
    data.forEach((d, i) => {
      const row = legend.append('g').attr('transform', `translate(0,${i * 24})`);
      row.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', color(d.label));
      row.append('text').attr('x', 18).attr('y', 10).style('font-size', '12px').style('fill', '#555').text(`${d.label}: ${d.value}`);
    });
  }

  // 2. GRÁFICA DE BARRAS (Calificaciones)
  private drawBarChart(data: Punto[]) {
    const host = this.ratingChartRef.nativeElement;
    if (data.length === 0 || d3.sum(data, (d) => d.value) === 0) {
      this.mensajeVacio(host);
      return;
    }

    const { svg, g, w, h } = this.crearSvg(host, 320, 250);
    const maxY = Math.max(1, d3.max(data, (d) => d.value) ?? 1);
    const x = d3.scaleBand<string>().domain(data.map((d) => d.label)).range([0, w]).padding(0.2);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([h, 0]);

    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.label) ?? 0)
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => h - y(d.value))
      .attr('rx', 3)
      .attr('fill', '#9b59b6');

    g.selectAll('text.valor')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'valor')
      .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text((d) => (d.value > 0 ? String(d.value) : ''));

    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y).ticks(Math.min(5, maxY)).tickFormat(d3.format('d')));
    svg.attr('role', 'img').attr('aria-label', 'Distribución de calificaciones');
  }

  // 3. GRÁFICA DE LÍNEA (Tendencia)
  private drawLineChart(data: Punto[]) {
    const host = this.trendChartRef.nativeElement;
    if (data.length === 0) {
      this.mensajeVacio(host);
      return;
    }

    const { svg, g, w, h } = this.crearSvg(host, 320, 250);
    const maxY = Math.max(1, d3.max(data, (d) => d.value) ?? 1);
    const x = d3.scalePoint<string>().domain(data.map((d) => d.label)).range([0, w]);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([h, 0]);

    const line = d3.line<Punto>().x((d) => x(d.label) ?? 0).y((d) => y(d.value)).curve(d3.curveMonotoneX);
    const area = d3.area<Punto>().x((d) => x(d.label) ?? 0).y0(h).y1((d) => y(d.value)).curve(d3.curveMonotoneX);

    g.append('path').datum(data).attr('fill', 'rgba(230, 126, 34, 0.2)').attr('d', area);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#e67e22').attr('stroke-width', 2).attr('d', line);

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.label) ?? 0)
      .attr('cy', (d) => y(d.value))
      .attr('r', 3)
      .attr('fill', '#e67e22');

    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y).ticks(Math.min(5, maxY)).tickFormat(d3.format('d')));
    svg.attr('role', 'img').attr('aria-label', 'Nuevos usuarios por día');
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({ message, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
