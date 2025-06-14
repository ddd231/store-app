import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';

export default function EditGalleryScreen({ navigation, route }) {
  const { galleryId } = route.params;
  const [galleryName, setGalleryName] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [myWorks, setMyWorks] = useState([]);
  const [selectedWorks, setSelectedWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadGalleryData();
    loadUserAndWorks();
  }, [galleryId]);

  const loadGalleryData = async () => {
    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single();

      if (error) throw error;

      setGalleryName(gallery.name);
      setGalleryDescription(gallery.description || '');
      setSelectedWorks(gallery.work_ids || []);
    } catch (error) {
      console.error('갤러리 로드 오류:', error);
      Alert.alert('오류', '갤러리를 불러올 수 없습니다.');
      navigation.goBack();
    }
  };

  const loadUserAndWorks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        const { data: works, error } = await supabase
          .from('works')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setMyWorks(works || []);
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };

  const toggleWorkSelection = (workId) => {
    setSelectedWorks(prev => {
      if (prev.includes(workId)) {
        return prev.filter(id => id !== workId);
      } else {
        return [...prev, workId];
      }
    });
  };

  const handleUpdateGallery = async () => {
    if (!galleryName.trim()) {
      Alert.alert('알림', '갤러리 이름을 입력해주세요.');
      return;
    }

    if (selectedWorks.length === 0) {
      Alert.alert('알림', '최소 1개 이상의 작품을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          name: galleryName,
          description: galleryDescription,
          work_ids: selectedWorks,
          updated_at: new Date().toISOString()
        })
        .eq('id', galleryId);

      if (error) throw error;

      Alert.alert('성공', '갤러리가 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('갤러리 수정 오류:', error);
      Alert.alert('오류', '갤러리 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = () => {
    Alert.alert(
      '갤러리 삭제',
      '정말로 이 갤러리를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: deleteGallery }
      ]
    );
  };

  const deleteGallery = async () => {
    try {
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (error) throw error;

      Alert.alert('성공', '갤러리가 삭제되었습니다.');
      navigation.goBack();
      navigation.goBack();
    } catch (error) {
      console.error('갤러리 삭제 오류:', error);
      Alert.alert('오류', '갤러리 삭제에 실패했습니다.');
    }
  };

  const renderWorkItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.workItem,
        selectedWorks.includes(item.id) && styles.workItemSelected
      ]}
      onPress={() => toggleWorkSelection(item.id)}
    >
      <View style={styles.workContent}>
        <View style={styles.workIcon}>
          <Ionicons 
            name={item.type === 'painting' ? 'color-palette-outline' : 'book-outline'}
            size={24}
            color={selectedWorks.includes(item.id) ? theme.colors.primary : theme.colors.text.secondary}
          />
        </View>
        <Text style={[
          styles.workTitle,
          selectedWorks.includes(item.id) && styles.workTitleSelected
        ]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      {selectedWorks.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>갤러리 편집</Text>
        <TouchableOpacity onPress={handleDeleteGallery}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 갤러리 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>갤러리 이름</Text>
          <TextInput
            style={styles.nameInput}
            value={galleryName}
            onChangeText={setGalleryName}
            placeholder="갤러리 이름을 입력하세요"
            maxLength={50}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>갤러리 설명 (선택사항)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={galleryDescription}
            onChangeText={setGalleryDescription}
            placeholder="갤러리에 대한 설명을 입력하세요"
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.colors.text.secondary}
            textAlignVertical="top"
            maxLength={200}
          />
        </View>

        {/* 작품 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>작품 선택</Text>
          <Text style={styles.sectionDescription}>갤러리에 포함할 작품들을 선택해주세요</Text>
          
          {myWorks.length > 0 ? (
            <FlatList
              data={myWorks}
              renderItem={renderWorkItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.worksList}
            />
          ) : (
            <Text style={styles.emptyText}>아직 작품이 없습니다</Text>
          )}
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleUpdateGallery}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '저장 중...' : '변경사항 저장'}
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.heading,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  nameInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
  },
  descriptionInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'white',
    height: 80,
  },
  worksList: {
    marginTop: theme.spacing.sm,
  },
  workItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  workItemSelected: {
    backgroundColor: theme.colors.surface,
  },
  workContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workIcon: {
    marginRight: theme.spacing.md,
  },
  workTitle: {
    ...theme.typography.body,
    flex: 1,
  },
  workTitleSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  bottomSection: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});