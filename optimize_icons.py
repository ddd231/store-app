#!/usr/bin/env python3
"""
앱 아이콘 크기 최적화 스크립트
ARLD 로고를 기반으로 다양한 크기의 아이콘 생성
"""

from PIL import Image, ImageOps
import os

def optimize_icon(input_path, output_path, target_size, quality=85):
    """
    이미지를 지정된 크기로 리사이징하고 최적화
    
    Args:
        input_path: 원본 이미지 경로
        output_path: 출력 이미지 경로
        target_size: 목표 크기 (width, height)
        quality: JPEG 품질 (PNG의 경우 압축 레벨)
    """
    try:
        # 원본 이미지 열기
        with Image.open(input_path) as img:
            # RGB 모드로 변환 (투명도 제거)
            if img.mode in ('RGBA', 'LA'):
                # 투명한 부분을 흰색으로 채우기
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 비율 유지하면서 리사이징
            img.thumbnail(target_size, Image.Resampling.LANCZOS)
            
            # 정확한 크기로 맞추기 (패딩 추가)
            if img.size != target_size:
                new_img = Image.new('RGB', target_size, (255, 255, 255))
                # 중앙에 배치
                x = (target_size[0] - img.size[0]) // 2
                y = (target_size[1] - img.size[1]) // 2
                new_img.paste(img, (x, y))
                img = new_img
            
            # PNG로 저장 (최적화 적용)
            img.save(output_path, 'PNG', optimize=True, compress_level=9)
            print(f"✅ {output_path} 생성 완료 ({target_size[0]}x{target_size[1]})")
            
            # 파일 크기 확인
            file_size = os.path.getsize(output_path)
            print(f"   파일 크기: {file_size:,} bytes ({file_size/1024:.1f}KB)")
            
    except Exception as e:
        print(f"❌ {output_path} 생성 실패: {e}")

def main():
    print("🎨 ARLD 앱 아이콘 최적화 시작...\n")
    
    # 경로 설정
    assets_dir = "/mnt/c/Users/god/main-project/react-app-web/assets"
    input_image = os.path.join(assets_dir, "arld-logo.png")
    
    # 입력 파일 확인
    if not os.path.exists(input_image):
        print(f"❌ 원본 이미지를 찾을 수 없습니다: {input_image}")
        return
    
    print(f"📁 원본 이미지: {input_image}")
    original_size = os.path.getsize(input_image)
    print(f"📊 원본 크기: {original_size:,} bytes ({original_size/1024/1024:.1f}MB)\n")
    
    # 아이콘 크기 정의
    icon_configs = [
        ("icon.png", (1024, 1024)),           # 메인 앱 아이콘
        ("adaptive-icon.png", (1024, 1024)),   # Android 적응형 아이콘
        ("favicon.png", (64, 64)),             # 웹 파비콘
    ]
    
    total_saved = 0
    
    # 각 아이콘 생성
    for filename, size in icon_configs:
        output_path = os.path.join(assets_dir, filename)
        
        # 원본 파일 크기 확인
        if os.path.exists(output_path):
            original_file_size = os.path.getsize(output_path)
            print(f"📋 기존 {filename}: {original_file_size:,} bytes ({original_file_size/1024:.1f}KB)")
        else:
            original_file_size = 0
            print(f"📋 신규 {filename} 생성 예정")
        
        # 아이콘 최적화
        optimize_icon(input_image, output_path, size)
        
        # 절약된 용량 계산
        if os.path.exists(output_path):
            new_file_size = os.path.getsize(output_path)
            saved = original_file_size - new_file_size
            total_saved += saved
            if saved > 0:
                print(f"💾 절약된 용량: {saved:,} bytes ({saved/1024:.1f}KB)")
            elif saved < 0:
                print(f"📈 용량 증가: {-saved:,} bytes ({-saved/1024:.1f}KB)")
        print()
    
    print("🎉 아이콘 최적화 완료!")
    if total_saved > 0:
        print(f"💰 총 절약된 용량: {total_saved:,} bytes ({total_saved/1024:.1f}KB)")
    elif total_saved < 0:
        print(f"📊 총 용량 변화: {-total_saved:,} bytes ({-total_saved/1024:.1f}KB)")
    
    print("\n📱 생성된 아이콘:")
    for filename, size in icon_configs:
        print(f"  • {filename}: {size[0]}x{size[1]}px")

if __name__ == "__main__":
    main()