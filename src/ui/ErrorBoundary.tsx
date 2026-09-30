import { Component, Fragment, useState, type ErrorInfo, type ReactNode } from 'react';
import { formatErrorReport, type ErrorLog } from '../platform/errorReport';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export async function copyErrorReport(log: ErrorLog, scene?: string) {
  const report = formatErrorReport(log.entries(), { version: APP_VERSION, userAgent: navigator.userAgent, scene });
  if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
  await navigator.clipboard.writeText(report);
}

type RecoveryScreenProps = {
  log: ErrorLog;
  title: string;
  body: string;
  /** Leave out to offer only a reload (the app itself failed to load). */
  onReturn?: () => void;
};

/** Full-screen recovery for failures outside the game loop: return to the menu, copy the log, or reload. */
export function RecoveryScreen({ log, title, body, onReturn }: RecoveryScreenProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const latest = log.entries().at(-1);
  const copy = async () => {
    try {
      await copyErrorReport(log);
      setCopyStatus('오류 로그를 복사했습니다.');
    } catch {
      setCopyStatus('클립보드를 사용할 수 없어 로그를 복사하지 못했습니다.');
    }
  };
  return (
    <div className="appShell recoveryShell">
      <section className="settlementBox recoveryBox" role="alertdialog" aria-labelledby="recovery-title" aria-describedby="recovery-body">
        <div className="modalHead">
          <p>SOMETHING BROKE</p>
          <h2 id="recovery-title">{title}</h2>
        </div>
        <p id="recovery-body">{body}</p>
        {latest && <p className="faultMessage"><code>{latest.message}</code></p>}
        {copyStatus && <p className="seedStatus" role="status" aria-live="polite">{copyStatus}</p>}
        <div className="modalActions">
          {onReturn && <button className="primary" onClick={onReturn}>메뉴로 돌아가기</button>}
          <button className="ghost" type="button" onClick={() => void copy()}>로그 복사</button>
          <button className={onReturn ? 'ghost' : 'primary'} type="button" onClick={() => window.location.reload()}>다시 불러오기</button>
        </div>
      </section>
    </div>
  );
}

type ErrorBoundaryProps = { log: ErrorLog; children: ReactNode };
type ErrorBoundaryState = { failed: boolean; generation: number };

/**
 * Catches render errors anywhere in the app (TEC-14). Returning to the menu remounts the app from its saved
 * state; the run in progress is lost, the save is not.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, generation: 0 };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.log.record('render', error, info.componentStack ?? undefined);
  }

  render() {
    if (this.state.failed) {
      return (
        <RecoveryScreen
          log={this.props.log}
          title="화면을 그리다 문제가 생겼습니다"
          body="진행 중이던 Run은 끝났지만 저장된 골드, 강화, 해금 진행도는 그대로입니다. 메뉴로 돌아가 다시 시작할 수 있습니다."
          onReturn={() => this.setState((state) => ({ failed: false, generation: state.generation + 1 }))}
        />
      );
    }
    return <Fragment key={this.state.generation}>{this.props.children}</Fragment>;
  }
}
