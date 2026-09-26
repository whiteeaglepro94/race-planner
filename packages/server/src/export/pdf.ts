import PDFDocument from 'pdfkit';
import type { RacePlan } from '@race-planner/shared';

interface TimelineImage {
  data: Buffer;
  width: number;
  height: number;
}

export async function planToPDF(plan: RacePlan, timeline?: TimelineImage): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const sorted = [...plan.stints].sort((a, b) => a.order - b.order);
    const margin = 40;
    const pageW = 841.89 - margin * 2;

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(plan.config.teamName || 'Race Planner', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(plan.config.name || 'Plan de course', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#666').text(
      `${plan.config.circuit || '—'} | ${plan.config.car || '—'} | ${Math.floor(plan.config.durationMinutes / 60)}h${String(plan.config.durationMinutes % 60).padStart(2, '0')} | Départ ${plan.config.startTime}`,
      { align: 'center' }
    );
    doc.moveDown(0.2);
    doc.strokeColor('#cccccc').moveTo(margin, doc.y).lineTo(margin + pageW, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Résumé par pilote ──
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Résumé par pilote');
    doc.moveDown(0.4);

    for (const d of plan.drivers) {
      const dStints = sorted.filter((s) => s.driverId === d.id);
      const totalMin = dStints.reduce((s, st) => s + st.durationMinutes, 0);
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      const pct = plan.config.durationMinutes > 0 ? Math.round((totalMin / plan.config.durationMinutes) * 100) : 0;
      const tireChanges = dStints.filter((s) => s.tireCondition === 'new').length;
      const fuelLoads = dStints.reduce((s, st) => s + st.fuelLoads, 0);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text(d.name, { continued: true });
      doc.font('Helvetica').text(
        `  —  ${dStints.length} relais  |  ${hh}h${String(mm).padStart(2, '0')} (${pct}%)  |  ${tireChanges} chgt pneus  |  ${fuelLoads} ravitaillements`
      );
    }

    doc.moveDown(0.8);
    doc.strokeColor('#cccccc').moveTo(margin, doc.y).lineTo(margin + pageW, doc.y).stroke();
    doc.moveDown(0.8);

    // ── Tableau des relais ──
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Détail des relais');
    doc.moveDown(0.4);

    const colW = [25, 75, 45, 45, 45, 55, 45, 40, 180];
    const headers = ['#', 'Pilote', 'Début', 'Fin', 'Durée', 'Pneus', 'État', 'Pleins', 'Notes'];

    let y = doc.y;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333');
    headers.forEach((h, i) => {
      const x = margin + colW.slice(0, i).reduce((s, w) => s + w, 0);
      doc.text(h, x, y, { width: colW[i] });
    });
    y += 14;
    doc.strokeColor('#ddd').moveTo(margin, y - 2).lineTo(margin + pageW, y - 2).stroke();

    doc.fontSize(7.5).font('Helvetica').fillColor('#000');
    for (const [idx, s] of sorted.entries()) {
      if (y > 520) { doc.addPage(); y = 40; }
      const driver = plan.drivers.find((d) => d.id === s.driverId);
      const vals = [String(idx + 1), driver?.name ?? '?', s.startTime, s.endTime, `${s.durationMinutes} min`, s.tireCompound === 'dry' ? 'Sec' : s.tireCompound === 'wet' ? 'Pluie' : 'Inter', s.tireCondition === 'new' ? 'Neufs' : 'Usagés', String(s.fuelLoads), s.notes];
      vals.forEach((v, i) => {
        const x = margin + colW.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.text(v, x, y, { width: colW[i] });
      });
      y += 12;
    }

    doc.moveDown(1);

    // ── Pit stops détaillés ──
    if (plan.pitStops.length > 0) {
      if (doc.y > 450) doc.addPage();
      doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Arrêts aux stands');
      doc.moveDown(0.4);

      const pitColW = [25, 75, 50, 55, 80, 80];
      const pitHeaders = ['#', 'Après relai de', 'Heure', 'Durée', 'Pneus', 'Carburant'];
      let py = doc.y;

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#333');
      pitHeaders.forEach((h, i) => {
        const x = margin + pitColW.slice(0, i).reduce((s, w) => s + w, 0);
        doc.text(h, x, py, { width: pitColW[i] });
      });
      py += 14;
      doc.strokeColor('#ddd').moveTo(margin, py - 2).lineTo(margin + 365, py - 2).stroke();

      doc.fontSize(7.5).font('Helvetica').fillColor('#000');
      for (const [idx, pit] of plan.pitStops.entries()) {
        if (py > 520) { doc.addPage(); py = 40; }
        const afterStint = sorted.find((s) => s.id === pit.afterStintId);
        const afterDriver = afterStint ? plan.drivers.find((d) => d.id === afterStint.driverId) : null;
        const vals = [
          String(idx + 1),
          afterDriver?.name ?? '?',
          pit.time,
          `${pit.durationSeconds}s`,
          pit.tireChange ? 'Changement' : 'Non',
          pit.refuel ? 'Ravitaillement' : 'Non',
        ];
        vals.forEach((v, i) => {
          const x = margin + pitColW.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.text(v, x, py, { width: pitColW[i] });
        });
        py += 12;
      }
    }

    // ── Statistiques globales ──
    if (doc.y > 460) doc.addPage();
    doc.moveDown(1);
    doc.strokeColor('#cccccc').moveTo(margin, doc.y).lineTo(margin + pageW, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Statistiques');
    doc.moveDown(0.3);

    const totalDriveMin = sorted.reduce((s, st) => s + st.durationMinutes, 0);
    const totalPitTime = plan.pitStops.reduce((s, p) => s + p.durationSeconds, 0);
    const totalTireChanges = plan.pitStops.filter((p) => p.tireChange).length;
    const totalRefuels = plan.pitStops.filter((p) => p.refuel).length;

    doc.fontSize(9).font('Helvetica');
    doc.text(`Nombre total de relais : ${sorted.length}`);
    doc.text(`Nombre total d'arrêts aux stands : ${plan.pitStops.length}`);
    doc.text(`Temps de conduite total : ${Math.floor(totalDriveMin / 60)}h${String(totalDriveMin % 60).padStart(2, '0')}`);
    doc.text(`Temps total aux stands : ${Math.floor(totalPitTime / 60)} min ${totalPitTime % 60}s`);
    doc.text(`Changements de pneus : ${totalTireChanges}`);
    doc.text(`Ravitaillements : ${totalRefuels}`);
    doc.text(`Nombre de pilotes : ${plan.drivers.length}`);

    // ── Frise chronologique (dernière page) ──
    if (timeline && timeline.data.length > 0) {
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Frise chronologique');
      doc.moveDown(0.3);
      const fitW = pageW;
      const fitH = Math.round(fitW * timeline.height / timeline.width);
      doc.image(timeline.data, margin, doc.y, { width: fitW, height: fitH });
    }

    doc.end();
  });
}
