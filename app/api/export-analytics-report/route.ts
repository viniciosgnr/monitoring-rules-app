import { NextRequest, NextResponse } from 'next/server';
import { chromium } from '@playwright/test';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      filters,
      kpis,
      badActors,
      alertsByStatus,
      alertsBySystem,
    } = body;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Analytics Executive Report</title>
<style>
  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1E293B;
    line-height: 1.45;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 2px solid #2563EB;
    padding-bottom: 12px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  h1 {
    font-size: 20px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 4px 0;
  }
  .subtitle {
    font-size: 11px;
    color: #64748B;
  }
  .timestamp {
    font-size: 10px;
    color: #64748B;
    text-align: right;
  }
  .filter-summary {
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .filter-item {
    display: flex;
    flex-direction: column;
  }
  .filter-label {
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748B;
    margin-bottom: 2px;
  }
  .filter-value {
    font-size: 11px;
    font-weight: 600;
    color: #0F172A;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 18px;
  }
  .kpi-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 12px 14px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .kpi-title {
    font-size: 10.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .kpi-value {
    font-size: 24px;
    font-weight: 800;
    color: #0F172A;
    margin: 4px 0;
  }
  .kpi-sub {
    font-size: 9.5px;
    color: #64748B;
  }
  h2 {
    font-size: 13.5px;
    font-weight: 700;
    color: #1D4ED8;
    margin: 16px 0 8px 0;
    border-bottom: 1.5px solid #DBEAFE;
    padding-bottom: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 10px;
  }
  th, td {
    border: 1px solid #CBD5E1;
    padding: 5px 8px;
    text-align: left;
  }
  th {
    background-color: #F1F5F9;
    font-weight: 700;
    color: #0F172A;
  }
  tr:nth-child(even) td {
    background-color: #F8FAFC;
  }
  .text-right { text-align: right; }
  .font-mono { font-family: 'SFMono-Regular', Consolas, monospace; }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 600;
  }
  .footer {
    margin-top: 24px;
    border-top: 1px solid #E2E8F0;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #94A3B8;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Monitoring Rules Management — Analytics Report</h1>
    <div class="subtitle">Reliability & Surveillance Performance Summary</div>
  </div>
  <div class="timestamp">
    Generated on: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
  </div>
</div>

<div class="filter-summary">
  <div class="filter-item">
    <span class="filter-label">FPSO Fleet</span>
    <span class="filter-value">${filters?.fpsos || 'All FPSOs'}</span>
  </div>
  <div class="filter-item">
    <span class="filter-label">Evaluation Period</span>
    <span class="filter-value">${filters?.period || 'All time'}</span>
  </div>
  <div class="filter-item">
    <span class="filter-label">Monitored Assets</span>
    <span class="filter-value">${filters?.equipments || 'All Assets'}</span>
  </div>
  <div class="filter-item">
    <span class="filter-label">Rule Categories</span>
    <span class="filter-value">${filters?.categories || 'All Categories'}</span>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-title">Accuracy Rate</div>
    <div class="kpi-value" style="color: #2563EB;">${kpis?.accuracy || '—'}</div>
    <div class="kpi-sub">Target: &gt; 80% • Benchmark Met</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-title">False Positive Rate</div>
    <div class="kpi-value" style="color: #D97706;">${kpis?.fpRate || '—'}</div>
    <div class="kpi-sub">Target: &lt; 20% • Noise Control</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-title">Avg. Time to Treat</div>
    <div class="kpi-value" style="color: #0F172A;">${kpis?.avgDays || '—'}</div>
    <div class="kpi-sub">Target: &lt; 3.0 days (72 hours)</div>
  </div>
</div>

<h2>Top Bad Actor Rules by Volume & Noise</h2>
<table>
  <thead>
    <tr>
      <th style="width: 12%;">FPSO</th>
      <th style="width: 38%;">Rule Name / Instance</th>
      <th style="width: 20%;">Asset</th>
      <th style="width: 10%;" class="text-right">Accuracy</th>
      <th style="width: 10%;" class="text-right">FP Rate</th>
      <th style="width: 10%;" class="text-right">Total Alerts</th>
    </tr>
  </thead>
  <tbody>
    ${(badActors || []).slice(0, 10).map((r: any) => `
      <tr>
        <td class="font-mono"><strong>${r.fpsoCode}</strong></td>
        <td>${r.ruleName}</td>
        <td class="font-mono">${r.equipmentCode}</td>
        <td class="text-right font-mono">${r.accuracy !== null ? r.accuracy + '%' : '—'}</td>
        <td class="text-right font-mono" style="color: #B45309;">${r.fpRate !== null ? r.fpRate + '%' : '—'}</td>
        <td class="text-right font-mono"><strong>${r.alertsCount}</strong></td>
      </tr>
    `).join('')}
  </tbody>
</table>

<h2>Alerts by Monitored Process System</h2>
<table>
  <thead>
    <tr>
      <th style="width: 40%;">System</th>
      <th style="width: 15%;" class="text-right">Eligible for EM</th>
      <th style="width: 15%;" class="text-right">Rejected</th>
      <th style="width: 15%;" class="text-right">In Progress</th>
      <th style="width: 15%;" class="text-right">Total Volume</th>
    </tr>
  </thead>
  <tbody>
    ${(alertsBySystem || []).map((s: any) => `
      <tr>
        <td><strong>${s.system}</strong></td>
        <td class="text-right font-mono">${s.eligible}</td>
        <td class="text-right font-mono">${s.rejected}</td>
        <td class="text-right font-mono">${s.reviewInProgress}</td>
        <td class="text-right font-mono"><strong>${s.total}</strong></td>
      </tr>
    `).join('')}
  </tbody>
</table>

<div class="footer">
  <span>Monitoring Rules Management • Analytics Engine</span>
  <span>Confidential • Internal Reliability Report</span>
</div>

</body>
</html>`;

    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '14mm',
        bottom: '14mm',
        left: '14mm',
        right: '14mm',
      },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Failed to generate PDF report' }, { status: 500 });
  }
}
