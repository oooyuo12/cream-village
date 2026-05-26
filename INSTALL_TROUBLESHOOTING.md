# 설치 오류 해결 안내

이 버전은 `package-lock.json`을 제거해 사용자의 환경에서 npm이 정상 레지스트리로 새로 설치하도록 만든 버전입니다.

권장 설치 위치: OneDrive/바탕 화면이 아닌 `C:\Projects\cream-merged` 같은 일반 폴더.

```powershell
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
npm run dev
```
