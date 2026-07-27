#!/bin/zsh
set -u
setopt PIPE_FAIL
unsetopt BG_NICE

cd -- "$(dirname -- "$0")" || exit 1

readonly ARM_APP="$PWD/release-developer/mac-arm64/Blackline Survivor Dev.app"
readonly UNIVERSAL_APP="$PWD/release-developer/mac/Blackline Survivor Dev.app"
readonly LOG_FILE="${TMPDIR:-/tmp}/blackline-survivor-developer-launch.log"

pause_on_error() {
  if [[ -t 0 && "${BLACKLINE_NO_PAUSE:-0}" != "1" ]]; then
    printf "\nEnter 키를 누르면 창이 닫힙니다."
    read -r
  fi
}

fail() {
  local message="$1"
  printf "\n[실행 실패] %s\n" "$message" >&2
  printf "로그: %s\n" "$LOG_FILE" >&2
  if [[ -s "$LOG_FILE" ]]; then
    printf "\n--- 최근 로그 ---\n" >&2
    tail -n 20 "$LOG_FILE" >&2
  fi
  pause_on_error
  exit 1
}

build_app() {
  command -v npm >/dev/null 2>&1 || fail "npm 명령어를 찾지 못했습니다."
  printf "개발자 앱을 빌드합니다. 잠시 기다려 주세요.\n"
  npm run package:mac:developer 2>&1 | tee -a "$LOG_FILE"
  [[ ${pipestatus[1]} -eq 0 ]] || fail "개발자 앱 빌드에 실패했습니다."
}

run_unpacked_app() {
  command -v npm >/dev/null 2>&1 || fail "npm 명령어를 찾지 못했습니다."
  printf "로컬 Electron 개발자 앱으로 다시 시도합니다.\n"
  printf "이 터미널 창은 게임을 종료할 때까지 유지됩니다.\n\n"
  npm run electron:developer 2>&1 | tee -a "$LOG_FILE"
  local exit_code=${pipestatus[1]}
  [[ $exit_code -eq 0 ]] && exit 0
  fail "로컬 Electron 앱 실행에 실패했습니다. 종료 코드: $exit_code"
}

find_app() {
  if [[ -d "$ARM_APP" ]]; then
    printf "%s" "$ARM_APP"
  elif [[ -d "$UNIVERSAL_APP" ]]; then
    printf "%s" "$UNIVERSAL_APP"
  fi
}

: > "$LOG_FILE"
printf "Blackline Survivor Dev 실행 준비 중...\n"

if [[ "${1:-}" == "--rebuild" ]]; then
  build_app
fi

APP_PATH="$(find_app)"
if [[ -z "$APP_PATH" ]]; then
  build_app
  APP_PATH="$(find_app)"
fi
[[ -n "$APP_PATH" ]] || fail "빌드 후 앱 번들을 찾지 못했습니다."

EXECUTABLE_NAME="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' \
  "$APP_PATH/Contents/Info.plist" 2>>"$LOG_FILE")"
[[ -n "$EXECUTABLE_NAME" ]] || fail "앱 실행 파일 이름을 읽지 못했습니다."

EXECUTABLE_PATH="$APP_PATH/Contents/MacOS/$EXECUTABLE_NAME"
[[ -x "$EXECUTABLE_PATH" ]] || fail "앱 실행 파일이 없거나 실행 권한이 없습니다."

printf "앱 실행 중...\n"
nohup /usr/bin/open -n -W "$APP_PATH" >>"$LOG_FILE" 2>&1 &
OPEN_PID=$!
sleep 5

if kill -0 "$OPEN_PID" >/dev/null 2>&1; then
  kill "$OPEN_PID" >/dev/null 2>&1
  wait "$OPEN_PID" >/dev/null 2>&1
  printf "Blackline Survivor Dev 실행 요청을 완료했습니다.\n"
  exit 0
fi

wait "$OPEN_PID" >/dev/null 2>&1
printf "macOS 앱 열기에 실패하여 실행 파일을 직접 시작합니다.\n"
nohup "$EXECUTABLE_PATH" >>"$LOG_FILE" 2>&1 &
APP_PID=$!
sleep 5

if kill -0 "$APP_PID" >/dev/null 2>&1; then
  printf "Blackline Survivor Dev가 실행되었습니다. (PID: %s)\n" "$APP_PID"
  exit 0
fi

wait "$APP_PID"
APP_STATUS=$?
printf "패키지 앱이 즉시 종료되었습니다. 종료 코드: %s\n" "$APP_STATUS"
run_unpacked_app
