import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';
import * as d3 from 'd3';
import { Tab3Service } from './tab3.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class Tab3Page {
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('ratingChart') ratingChartRef!: ElementRef;
  @ViewChild('trendChart') trendChartRef!: ElementRef;

  public metrics = { total_users: 0, total_books: 0, reading_books: 0, read_books: 0 };

  constructor(private tab3Service: Tab3Service, private cdr: ChangeDetectorRef) {}

  ionViewWillEnter() {
    this.loadDashboard();
  }

  async loadDashboard() {
    try {
      const data = await this.tab3Service.getDashboardData();
      if (data.success) {
        this.metrics = data.metrics;
        this.cdr.detectChanges(); // Asegura que el HTML pinte los divs

        // Limpiar contenedores
        d3.select(this.statusChartRef.nativeElement).selectAll('*').remove();
        d3.select(this.ratingChartRef.nativeElement).selectAll('*').remove();
        d3.select(this.trendChartRef.nativeElement).selectAll('*').remove();

        // Dibujar gráficas
        this.drawDonutChart(data.status_chart);
        this.drawBarChart(data.rating_chart);
        this.drawLineChart(data.trend_chart);
      }
    } catch (error) {
      console.error('Error al cargar dashboard', error);
    }
  }

  // 1. GRÁFICA DE DONA (Estados)
  private drawDonutChart(chartData: any) {
    const data = chartData.data.map((d: number, i: number) => ({ label: chartData.labels[i], value: d }));
    const width = 250, height = 250, radius = Math.min(width, height) / 2;
    const color = d3.scaleOrdinal(['#f1c40f', '#3498db', '#2ecc71', '#e74c3c']);

    const svg = d3.select(this.statusChartRef.nativeElement)
      .append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<any>().value((d: any) => d.value);
    const arc = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius * 0.8);

    svg.selectAll('path').data(pie(data)).enter().append('path')
      .attr('fill', (d: any) => color(d.data.label))
      .attr('d', arc).style('opacity', 0.9);

    // Texto al centro
    svg.append('text').text('Estados').attr('text-anchor', 'middle').attr('dy', '0.3em').style('font-size', '12px').style('fill', '#666');
  }

  // 2. GRÁFICA DE BARRAS (Calificaciones)
  private drawBarChart(chartData: any) {
    const data = chartData.data.map((d: number, i: number) => ({ label: chartData.labels[i], value: d }));
    const width = 300, height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(this.ratingChartRef.nativeElement)
      .append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map((d: any) => d.label)).range([0, w]).padding(0.2);
    const maxYBar: number = d3.max(data, (d: any) => d.value as number) || 1;
    const y = d3.scaleLinear().domain([0, maxYBar]).range([h, 0]);

    svg.selectAll('rect').data(data).enter().append('rect')
      .attr('x', (d: any) => x(d.label) || 0)
      .attr('y', (d: any) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => h - y(d.value))
      .attr('fill', '#9b59b6');

    // Ejes
    svg.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y).ticks(3));
  }

  // 3. GRÁFICA DE LÍNEA (Tendencia)
  private drawLineChart(chartData: any) {
    const data = chartData.data.map((d: number, i: number) => ({ label: chartData.labels[i], value: d }));
    const width = 300, height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(this.trendChartRef.nativeElement)
      .append('svg').attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(data.map((d: any) => d.label)).range([0, w]);
    const maxYLine: number = d3.max(data, (d: any) => d.value as number) || 1;
    const y = d3.scaleLinear().domain([0, maxYLine]).range([h, 0]);

    const line = d3.line<any>().x((d: any) => x(d.label) || 0).y((d: any) => y(d.value)).curve(d3.curveMonotoneX);

    // Área bajo la línea
    const area = d3.area<any>().x((d: any) => x(d.label) || 0).y0(h).y1((d: any) => y(d.value)).curve(d3.curveMonotoneX);
    
    svg.append('path').datum(data).attr('fill', 'rgba(230, 126, 34, 0.2)').attr('d', area);
    svg.append('path').datum(data).attr('fill', 'none').attr('stroke', '#e67e22').attr('stroke-width', 2).attr('d', line);
    
    // Puntos
    svg.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', (d: any) => x(d.label) || 0)
      .attr('cy', (d: any) => y(d.value))
      .attr('r', 3).attr('fill', '#e67e22');

    // Ejes
    svg.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y).ticks(3));
  }
}