#!/usr/bin/env node

/**
 * 환경변수 검증 스크립트
 * 모든 필요한 환경변수가 올바르게 설정되어 있는지 확인합니다.
 */

const fs = require('fs');
const path = require('path');

// 필수 환경변수 목록
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_APP_URL',
  'EXPO_PUBLIC_STORE_URL'
];

// 선택적 환경변수 목록
const OPTIONAL_ENV_VARS = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EXPO_PUBLIC_ENCRYPTION_KEY'
];

// 위험한 테스트 값들
const DANGEROUS_VALUES = [
  'test',
  'demo',
  'example',
  'placeholder',
  'PUT_YOUR_',
  'your-service-account',
  'your-project'
];

// 노출된 키들 (즉시 교체 필요)
const EXPOSED_KEYS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZG5ta3llZHZoZGdmdGJ3YXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTc5NjYsImV4cCI6MjA2MzA3Mzk2Nn0.FwQ2yqazywF3bGSN7N0I27ZC_nas32J6tKCoGeC3eeQ',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZG5ta3llZHZoZGdmdGJ3YXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ5Nzk2NiwiZXhwIjoyMDYzMDczOTY2fQ.Z1RYZVQ25FN6ufO1I79KLEf96Jqqdzk-F0GL8p5b260',
  'arldgoogleplayverifier@western-voyage-464507-g7.iam.gserviceaccount.com'
];

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]*?)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function validateEnvironment() {
  console.log('🔍 환경변수 검증 시작...\n');
  
  const envFile = path.join(process.cwd(), '.env');
  const env = loadEnvFile(envFile) || process.env;
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // 1. 필수 환경변수 확인
  console.log('📋 필수 환경변수 확인:');
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!env[varName]) {
      console.log(`❌ ${varName}: 누락됨`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: 설정됨`);
    }
  });
  
  console.log('\n📋 선택적 환경변수 확인:');
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (env[varName]) {
      console.log(`✅ ${varName}: 설정됨`);
    } else {
      console.log(`⚠️  ${varName}: 설정되지 않음`);
    }
  });
  
  // 2. 위험한 값 확인
  console.log('\n🚨 보안 위험 확인:');
  const allVars = [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS];
  
  allVars.forEach(varName => {
    const value = env[varName];
    if (value) {
      // 위험한 테스트 값 확인
      const hasDangerousValue = DANGEROUS_VALUES.some(dangerous => 
        value.toLowerCase().includes(dangerous.toLowerCase())
      );
      
      if (hasDangerousValue) {
        console.log(`🚨 ${varName}: 테스트/플레이스홀더 값 감지됨`);
        hasWarnings = true;
      }
      
      // 노출된 키 확인
      const isExposedKey = EXPOSED_KEYS.some(exposed => value.includes(exposed));
      if (isExposedKey) {
        console.log(`🔴 ${varName}: 노출된 키 감지됨 - 즉시 교체 필요!`);
        hasErrors = true;
      }
    }
  });
  
  // 3. URL 형식 검증
  console.log('\n🔗 URL 형식 검증:');
  if (env.EXPO_PUBLIC_SUPABASE_URL) {
    try {
      new URL(env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('✅ SUPABASE_URL: 유효한 URL 형식');
    } catch {
      console.log('❌ SUPABASE_URL: 잘못된 URL 형식');
      hasErrors = true;
    }
  }
  
  if (env.EXPO_PUBLIC_STORE_URL) {
    try {
      new URL(env.EXPO_PUBLIC_STORE_URL);
      console.log('✅ STORE_URL: 유효한 URL 형식');
    } catch {
      console.log('❌ STORE_URL: 잘못된 URL 형식');
      hasErrors = true;
    }
  }
  
  // 4. JWT 토큰 검증
  console.log('\n🔑 JWT 토큰 검증:');
  if (env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const parts = env.EXPO_PUBLIC_SUPABASE_ANON_KEY.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('✅ SUPABASE_ANON_KEY: 유효한 JWT 형식');
        console.log(`   - 역할: ${payload.role}`);
        console.log(`   - 만료: ${new Date(payload.exp * 1000).toISOString()}`);
      } else {
        console.log('❌ SUPABASE_ANON_KEY: 잘못된 JWT 형식');
        hasErrors = true;
      }
    } catch {
      console.log('❌ SUPABASE_ANON_KEY: JWT 파싱 실패');
      hasErrors = true;
    }
  }
  
  // 5. 결과 요약
  console.log('\n📊 검증 결과:');
  if (hasErrors) {
    console.log('🔴 오류 발견: 즉시 수정이 필요한 문제가 있습니다.');
  } else if (hasWarnings) {
    console.log('🟡 경고 발견: 권장사항을 검토해주세요.');
  } else {
    console.log('🟢 검증 완료: 모든 환경변수가 올바르게 설정되었습니다.');
  }
  
  console.log('\n💡 권장사항:');
  console.log('1. 노출된 키들은 즉시 새로운 키로 교체');
  console.log('2. 테스트/플레이스홀더 값들은 실제 값으로 교체');
  console.log('3. EAS 시크릿 사용을 위해 ./setup-eas-secrets.sh 실행');
  console.log('4. 정기적인 키 로테이션 계획 수립');
  
  return hasErrors ? 1 : 0;
}

// 스크립트 실행
if (require.main === module) {
  const exitCode = validateEnvironment();
  process.exit(exitCode);
}

module.exports = { validateEnvironment };