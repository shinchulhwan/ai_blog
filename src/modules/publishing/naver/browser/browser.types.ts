export interface BrowserHealthCheckResult {
  healthy: boolean;
  running: boolean;
  mock: boolean;
  message: string;
}

export interface BrowserLaunchOptions {
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
}

export interface BrowserPageHandle {
  id: string;
  browserId: string;
  url: string;
  mock: boolean;
}

export interface BrowserInstance {
  id: string;
  launchedAt: Date;
  headless: boolean;
  mock: boolean;
}

export interface BrowserManagerConfig {
  userDataDir?: string;
  defaultLaunchOptions?: BrowserLaunchOptions;
}
