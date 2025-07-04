import { StyleSheet, Dimensions, Platform } from 'react-native';
import { theme } from '../../../styles/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3;

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatListContent: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  portfolioRow: {
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xl,
  },
  workCard: {
    width: cardWidth,
    marginBottom: 10,
    height: cardWidth * 1.2 + 60,
  },
  workImage: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: 0,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  workPlaceholder: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: 0,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D0',
    marginBottom: theme.spacing.sm,
  },
  novelPreview: {
    width: '100%',
    height: cardWidth * 1.2,
    borderRadius: 0,
    backgroundColor: 'white',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E8E0D0',
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  novelPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  workTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  workCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
});