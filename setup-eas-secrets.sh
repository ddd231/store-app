#!/bin/bash

# EAS 시크릿 설정 스크립트
# 이 스크립트는 환경변수를 EAS 시크릿으로 안전하게 관리하는 방법을 제공합니다.

echo "🔐 EAS 시크릿 설정 시작..."

# 1. 현재 .env 파일 확인
echo "📋 현재 .env 파일 내용:"
if [ -f .env ]; then
    cat .env | grep -E "^[^#]" | head -5
else
    echo "⚠️  .env 파일이 없습니다."
fi

echo ""
echo "🚨 중요: 다음 명령어들을 수동으로 실행해야 합니다:"
echo ""

# 2. EAS 시크릿 설정 명령어들
echo "# Supabase 설정"
echo "eas secret:create --scope project --name SUPABASE_URL --value \"https://zudnmkyedvhdgftbwatt.supabase.co\""
echo "eas secret:create --scope project --name SUPABASE_ANON_KEY --value \"[새로운_ANON_KEY]\""
echo ""

echo "# Google Play API 설정 (옵션)"
echo "eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_EMAIL --value \"[새로운_서비스_계정_이메일]\""
echo "eas secret:create --scope project --name GOOGLE_PRIVATE_KEY --value \"[새로운_개인_키]\""
echo ""

echo "# 기타 환경변수"
echo "eas secret:create --scope project --name APP_URL --value \"arld://auth\""
echo "eas secret:create --scope project --name STORE_URL --value \"https://arldstore.com\""
echo ""

echo "# 설정된 시크릿 확인"
echo "eas secret:list"

echo ""
echo "📝 주의사항:"
echo "1. [새로운_ANON_KEY] 부분은 새로 생성된 Supabase anon key로 교체"
echo "2. [새로운_서비스_계정_이메일]과 [새로운_개인_키]는 새로 생성된 Google 서비스 계정 정보로 교체"
echo "3. 모든 시크릿 설정 후 기존 .env 파일은 삭제하거나 안전한 곳으로 이동"
echo "4. eas.json 파일에서 환경변수 참조가 올바르게 설정되어 있는지 확인"

echo ""
echo "🔍 현재 eas.json 설정 확인:"
if [ -f eas.json ]; then
    echo "✅ eas.json 파일이 존재합니다."
    echo "환경변수 참조 방식 확인:"
    grep -A 10 "\"env\":" eas.json | head -15
else
    echo "⚠️  eas.json 파일이 없습니다."
fi

echo ""
echo "🚀 설정 완료 후 빌드 테스트:"
echo "eas build --platform android --profile preview"
echo "eas build --platform ios --profile preview"