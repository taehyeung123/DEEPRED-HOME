#!/usr/bin/env bash
# GitHub Pages(gh-pages 브랜치) 배포 스크립트 — Git Bash에서 실행
set -euo pipefail
cd "$(dirname "$0")/.."

MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" NEXT_PUBLIC_BASE_PATH="/DEEPRED-HOME" npm run build

cd out
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@deepred.local" commit -q -m "Deploy DEEPRED site"
git push -f https://github.com/taehyeung123/DEEPRED-HOME.git gh-pages:gh-pages
cd ..
rm -rf out/.git
echo "배포 완료: https://taehyeung123.github.io/DEEPRED-HOME/"
