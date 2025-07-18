import { StyleSheet } from 'react-native';
import { theme } from '../../../styles/theme';

export const profileHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 45,
    paddingBottom: theme.spacing.md,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: theme.spacing.lg,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: -2,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  addFriendText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    fontSize: 12,
  },
  menuButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  userName: {
    ...theme.typography.heading,
    color: '#000000',
    marginBottom: theme.spacing.sm,
  },
  userBio: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
  },
  statValue: {
    ...theme.typography.heading,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    ...theme.typography.caption,
    color: '#000000',
    marginTop: 4,
  },
  qrButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#000000',
  },
  qrButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
    color: '#000000',
  },
});