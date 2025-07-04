// 미니멀 디자인 테마
export const theme = {
  colors: {
    primary: '#00BFFF', // 진한 하늘색 (Deep Sky Blue)
    secondary: '#5856D6', // 보라색
    background: '#F5F1E8',
    surface: '#F2F2F7', // 연한 회색 배경
    text: {
      primary: '#000000',
      secondary: '#000000',
      placeholder: '#C7C7CC'
    },
    border: '#E5E5EA',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  typography: {
    title: {
      fontSize: 34,
      fontWeight: 'bold',
      letterSpacing: 0.37
    },
    heading: {
      fontSize: 28,
      fontWeight: '600',
      letterSpacing: 0.36
    },
    subheading: {
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: 0.38
    },
    body: {
      fontSize: 17,
      fontWeight: '400',
      letterSpacing: -0.41
    },
    caption: {
      fontSize: 13,
      fontWeight: '400',
      letterSpacing: -0.08
    },
    small: {
      fontSize: 11,
      fontWeight: '400',
      letterSpacing: 0.07
    }
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8
    }
  }
};