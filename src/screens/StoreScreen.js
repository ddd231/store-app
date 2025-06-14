import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';

export default function StoreScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Printful API 호출
      const response = await fetch('/api/printful/products');
      const data = await response.json();
      setProducts(data.result || []);
    } catch (error) {
      console.error('제품 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product) => {
    if (Platform.OS === 'web') {
      // 웹에서는 바로 주문 페이지로
      window.open(`/store/product/${product.id}`, '_self');
    } else {
      // 앱에서는 상세 화면으로
      navigation.navigate('ProductDetail', { productId: product.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ARLD STORE</Text>
        <Text style={styles.subtitle}>Print on Demand</Text>
      </View>

      <View style={styles.productsGrid}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
          >
            <Image
              source={{ uri: product.thumbnail_url }}
              style={styles.productImage}
            />
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.retail_price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  productCard: {
    width: Platform.OS === 'web' ? '30%' : '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: theme.spacing.sm,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});