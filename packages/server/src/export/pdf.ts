import PDFDocument from 'pdfkit';
import type { RacePlan } from '@race-planner/shared';

export async function planToPDF(plan: RacePlan): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(18).text(plan.config.name, { align: 'center' });
    doc.fontSize(10).text(`${plan.config.circuit} — ${plan.config.car} — ${plan.config.durationMinutes / 60}h`, { align: 'center' });
    doc.text(`Départ: ${plan.config.startTime}`, { align: 'center' });
    doc.moveDown();

    // Stint table
    doc.fontSize(8);
    const sorted = [...plan.stints].sort((a, b) => a.order - b.order);
    const colW = [30, 80, 50, 50, 50, 60, 50, 40, 200];
    const headers = ['#', 'Pilote', 'Début', 'Fin', 'Durée', 'Pneus', 'État', 'Pleins', 'Notes'];

    let y = doc.y;
    headers.forEach((h, i) => {
      const x = 40 + colW.slice(0, i).reduce((s, w) => s + w, 0);
      doc.font('Helvetica-Bold').text(h, x, y, { width: colW[i] });
    });
    y += 14;

    for (const [idx, s] of sorted.entries()) {
      const driver = plan.drivers.find((d) => d.id === s.driverId);
      const vals = [String(idx + 1), driver?.name ?? '?', s.startTime, s.endTime, `${s.durationMinutes} min`, s.tireCompound, s.tireCondition, String(s.fuelLoads), s.notes];
      vals.forEach((v, i) => {
        const x = 40 + colW.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.font('Helvetica').text(v, x, y, { width: colW[i] });
      });
      y += 12;
      if (y > 500) { doc.addPage(); y = 40; }
    }

    // Driver summary
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Résumé par pilote');
    doc.fontSize(8).font('Helvetica');
    for (const d of plan.drivers) {
      const dStints = sorted.filter((s) => s.driverId === d.id);
      const totalMin = dStints.reduce((s, st) => s + st.durationMinutes, 0);
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      doc.text(`${d.name}: ${hh}h${String(mm).padStart(2, '0')} (${dStints.length} relais)`);
    }

    doc.end();
  });
}
