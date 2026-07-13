import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, ScanLine, Camera, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/theme';
import { useLanguage } from '@/context/language';
import { Shadows, Radius, Typography, Spacing } from '@/lib/theme';

interface ScanResult {
  name: string | null;
  expirationDate: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (result: ScanResult) => void;
}

function WebImagePicker({ onCapture, onError, title, subtitle }: { onCapture: (base64: string) => void; onError: (msg: string) => void; title: string; subtitle: string }) {
  const { colors } = useTheme();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64) onCapture(base64);
      else onError('Could not read image');
    };
    reader.onerror = () => onError('Failed to read file');
    reader.readAsDataURL(file);
  };

  return (
    <View style={webStyles.container}>
      <View style={[webStyles.iconCircle, { backgroundColor: colors.inputBg }]}>
        <Camera size={40} color={colors.textTertiary} strokeWidth={1.5} />
      </View>
      <Text style={[webStyles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[webStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      {/* @ts-ignore - web-only input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{
          display: 'block',
          marginTop: 20,
          padding: '10px 20px',
          backgroundColor: colors.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontFamily: 'Inter-SemiBold',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'center',
        }}
      />
    </View>
  );
}

const webStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.h3, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
});

export function ScanMedicineModal({ visible, onClose, onResult }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const reset = () => { setScanResult(null); setScanError(null); setScanning(false); };
  const handleClose = () => { reset(); onClose(); };

  const processBase64 = useCallback(async (base64: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const { data, error } = await supabase.functions.invoke('scan-medicine', { body: { image: base64 } });
      if (error) throw new Error(error.message);
      const result: ScanResult = { name: data?.name ?? null, expirationDate: data?.expirationDate ?? null };
      if (!result.name && !result.expirationDate) {
        setScanError(t.medicines.scan.noInfoFound);
        setScanResult(null);
      } else {
        setScanResult(result);
      }
    } catch {
      setScanError(t.medicines.scan.scanFailed);
    } finally {
      setScanning(false);
    }
  }, [t]);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    setScanning(true);
    setScanError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (photo?.base64) {
        await processBase64(photo.base64);
      } else {
        setScanError(t.medicines.scan.captureFailed);
        setScanning(false);
      }
    } catch {
      setScanError(t.medicines.scan.cameraError);
      setScanning(false);
    }
  }, [processBase64, t]);

  const handleUseResult = () => {
    if (scanResult) { onResult(scanResult); reset(); onClose(); }
  };

  const renderCamera = () => {
    if (Platform.OS === 'web') {
      return (
        <WebImagePicker
          onCapture={(b64) => processBase64(b64)}
          onError={(msg) => setScanError(msg)}
          title={t.medicines.scan.uploadPhoto}
          subtitle={t.medicines.scan.uploadSubtitle}
        />
      );
    }

    if (!permission) {
      return <View style={styles.permissionContainer}><ActivityIndicator color={colors.primary} /></View>;
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <View style={[styles.permIconCircle, { backgroundColor: colors.inputBg }]}>
            <Camera size={36} color={colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.permTitle, { color: colors.text }]}>{t.medicines.scan.cameraAccessNeeded}</Text>
          <Text style={[styles.permText, { color: colors.textSecondary }]}>{t.medicines.scan.allowCameraText}</Text>
          <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <Text style={[styles.permBtnText, { color: colors.textInverse }]}>{t.medicines.scan.allowCameraBtn}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.frameGuide}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.frameHint}>{t.medicines.scan.alignLabel}</Text>
          </View>
        </CameraView>

        <View style={styles.captureRow}>
          <TouchableOpacity
            style={[styles.captureBtn, { backgroundColor: colors.primary, borderColor: 'rgba(255,255,255,0.3)' }, scanning && styles.captureBtnDisabled]}
            onPress={capturePhoto}
            disabled={scanning}
            activeOpacity={0.8}>
            {scanning ? <ActivityIndicator color={colors.textInverse} size="small" /> : <ScanLine size={28} color={colors.textInverse} strokeWidth={2} />}
          </TouchableOpacity>
          <Text style={styles.captureHint}>{scanning ? t.medicines.scan.scanning : t.medicines.scan.tapToScan}</Text>
        </View>
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl, maxHeight: '90%', ...Shadows.modal },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.inputBorder, alignSelf: 'center', marginBottom: Spacing.lg },
    title: { ...Typography.h2, color: colors.text },
    closeBtn: { padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: colors.inputBg },
    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: colors.dangerLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.dangerBorder },
    errorText: { ...Typography.caption, color: colors.danger, flex: 1, lineHeight: 18 },
    resultCard: { backgroundColor: colors.successLight, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: colors.successBorder, marginBottom: Spacing.lg },
    resultTitle: { ...Typography.h3, color: colors.success },
    resultLabel: { ...Typography.caption, color: colors.textSecondary },
    resultValue: { ...Typography.bodyMedium, color: colors.text, fontSize: 14, maxWidth: '65%', textAlign: 'left' },
    resultUseBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center', ...Shadows.button },
    resultUseBtnText: { ...Typography.button, color: colors.textInverse, fontSize: 15 },
    resultRetryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: 13, borderRadius: Radius.lg, backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.inputBorder },
    resultRetryText: { ...Typography.caption, color: colors.textSecondary, fontFamily: 'Inter-SemiBold' },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={dynamicStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={dynamicStyles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ScanLine size={20} color={colors.primary} strokeWidth={2} />
              <Text style={dynamicStyles.title}>{t.medicines.scan.title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={dynamicStyles.closeBtn}>
              <X size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {scanError && (
            <View style={dynamicStyles.errorBox}>
              <AlertTriangle size={16} color={colors.danger} strokeWidth={2} />
              <Text style={dynamicStyles.errorText}>{scanError}</Text>
            </View>
          )}

          {scanResult && !scanning && (
            <View style={dynamicStyles.resultCard}>
              <View style={styles.resultHeader}>
                <CheckCircle2 size={18} color={colors.success} strokeWidth={2} />
                <Text style={dynamicStyles.resultTitle}>{t.medicines.scan.scanComplete}</Text>
              </View>
              {scanResult.name && (
                <View style={styles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>{t.medicines.scan.name}</Text>
                  <Text style={dynamicStyles.resultValue}>{scanResult.name}</Text>
                </View>
              )}
              {scanResult.expirationDate && (
                <View style={styles.resultRow}>
                  <Text style={dynamicStyles.resultLabel}>{t.medicines.scan.expiry}</Text>
                  <Text style={dynamicStyles.resultValue}>{scanResult.expirationDate}</Text>
                </View>
              )}
              <View style={styles.resultActions}>
                <TouchableOpacity style={dynamicStyles.resultUseBtn} onPress={handleUseResult}>
                  <Text style={dynamicStyles.resultUseBtnText}>{t.medicines.scan.useDetails}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.resultRetryBtn} onPress={reset}>
                  <RefreshCw size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={dynamicStyles.resultRetryText}>{t.medicines.scan.rescan}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!scanResult && (
            <View style={styles.cameraWrapper}>
              {renderCamera()}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CORNER = 22;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  resultActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cameraWrapper: { height: 360, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#0a0a0a' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  frameGuide: { width: 260, height: 160, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: 'rgba(255,255,255,0.9)' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 4 },
  frameHint: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter-Medium', fontSize: 13, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  captureRow: { alignItems: 'center', paddingVertical: Spacing.lg, backgroundColor: '#0a0a0a', gap: Spacing.sm },
  captureBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  captureBtnDisabled: { opacity: 0.6 },
  captureHint: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter-Regular', fontSize: 12 },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.lg },
  permIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  permTitle: { ...Typography.h3, textAlign: 'center' },
  permText: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: Radius.lg, paddingVertical: 13, paddingHorizontal: Spacing.xxl, ...Shadows.button },
  permBtnText: { ...Typography.button },
});
