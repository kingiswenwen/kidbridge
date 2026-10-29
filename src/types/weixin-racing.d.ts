/** Narrow declarations for the WeChat-only backup APIs, removed from H5 by uni-app directives. */
declare const wx: {
  env: { USER_DATA_PATH: string };
  getFileSystemManager(): {
    writeFile(options: {
      filePath: string;
      data: string;
      encoding: "utf8";
      success(): void;
      fail(): void;
    }): void;
    readFile(options: {
      filePath: string;
      encoding: "utf8";
      success(result: { data: string | ArrayBuffer }): void;
      fail(): void;
    }): void;
  };
  shareFileMessage(options: { filePath: string; fileName: string }): void;
  chooseMessageFile(options: {
    count: number;
    type: "file";
    extension: string[];
    success(result: { tempFiles: { size: number; path: string }[] }): void;
  }): void;
};
