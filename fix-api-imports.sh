#!/bin/bash

# 모든 API import를 새로운 API로 변경하는 스크립트

echo "Fixing API imports..."

# 모든 .tsx 파일에서 기존 API import를 새로운 것으로 변경
find . -name "*.tsx" -exec sed -i 's/from "\.\.\/utils\/api"/from "\.\.\/utils\/api-fixed"/g' {} \;
find . -name "*.tsx" -exec sed -i 's/from "\.\/utils\/api"/from "\.\/utils\/api-fixed"/g' {} \;
find . -name "*.tsx" -exec sed -i 's/from "utils\/api"/from "utils\/api-fixed"/g' {} \;

echo "API imports fixed!"