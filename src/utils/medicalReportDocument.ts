import {MedicalReport} from '../services/ReportService';
import {
  INSTITUTION_NAME,
  INSTITUTION_SUBTITLE,
  REPORT_FOOTER_DISCLAIMER,
} from '../constants/institution';

/** Plain-text export suitable for Share / save to Files (professional hospital-style layout). */
export function formatProfessionalMedicalReportText(
  report: MedicalReport,
  patientName: string,
): string {
  const docRef = `MR-${String(report.id).padStart(8, '0')}`;
  const dateStr = new Date(report.reportDate).toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const lines: string[] = [
    '══════════════════════════════════════════════════════════════',
    `  ${INSTITUTION_NAME.toUpperCase()}`,
    `  ${INSTITUTION_SUBTITLE}`,
    '══════════════════════════════════════════════════════════════',
    '',
    'PATIENT IDENTIFICATION',
    `  Patient name     : ${patientName}`,
    `  Medical record # : ${docRef}`,
    `  Report category  : ${report.reportType}`,
    '',
    'DOCUMENT DETAILS',
    `  Date / time of report : ${dateStr}`,
    report.doctorName ? `  Attending physician    : ${report.doctorName}` : '  Attending physician    : —',
    '',
    '──────────────────────────────────────────────────────────────',
    'CLINICAL SUMMARY',
    '──────────────────────────────────────────────────────────────',
    '',
    (report.summary || 'No structured summary on file. See detailed findings below.').trim(),
    '',
    '──────────────────────────────────────────────────────────────',
    'DETAILED FINDINGS / REPORT BODY',
    '──────────────────────────────────────────────────────────────',
    '',
    report.reportData.trim(),
    '',
    '──────────────────────────────────────────────────────────────',
    'ELECTRONIC ATTESTATION',
    report.doctorName
      ? `  Electronically filed in the medical record by: ${report.doctorName}`
      : '  Electronically filed in the medical record.',
    `  Document reference: ${docRef}`,
    '',
    REPORT_FOOTER_DISCLAIMER,
    '',
    '— End of document —',
  ];

  return lines.join('\n');
}
