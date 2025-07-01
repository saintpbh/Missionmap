#!/bin/bash

# AutoBackUp - 맥용 missionary-map-app 백업 스크립트
# 사용법: ./AutoBackUp.sh 또는 오토백업 명령어로 실행

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정 변수
SOURCE_DIR="/Users/mag/Documents/GitHub/Missionmap/지난자료"
BACKUP_BASE_DIR="/Users/mag/Documents/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE_DIR/missionary-map-app_backup_$TIMESTAMP"

# 로고 출력
print_logo() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                        AutoBackUp                           ║"
    echo "║                 Missionary Map App Backup                   ║"
    echo "║                      macOS Version                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 진행 상황 표시
show_progress() {
    local message="$1"
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] $message${NC}"
}

# 성공 메시지
show_success() {
    local message="$1"
    echo -e "${GREEN}✅ $message${NC}"
}

# 에러 메시지
show_error() {
    local message="$1"
    echo -e "${RED}❌ $message${NC}"
}

# 백업 디렉토리 생성
create_backup_dir() {
    show_progress "백업 디렉토리 생성 중..."
    
    if [ ! -d "$BACKUP_BASE_DIR" ]; then
        mkdir -p "$BACKUP_BASE_DIR"
        show_success "백업 베이스 디렉토리 생성: $BACKUP_BASE_DIR"
    fi
    
    mkdir -p "$BACKUP_DIR"
    show_success "백업 디렉토리 생성: $BACKUP_DIR"
}

# 소스 디렉토리 확인
check_source() {
    show_progress "소스 디렉토리 확인 중..."
    
    if [ ! -d "$SOURCE_DIR" ]; then
        show_error "소스 디렉토리를 찾을 수 없습니다: $SOURCE_DIR"
        exit 1
    fi
    
    show_success "소스 디렉토리 확인 완료: $SOURCE_DIR"
}

# 파일 복사 및 백업
perform_backup() {
    show_progress "백업 시작..."
    
    # rsync를 사용한 효율적인 백업
    rsync -av --progress "$SOURCE_DIR/" "$BACKUP_DIR/" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        show_success "파일 복사 완료"
    else
        show_error "백업 중 오류 발생"
        exit 1
    fi
}

# 백업 정보 파일 생성
create_backup_info() {
    show_progress "백업 정보 파일 생성 중..."
    
    local info_file="$BACKUP_DIR/backup_info.txt"
    
    cat > "$info_file" << EOF
AutoBackUp - Missionary Map App Backup Information
================================================

백업 날짜: $(date '+%Y년 %m월 %d일 %H시 %M분 %S초')
소스 경로: $SOURCE_DIR
백업 경로: $BACKUP_DIR
백업 타입: 전체 백업
시스템: macOS $(sw_vers -productVersion)
사용자: $(whoami)

파일 통계:
- 총 파일 수: $(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')
- 총 디렉토리 수: $(find "$BACKUP_DIR" -type d | wc -l | tr -d ' ')
- 백업 크기: $(du -sh "$BACKUP_DIR" | cut -f1)

백업 완료 시간: $(date '+%Y년 %m월 %d일 %H시 %M분 %S초')
EOF

    show_success "백업 정보 파일 생성 완료"
}

# 압축 백업 (선택사항)
create_archive() {
    show_progress "백업 압축 중..."
    
    local archive_name="missionary-map-app_backup_$TIMESTAMP.tar.gz"
    local archive_path="$BACKUP_BASE_DIR/$archive_name"
    
    tar -czf "$archive_path" -C "$BACKUP_BASE_DIR" "missionary-map-app_backup_$TIMESTAMP"
    
    if [ $? -eq 0 ]; then
        show_success "압축 백업 생성 완료: $archive_path"
        
        # 압축 후 원본 백업 폴더 삭제 여부 확인
        read -p "압축이 완료되었습니다. 원본 백업 폴더를 삭제하시겠습니까? (y/N): " delete_original
        if [[ $delete_original =~ ^[Yy]$ ]]; then
            rm -rf "$BACKUP_DIR"
            show_success "원본 백업 폴더 삭제 완료"
        fi
    else
        show_error "압축 백업 생성 실패"
    fi
}

# 이전 백업 정리
cleanup_old_backups() {
    show_progress "이전 백업 정리 중..."
    
    # 7일 이상 된 백업 파일 찾기
    local old_backups=$(find "$BACKUP_BASE_DIR" -name "missionary-map-app_backup_*" -type d -mtime +7)
    local old_archives=$(find "$BACKUP_BASE_DIR" -name "missionary-map-app_backup_*.tar.gz" -mtime +7)
    
    if [ ! -z "$old_backups" ] || [ ! -z "$old_archives" ]; then
        echo -e "${YELLOW}7일 이상 된 백업을 발견했습니다:${NC}"
        echo "$old_backups"
        echo "$old_archives"
        
        read -p "이전 백업들을 삭제하시겠습니까? (y/N): " cleanup_confirm
        if [[ $cleanup_confirm =~ ^[Yy]$ ]]; then
            echo "$old_backups" | xargs rm -rf 2>/dev/null
            echo "$old_archives" | xargs rm -f 2>/dev/null
            show_success "이전 백업 정리 완료"
        fi
    else
        show_success "정리할 이전 백업이 없습니다"
    fi
}

# 백업 완료 요약
show_summary() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                      백업 완료 요약                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    local final_backup_path="$BACKUP_DIR"
    local final_backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

    # 압축을 했다면 경로와 크기를 압축 파일 기준으로 변경
    if [[ "$compress_backup" =~ ^[Yy]$ ]]; then
        local archive_name="missionary-map-app_backup_$TIMESTAMP.tar.gz"
        final_backup_path="$BACKUP_BASE_DIR/$archive_name"
        final_backup_size=$(du -sh "$final_backup_path" 2>/dev/null | cut -f1)
    fi

    echo -e "${GREEN}백업 성공!${NC}"
    echo "백업 위치: $final_backup_path"
    echo "백업 시간: $(date '+%Y년 %m월 %d일 %H시 %M분 %S초')"
    echo "백업 크기: $final_backup_size"
    
    # Finder에서 백업 폴더 열기 옵션
    read -p "Finder에서 백업 폴더를 열어보시겠습니까? (y/N): " open_finder
    if [[ $open_finder =~ ^[Yy]$ ]]; then
        open "$BACKUP_BASE_DIR"
    fi
}

# --- 추가된 함수: GitHub & Firebase ---
print_header() {
    echo ""
    echo -e "${YELLOW}==================================================${NC}"
    echo -e "${YELLOW} $1 ${NC}"
    echo -e "${YELLOW}==================================================${NC}"
}

perform_github_push() {
    print_header "🚀 GitHub 저장소 업데이트"

    # Git 레포지토리 루트로 이동 (Missionmap)
    # 스크립트 위치 기준으로 상위 폴더로 이동
    cd "$(dirname "$0")/.."

    # 변경사항 확인
    git status -s
    echo ""

    read -p "모든 변경사항을 GitHub에 푸시하시겠습니까? (y/N): " confirm_push
    if [[ "$confirm_push" != "y" && "$confirm_push" != "Y" ]]; then
        echo "GitHub 푸시를 건너뜁니다."
        return
    fi

    read -p "커밋 메시지를 입력하세요 (기본: 'auto commit from script'): " commit_message
    if [ -z "$commit_message" ]; then
        commit_message="auto commit from deploy script"
    fi

    echo ""
    echo "Git add..."
    git add .

    echo "Git commit..."
    git commit -m "$commit_message"

    echo "Git push..."
    git push origin main

    if [ $? -eq 0 ]; then
        show_success "GitHub에 성공적으로 푸시했습니다."
    else
        show_error "GitHub 푸시에 실패했습니다."
    fi
}

perform_firebase_deploy() {
    print_header "🔥 Firebase 배포"

    read -p "'Admin' 프로젝트를 Firebase에 배포하시겠습니까? (y/N): " confirm_deploy
    if [[ "$confirm_deploy" != "y" && "$confirm_deploy" != "Y" ]]; then
        echo "Firebase 배포를 건너뜁니다."
        return
    fi
    
    # Admin 디렉토리로 이동
    cd "지난자료/Admin"

    echo ""
    echo "Firebase에 배포를 시작합니다..."
    firebase deploy

    if [ $? -eq 0 ]; then
        show_success "Firebase 배포가 성공적으로 완료되었습니다!"
    else
        show_error "Firebase 배포에 실패했습니다."
    fi
}

# 메인 실행 함수
main() {
    print_logo
    
    echo -e "${BLUE}Missionary Map App 백업을 시작합니다...${NC}"
    echo ""
    
    # 백업 과정 실행
    check_source
    create_backup_dir
    perform_backup
    create_backup_info
    
    # 압축 백업 여부 확인
    read -p "백업을 압축하시겠습니까? (y/N): " compress_backup
    if [[ $compress_backup =~ ^[Yy]$ ]]; then
        create_archive
    fi
    
    # 이전 백업 정리
    cleanup_old_backups
    
    # 완료 요약
    show_summary

    # GitHub 푸시 실행
    perform_github_push

    # Firebase 배포 실행
    perform_firebase_deploy

    echo ""
    show_success "모든 작업이 완료되었습니다."
}

# 도움말 표시
show_help() {
    echo "AutoBackUp - Missionary Map App 백업 스크립트"
    echo ""
    echo "사용법:"
    echo "  ./AutoBackUp.sh          # 백업 실행"
    echo "  ./AutoBackUp.sh --help   # 도움말 표시"
    echo ""
    echo "기능:"
    echo "  - missionary-map-app 전체 백업"
    echo "  - GitHub 저장소에 변경사항 푸시 (선택)"
    echo "  - Firebase 프로젝트 배포 (선택)"
    echo "  - 타임스탬프 기반 백업 폴더 생성"
    echo "  - 백업 정보 파일 자동 생성"
    echo "  - 선택적 압축 백업"
    echo "  - 7일 이상 된 백업 자동 정리"
    echo ""
}

# 스크립트 실행
case "$1" in
    --help|-h)
        show_help
        ;;
    *)
        main
        ;;
esac 