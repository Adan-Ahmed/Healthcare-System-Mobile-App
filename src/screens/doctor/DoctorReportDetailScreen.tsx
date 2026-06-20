import React, {useCallback, useState} from 'react';
import {View, StyleSheet, ScrollView, Share, Alert, Platform} from 'react-native';
import {Text, Button, ActivityIndicator, IconButton} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {ReportService, MedicalReport} from '../../services/ReportService';
import {formatProfessionalMedicalReportText} from '../../utils/medicalReportDocument';
import ProfessionalMedicalReport from '../../components/ProfessionalMedicalReport';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const DoctorReportDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {reportId, initialReport} = route.params as {
    reportId: number;
    initialReport?: MedicalReport;
  };

  const [report, setReport] = useState<MedicalReport | null>(initialReport ?? null);
  const [loading, setLoading] = useState(!initialReport);
  const [refreshingAi, setRefreshingAi] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await ReportService.getReport(reportId);
      setReport(r);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load this report.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    if (!initialReport) {
      load();
    }
  }, [initialReport, load]);

  const shareProfessional = async () => {
    if (!report) {
      return;
    }
    const body = formatProfessionalMedicalReportText(report, report.patientName);
    try {
      await Share.share(
        {
          title: `${report.reportType} — ${report.patientName}`,
          message: body,
        },
        {subject: `Medical report ${report.reportType}`},
      );
    } catch {
      Alert.alert('Share', 'Could not open the share sheet.');
    }
  };

  const onRegenerateAi = async () => {
    setRefreshingAi(true);
    try {
      const updated = await ReportService.regenerateReportSummary(reportId);
      setReport(updated);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not refresh AI summary.');
    } finally {
      setRefreshingAi(false);
    }
  };

  if (loading || !report) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text variant="bodyMedium" style={styles.loadingHint}>
            Loading report…
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={AppColors.text} onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Medical report
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text variant="bodySmall" style={styles.hint}>
            AI summary is generated from the detailed findings. Regenerate after you edit the report in the system if
            needed.
          </Text>

          <ProfessionalMedicalReport report={report} patientName={report.patientName} variant="doctor" />

          <Button
            mode="outlined"
            icon="auto-fix"
            onPress={onRegenerateAi}
            loading={refreshingAi}
            disabled={refreshingAi}
            style={styles.btn}
            textColor={AppColors.primary}>
            Refresh AI summary
          </Button>

          <Button
            mode="contained"
            icon="share-variant"
            onPress={shareProfessional}
            style={styles.btn}
            buttonColor={AppColors.primary}>
            Download / share (professional format)
          </Button>

          {Platform.OS === 'ios' ? (
            <Text variant="bodySmall" style={styles.note}>
              On iPhone, use Share to save to Files, Mail, or print.
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.note}>
              Use Share to save to Drive, email, or another app.
            </Text>
          )}
        </ScrollView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingHint: {marginTop: 12, color: AppColors.textSecondary},
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 4,
  },
  headerTitle: {fontWeight: '800', color: AppColors.text, marginLeft: 4},
  scroll: {padding: 18, paddingBottom: 40},
  hint: {color: AppColors.textSecondary, marginBottom: 14, lineHeight: 20},
  btn: {marginTop: 10, borderRadius: 12},
  note: {textAlign: 'center', color: AppColors.textMuted, marginTop: 12},
});

export default DoctorReportDetailScreen;
