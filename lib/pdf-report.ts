import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatIST } from '@/lib/formatDate'

export interface ReportData {
  generatedAt:     Date
  periodFrom:      Date | null
  periodTo:        Date
  totalOrders:     number
  totalRevenue:    number
  topProducts:     { name: string; qty: number; revenue: number }[]
  statusBreakdown: { status: string; count: number }[]
  dailySummary:    { date: string; orders: number; revenue: number }[]
}

// Rs. instead of the rupee symbol (U+20B9): that codepoint is outside
// WinAnsiEncoding used by jsPDF built-in fonts, which causes ^1 substitution.
function rs(amount: number, decimals = 2): string {
  return `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

type RGB = [number, number, number]

const SAFFRON: RGB = [245, 158, 11]
const DARK:    RGB = [41,  37,  36]
const MUTED:   RGB = [120, 113, 108]
const WHITE:   RGB = [255, 255, 255]
const CREAM:   RGB = [255, 251, 235]

export function generateResetReportPDF(data: ReportData): Buffer {
  // compress: false avoids zlib stream issues in some PDF viewers and keeps
  // vector text sharp at any zoom level.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false })

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...SAFFRON)
  doc.rect(0, 0, 210, 32, 'F')

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('HMP Masala', 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Business Data Report  |  Pre-Reset Summary', 14, 24)
  doc.text(`Generated: ${formatIST(data.generatedAt, 'dd MMM yyyy, HH:mm')}`, 196, 24, { align: 'right' })

  // ── REPORT PERIOD ─────────────────────────────────────────────────────────
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Report Period', 14, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...MUTED)
  const from = data.periodFrom ? formatIST(data.periodFrom, 'dd MMM yyyy', true) : 'Inception'
  const to   = formatIST(data.periodTo, 'dd MMM yyyy', true)
  doc.text(`${from}  to  ${to}`, 14, 50)

  // ── SUMMARY BOXES ─────────────────────────────────────────────────────────
  const avgValue = data.totalOrders > 0
    ? rs(data.totalRevenue / data.totalOrders)
    : '--'

  const boxes: { label: string; value: string }[] = [
    { label: 'Total Orders',    value: String(data.totalOrders) },
    { label: 'Total Revenue',   value: rs(data.totalRevenue) },
    { label: 'Avg Order Value', value: avgValue },
  ]

  const BOX_W = 58, BOX_H = 24, BOX_Y = 57
  boxes.forEach((b, i) => {
    const x = 14 + i * (BOX_W + 4)
    doc.setFillColor(...CREAM)
    doc.roundedRect(x, BOX_Y, BOX_W, BOX_H, 3, 3, 'F')

    doc.setTextColor(...SAFFRON)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(b.value, x + BOX_W / 2, BOX_Y + 13, { align: 'center' })

    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(b.label, x + BOX_W / 2, BOX_Y + 20, { align: 'center' })
  })

  let curY = 91

  // ── ORDERS BY STATUS ──────────────────────────────────────────────────────
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Orders by Status', 14, curY)

  autoTable(doc, {
    startY: curY + 5,
    head: [['Status', 'Count']],
    body: data.statusBreakdown.map((s) => [s.status, String(s.count)]),
    theme: 'striped',
    headStyles: {
      fillColor:  SAFFRON,
      textColor:  WHITE,
      fontSize:   10,
      fontStyle:  'bold',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize:    10,
      cellPadding: 4,
      textColor:   DARK,
    },
    alternateRowStyles: { fillColor: [255, 253, 245] as RGB },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })
  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  // ── TOP PRODUCTS ──────────────────────────────────────────────────────────
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Top Products by Revenue', 14, curY)

  autoTable(doc, {
    startY: curY + 5,
    head: [['Product', 'Qty Sold', 'Revenue']],
    body: data.topProducts.map((p) => [p.name, String(p.qty), rs(p.revenue, 0)]),
    theme: 'striped',
    headStyles: {
      fillColor:  SAFFRON,
      textColor:  WHITE,
      fontSize:   10,
      fontStyle:  'bold',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize:    10,
      cellPadding: 4,
      textColor:   DARK,
    },
    alternateRowStyles: { fillColor: [255, 253, 245] as RGB },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
  })
  curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  // ── DAILY SUMMARY ─────────────────────────────────────────────────────────
  if (data.dailySummary.length > 0) {
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Daily Summary (Last 14 Days)', 14, curY)

    autoTable(doc, {
      startY: curY + 5,
      head: [['Date', 'Orders', 'Revenue']],
      body: data.dailySummary.map((d) => [d.date, String(d.orders), rs(d.revenue, 0)]),
      theme: 'striped',
      headStyles: {
        fillColor:  SAFFRON,
        textColor:  WHITE,
        fontSize:   10,
        fontStyle:  'bold',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize:    10,
        cellPadding: 4,
        textColor:   DARK,
      },
      alternateRowStyles: { fillColor: [255, 253, 245] as RGB },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 28 },
        2: { halign: 'right', cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    })
  }

  // ── FOOTER (every page) ───────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(
      `HMP Masala  |  Confidential  |  Page ${i} of ${pageCount}`,
      105, 291, { align: 'center' },
    )
  }

  return Buffer.from(doc.output('arraybuffer'))
}
