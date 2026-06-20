import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl, Share, Platform, Alert} from 'react-native';
import {Card, Text, ActivityIndicator, Button, IconButton} from 'react-native-paper';
import {ReportService, MedicalReport} from '../../services/ReportService';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import ProfessionalMedicalReport from '../../components/ProfessionalMedicalReport';
import {formatProfessionalMedicalReportText} from '../../utils/medicalReportDocument';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {user} = useAuth();

  const loadReports = async () => {
    if (!user) {
      return;
    }
    try {
      const patientReports = await ReportService.getPatientReports(user.id);
      setReports(patientReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const shareReport = async (report: MedicalReport) => {
    const body = formatProfessionalMedicalReportText(report, user?.name ?? report.patientName);
    try {
      await Share.share(
        {
          title: `${report.reportType} — ${new Date(report.reportDate).toLocaleDateString()}`,
          message: body,
        },
        {subject: `Medical report: ${report.reportType}`},
      );
    } catch {
      Alert.alert('Share', 'Could not open the share sheet.');
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={sharedScreen.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.heroLabel}>
            Your records
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Medical reports
          </Text>
          <Text variant="bodyMedium" style={styles.heroSub}>
            Official-style clinical documents. Use share to save a formatted copy (PDF-style text for Files or email).
          </Text>
        </View>

        <View style={styles.content}>
          {reports.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content style={styles.emptyCard}>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No reports yet
                </Text>
                <Text variant="bodyMedium" style={styles.muted}>
                  When your doctor files a report after a visit, it will appear here.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            reports.map(report => (
              <View key={report.id} style={styles.reportBlock}>
                <ProfessionalMedicalReport
                  report={report}
                  patientName={user?.name ?? report.patientName}
                  variant="patient"
                />
                <View style={styles.exportRow}>
                  <IconButton
                    icon="download-outline"
                    mode="contained-tonal"
                    containerColor={AppColors.primaryTint}
                    iconColor={AppColors.primary}
                    size={26}
                    onPress={() => shareReport(report)}
                    accessibilityLabel="Download or share report"
                  />
                  <Button
                    mode="contained"
                    icon="share-variant"
                    onPress={() => shareReport(report)}
                    style={styles.shareBtn}
                    contentStyle={styles.shareBtnContent}
                    buttonColor={AppColors.primary}>
                    Share formatted report
                  </Button>
                </View>
              </View>
            ))
          )}

          <Button mode="outlined" onPress={onRefresh} style={styles.refreshButton} textColor={AppColors.primary}>
            Refresh list
          </Button>
          {Platform.OS === 'ios' ? (
            <Text variant="bodySmall" style={styles.footerNote}>
              On iPhone, use download or share — both open the system sheet to save to Files or Mail.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  hero: {paddingHorizontal: 22, paddingTop: 52, paddingBottom: 6},
  heroLabel: {color: AppColors.primary, letterSpacing: 1.2, marginBottom: 4, fontWeight: '600'},
  heroTitle: {fontWeight: '800', color: AppColors.text, marginBottom: 8},
  heroSub: {color: AppColors.textSecondary, lineHeight: 22},
  content: {padding: 18, paddingBottom: 36},
  reportBlock: {marginBottom: 20},
  card: {marginBottom: 14},
  emptyCard: {alignItems: 'center', paddingVertical: 28},
  emptyTitle: {color: AppColors.text, marginBottom: 8, fontWeight: '700'},
  muted: {color: AppColors.textMuted, textAlign: 'center'},
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  shareBtn: {flex: 1, borderRadius: 12},
  shareBtnContent: {flexDirection: 'row-reverse', paddingVertical: 4},
  refreshButton: {marginTop: 10, borderColor: AppColors.primary},
  footerNote: {textAlign: 'center', color: AppColors.textMuted, marginTop: 12},
});

export default ReportsScreen;
