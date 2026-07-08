export function generateOrderCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `HMP${digits}`
}

export function buildWhatsAppUrl(
  number: string,
  code: string,
  totals?: { productsPriceTotal: number; taxTotal: number; deliveryTotal: number; grandTotal: number }
): string {
  let message = `HMP Masala Order Code: ${code}`
  if (totals) {
    message += `\n\n*Order Summary*`
    message += `\nProducts Total: ₹${totals.productsPriceTotal.toLocaleString('en-IN')}`
    message += `\nTax Total: ₹${totals.taxTotal.toLocaleString('en-IN')}`
    message += `\nDelivery Total: ${totals.deliveryTotal > 0 ? `₹${totals.deliveryTotal.toLocaleString('en-IN')}` : 'Free'}`
    message += `\n*Grand Total: ₹${totals.grandTotal.toLocaleString('en-IN')}*`
  }
  const text = encodeURIComponent(message)
  return `https://wa.me/${number}?text=${text}`
}
