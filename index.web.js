import { AppRegistry } from 'react-native';
import App from './App';

// React Native Web에서 앱 등록
AppRegistry.registerComponent('PortfolioChatApp', () => App);

// 웹에서 앱 렌더링
AppRegistry.runApplication('PortfolioChatApp', {
  rootTag: document.getElementById('app-root')
});