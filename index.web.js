import { AppRegistry } from 'react-native';
import App from './App';

// React Native Web에서 앱 등록
AppRegistry.registerComponent('PortfolioChatApp', () => App);

// DOM이 로드된 후 앱 실행
document.addEventListener('DOMContentLoaded', () => {
  const rootTag = document.getElementById('app-root');
  if (rootTag) {
    AppRegistry.runApplication('PortfolioChatApp', { rootTag });
  } else {
    console.error('app-root element not found');
  }
});