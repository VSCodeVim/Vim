import * as vscode from 'vscode';

export const constants = {
  UV_FS_SYMLINK_DIR: 1,
  UV_FS_SYMLINK_JUNCTION: 2,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  UV_DIRENT_UNKNOWN: 0,
  UV_DIRENT_FILE: 1,
  UV_DIRENT_DIR: 2,
  UV_DIRENT_LINK: 3,
  UV_DIRENT_FIFO: 4,
  UV_DIRENT_SOCKET: 5,
  UV_DIRENT_CHAR: 6,
  UV_DIRENT_BLOCK: 7,
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,
  O_CREAT: 512,
  O_EXCL: 2048,
  UV_FS_O_FILEMAP: 0,
  O_NOCTTY: 131072,
  O_TRUNC: 1024,
  O_APPEND: 8,
  O_DIRECTORY: 1048576,
  O_NOFOLLOW: 256,
  O_SYNC: 128,
  O_DSYNC: 4194304,
  O_SYMLINK: 2097152,
  O_NONBLOCK: 4,
  S_IRWXU: 448,
  S_IRUSR: 256,
  S_IWUSR: 128,
  S_IXUSR: 64,
  S_IRWXG: 56,
  S_IRGRP: 32,
  S_IWGRP: 16,
  S_IXGRP: 8,
  S_IRWXO: 7,
  S_IROTH: 4,
  S_IWOTH: 2,
  S_IXOTH: 1,
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  UV_FS_COPYFILE_EXCL: 1,
  COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,
  COPYFILE_FICLONE_FORCE: 4,
};

export async function doesFileExist(fileUri: vscode.Uri) {
  try {
    await vscode.workspace.fs.stat(fileUri);
    return true;
  } catch {
    return false;
  }
}

export async function existsAsync(path: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.parse(path));
    return true;
  } catch (_e) {
    return false;
  }
}

export async function unlink(path: string): Promise<void> {
  await vscode.workspace.fs.delete(vscode.Uri.parse(path));
}

export async function readFileAsync(path: string, encoding: BufferEncoding): Promise<string> {
  const ret = await vscode.workspace.fs.readFile(vscode.Uri.parse(path));
  return ret.toString();
}

export async function mkdirAsync(path: string, options: any): Promise<void> {
  return vscode.workspace.fs.createDirectory(vscode.Uri.parse(path));
}

export async function writeFileAsync(
  path: string,
  content: string,
  encoding: BufferEncoding,
): Promise<void> {
  return vscode.workspace.fs.writeFile(vscode.Uri.parse(path), Buffer.from(content));
}

export async function accessAsync(path: string, mode: number) {
  // no op in nodeless
}

export async function chmodAsync(path: string, mode: string | number) {
  // no op in nodeless
}

export function unlinkSync(path: string) {
  // no op in nodeless
}
