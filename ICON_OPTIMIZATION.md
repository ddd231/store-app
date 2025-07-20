# 📱 앱 아이콘 최적화 가이드

## 현재 상황
- **icon.png**: 1,227,467 bytes (1.2MB) - 너무 큼
- **adaptive-icon.png**: 1,227,467 bytes (1.2MB) - 너무 큼
- **favicon.png**: 735,012 bytes (718KB) - 여전히 큼

## 권장 크기
- **iOS 앱 아이콘**: 1024x1024px, 200KB 이하
- **Android 아이콘**: 512x512px, 150KB 이하  
- **웹 파비콘**: 64x64px, 10KB 이하

## 수동 최적화 방법

### 1. 온라인 도구 사용 (추천)
- **TinyPNG**: https://tinypng.com/
- **Squoosh**: https://squoosh.app/
- **ImageOptim**: https://imageoptim.com/online

### 2. 아이콘 생성 단계
1. **arld-logo.png** 파일을 위 온라인 도구에 업로드
2. 다음 크기로 리사이징 및 최적화:
   - `icon.png`: 1024x1024px, PNG 압축
   - `adaptive-icon.png`: 1024x1024px, PNG 압축
   - `favicon.png`: 64x64px, PNG 압축

### 3. 목표 파일 크기
- `icon.png`: 100-200KB
- `adaptive-icon.png`: 100-200KB
- `favicon.png`: 5-10KB

## 자동 최적화 (ImageMagick 필요)
```bash
# 만약 ImageMagick가 설치되어 있다면:
convert arld-logo.png -resize 1024x1024 -quality 85 icon.png
convert arld-logo.png -resize 1024x1024 -quality 85 adaptive-icon.png
convert arld-logo.png -resize 64x64 -quality 85 favicon.png
```

## 완료 후 확인사항
1. 빌드 크기 감소 확인
2. 아이콘 품질 확인
3. 다양한 기기에서 아이콘 표시 테스트

## 백업 파일
- `icon_backup.png`: 원본 아이콘 백업 (필요시 복원 가능)