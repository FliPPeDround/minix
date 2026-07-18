/**
 * @webviewjs/webview 的最小本地类型声明（fallback）。
 *
 * 当 @webviewjs/webview 已安装时，TypeScript 优先使用 node_modules 里的真实类型；
 * 未安装时（如离线构建本包），使用此声明让 @minix/launcher 自身能通过类型检查。
 *
 * 运行时由 vite-plugin 的 try/catch 包裹动态 import("@minix/launcher")，
 * 若 @webviewjs/webview 缺失会输出友好错误信息而非崩溃。
 *
 * 仅声明 launcher 实际用到的 API 子集。
 */
declare module "@webviewjs/webview" {
  export interface ApplicationOptions {
    controlFlow?: unknown;
    waitTime?: number;
    exitCode?: number;
  }

  export interface ApplicationRunOptions {
    interval?: number;
    ref?: boolean;
  }

  export interface ApplicationEvent {
    event: number;
    customMenuEvent?: { id: string; windowId: number };
  }

  export interface BrowserWindowOptions {
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
    decorations?: boolean;
    alwaysOnTop?: boolean;
    alwaysOnBottom?: boolean;
    visible?: boolean;
    focused?: boolean;
    transparent?: boolean;
    fullscreen?: unknown;
    logical?: boolean;
  }

  export interface WebviewBounds {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface WebviewOptions {
    url?: string;
    html?: string;
    preload?: string;
    ipcName?: string;
    webContext?: unknown;
    navigationHandler?: (url: string) => boolean;
  }

  export interface Dimensions {
    width: number;
    height: number;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ExposedTarget = Record<string, any>;

  export class Webview {
    onIpcMessage(handler?: (arg: unknown) => void): void;
    dispose(): void;
    isDisposed(): boolean;
    print(): void;
    zoom(scaleFactor: number): void;
    setWebviewVisibility(visible: boolean): void;
    isDevtoolsOpen(): boolean;
    openDevtools(): void;
    closeDevtools(): void;
    loadUrl(url: string): void;
    loadHtml(html: string): void;
    evaluateScript(js: string): void;
    evaluateScriptWithCallback(
      js: string,
      callback: (err: Error | null, arg: string) => void,
    ): void;
    reload(): void;
    url(): string | null;
    get width(): number | null;
    get height(): number | null;
    get x(): number | null;
    get y(): number | null;
    loadUrlWithHeaders(url: string, headers: Array<{ key: string; value?: string }>): void;
    getCookies(url?: string | null): Array<unknown>;
    setCookie(cookie: unknown): void;
    deleteCookie(name: string, domain?: string | null, path?: string | null): void;
    clearAllBrowsingData(): void;
    setBackgroundColor(r: number, g: number, b: number, a: number): void;
    getBounds(): WebviewBounds | null;
    setBounds(bounds: WebviewBounds): void;
    focus(): void;
    focusParent(): void;
    expose(name: string, target: ExposedTarget): void;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    addListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string): this;
  }

  export class BrowserWindow {
    createWebview(options?: WebviewOptions, webContext?: unknown): Webview;
    getInnerSize(logical?: boolean): Dimensions;
    setSize(width: number, height: number, logical?: boolean): Dimensions | null;
    setMinSize(width: number, height: number, logical?: boolean): void;
    setMaxSize(width: number, height: number, logical?: boolean): void;
    getOuterSize(logical?: boolean): Dimensions;
    setTitle(title: string): void;
    get title(): string;
    setClosable(closable: boolean): void;
    setMaximizable(maximizable: boolean): void;
    setMinimizable(minimizable: boolean): void;
    setResizable(resizable: boolean): void;
    setAlwaysOnTop(enabled: boolean): void;
    setAlwaysOnBottom(enabled: boolean): void;
    setDecorations(enabled: boolean): void;
    setFullscreen(fullscreenType?: unknown): void;
    setVisible(visible: boolean): void;
    setMaximized(value: boolean): void;
    setMinimized(value: boolean): void;
    focus(): void;
    center(): void;
    close(): void;
    hide(): void;
    show(): void;
    setPosition(x: number, y: number, logical?: boolean): void;
    getPosition(logical?: boolean): { x: number; y: number };
    get width(): number;
    get height(): number;
    get x(): number;
    get y(): number;
    isFocused(): boolean;
    isVisible(): boolean;
    isDecorated(): boolean;
    isMaximized(): boolean;
    isMinimized(): boolean;
    isResizable(): boolean;
    isClosable(): boolean;
    isMaximizable(): boolean;
    isMinimizable(): boolean;
    dispose(): void;
    isDisposed(): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    addListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string): this;
  }

  export class Application {
    constructor(options?: ApplicationOptions);
    whenReady(options?: unknown): Promise<void>;
    isReady(): boolean;
    exit(): void;
    createWebContext(options?: unknown): unknown;
    createTrayIcon(options: unknown): unknown;
    createBrowserWindow(options?: BrowserWindowOptions): BrowserWindow;
    createChildBrowserWindow(options?: BrowserWindowOptions): BrowserWindow;
    setMenu(menuOptions?: unknown): void;
    pumpEvents(): boolean;
    run(options?: ApplicationRunOptions): void;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    addListener(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string): this;
  }
}
