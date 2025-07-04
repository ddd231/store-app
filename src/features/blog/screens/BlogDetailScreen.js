import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../auth/hooks/useAuth';
import { checkIsDeveloper } from '../../../shared/utils/permissions';
import { isAdminUser } from '../../../shared/utils/adminUtils';

export default function BlogDetailScreen({ navigation, route }) {
  const { blog } = route.params;
  const { user } = useAuth();
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(function() {
    if (user) {
      setIsDeveloper(checkIsDeveloper(user));
    }
  }, [user]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={function() { navigation.goBack(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>블로그</Text>
        {isDeveloper ? (
          <TouchableOpacity 
            onPress={function() { navigation.navigate('BlogEdit', { blogId: blog?.id }); }}
            style={styles.editButton}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목과 메타 정보 */}
        <View style={styles.section}>
          <Text style={styles.title}>{blog.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.author}>{blog.author}</Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.date}>{blog.date}</Text>
          </View>
        </View>

        {/* 본문 */}
        <View style={styles.section}>
          <Text style={styles.description}>{blog.description}</Text>
        </View>

        {/* 태그 */}
        {blog.tags && blog.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tagContainer}>
              {blog.tags.map(function(tag, index) { return (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ); })}
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
      
      {/* 관리자 업로드 버튼 */}
      {isAdmin && (
        <TouchableOpacity 
          style={styles.adminUploadButton}
          onPress={function() { Alert.alert('업로드', '블로그 업로드 기능 준비 중입니다.'); }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  separator: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.sm,
  },
  date: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: theme.colors.text.primary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  bottomSpace: {
    height: 50,
  },
  adminUploadButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});