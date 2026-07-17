export interface MinixPluginOptions {
  /** 小程序源码目录（app.json 所在目录），相对于 vite root，默认 "." */
  root?: string;
}

interface SubPackage {
  root: string;
  pages: string[];
}

export interface AppJson {
  pages?: string[];
  subpackages?: SubPackage[];
  subPackages?: SubPackage[];
  entryPagePath?: string;
}
