import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, Text, Divider} from 'react-native-paper';
import {MedicalReport} from '../services/ReportService';
import {AppColors} from '../theme/colors';
import {
  INSTITUTION_NAME,
  INSTITUTION_SUBTITLE,
  REPORT_FOOTER_DISCLAIMER,
} from '../constants/institution';

type Props = {
  report: MedicalReport;
  patientName: string;
  /** Doctor view highlights AI summary; patient sees "Clinical summary". */
  variant: 'patient' | 'doctor';
};

const ProfessionalMedicalReport: React.FC<Props> = ({report, patientName, variant}) => {
  const docRef = `MR-${String(report.id).padStart(8, '0')}`;
  const dateStr = new Date(report.reportDate).toLocaleString(undefined, {
    weekday: 'short',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <Card style={styles.doc} mode="elevated">
      <View style={styles.headerBand}>
        <Text style={styles.headerInstitution}>{INSTITUTION_NAME}</Text>
        <Text style={styles.headerSub}>{INSTITUTION_SUBTITLE}</Text>
      </View>

      <Card.Content style={styles.body}>
        <View style={styles.idRow}>
          <View style={styles.idCol}>
            <Text style={styles.label}>Patient</Text>
            <Text style={styles.value}>{patientName}</Text>
          </View>
          <View style={styles.idColRight}>
            <Text style={styles.label}>Record #</Text>
            <Text style={styles.mono}>{docRef}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionLabel}>Report type</Text>
        <Text style={styles.reportTitle}>{report.reportType}</Text>
        <Text style={styles.metaLine}>{dateStr}</Text>
        {report.doctorName ? (
          <Text style={styles.metaLine}>Attending: {report.doctorName}</Text>
        ) : null}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>
            {variant === 'doctor' ? 'AI-assisted clinical summary' : 'Clinical summary'}
          </Text>
          <Text style={styles.summaryText}>
            {report.summary?.trim() ||
              (variant === 'doctor'
                ? 'No summary yet. Use “Refresh AI summary” after saving the detailed report, or add findings in “New report”.'
                : 'Summary will appear here when your physician files the report.')}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Detailed findings</Text>
        <View style={styles.findingsBox}>
          <Text style={styles.findingsText}>{report.reportData}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{REPORT_FOOTER_DISCLAIMER}</Text>
          <Text style={styles.footerRef}>Document ID: {docRef}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  doc: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#C5D5E4',
  },
  headerBand: {
    backgroundColor: '#1B4F72',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  headerInstitution: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  body: {
    paddingTop: 16,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idCol: {flex: 1},
  idColRight: {alignItems: 'flex-end'},
  label: {
    fontSize: 11,
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text,
    marginTop: 2,
  },
  mono: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#BDC9D4',
  },
  sectionLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4F72',
  },
  metaLine: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  summaryBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#E8F4FC',
    borderLeftWidth: 4,
    borderLeftColor: '#1B4F72',
    borderRadius: 4,
  },
  summaryBoxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B4F72',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.text,
  },
  findingsBox: {
    marginTop: 8,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE4EA',
    borderRadius: 4,
    minHeight: 80,
  },
  findingsText: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.text,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDE4EA',
  },
  footerText: {
    fontSize: 11,
    lineHeight: 16,
    color: AppColors.textMuted,
    fontStyle: 'italic',
  },
  footerRef: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default ProfessionalMedicalReport;
