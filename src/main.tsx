import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorLog, crashLogLine, installGlobalErrorHandlers } from './platform/errorReport';
import { ErrorBoundary, RecoveryScreen } from './ui/ErrorBoundary';
import './ui/art/uiArt.generated.css';
import './styles.css';

// Error resilience (TEC-14): the log and the global handlers exist before the app module loads, so even a
// content check that throws while the game modules evaluate ends on a recovery screen, not a blank window.
const errorLog = new ErrorLog();
installGlobalErrorHandlers(window, errorLog);
// The desktop app copies these console lines into a log file in its own data folder (electron/crashLog.cjs).
errorLog.subscribe((entry) => console.error(crashLogLine(entry)));

const root = createRoot(document.getElementById('root')!);
import('./App').then(
  ({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary log={errorLog}>
          <App errorLog={errorLog} />
        </ErrorBoundary>
      </StrictMode>,
    );
  },
  (error: unknown) => {
    errorLog.record('boot', error);
    root.render(
      <RecoveryScreen
        log={errorLog}
        title="게임을 불러오지 못했습니다"
        body="게임 파일을 읽는 중 오류가 났습니다. 저장된 진행 데이터는 지워지지 않았습니다. 다시 불러와도 같으면 로그를 복사해 알려 주세요."
      />,
    );
  },
);
