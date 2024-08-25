import * as vscode from 'vscode';
import * as path from 'path';
// TODO:
// eslint-disable-next-line @typescript-eslint/no-require-imports
import untildify = require('untildify');

/**
 * A interface to the path in the node.js.
 */
interface Path {
  normalize(p: string): string;
  join(...paths: string[]): string;
  resolve(...pathSegments: string[]): string;
  isAbsolute(p: string): boolean;
  relative(from: string, to: string): string;
  dirname(p: string): string;
  basename(p: string, ext?: string): string;
  extname(p: string): string;
  sep: string;
  delimiter: string;
}

/**
 * Separate a partial path or full path into dirname and the basename.
 * @param searchPath The path to separate.
 * @param sep The separator of the searchPath.
 * @return A two-element array where the first element is the dirname and the second
 * is the basename.
 */
export function separatePath(searchPath: string, sep: string) {
  // Special handle for UNC path on windows
  if (sep === path.win32.sep) {
    if (searchPath[0] === sep && searchPath[1] === sep) {
      const idx = searchPath.indexOf(sep, 2);
      if (idx === -1) {
        // If there isn't a complete UNC path,
        // return the incomplete UNC as baseName
        // e.g. \\test-server is an incomplete path
        // and \\test-server\ is a complete path
        return [searchPath, ''];
      }
    }
  }

  const baseNameIndex = searchPath.lastIndexOf(sep) + 1;
  const baseName = searchPath.slice(baseNameIndex);
  const dirName = searchPath.slice(0, baseNameIndex);
  return [dirName, baseName];
}

/**
 * The comment is used conjunction with getPathDetails.
 */
interface PathDetails {
  /**
   * A full absolute path resolved from directory of the currently active document.
   * If the active document is an untitled document, full path will be dirName of
   * the input partialPath.
   */
  fullPath: string;
  /**
   * A full absolute path of the directory of fullPath.
   * If the active document is an untitled document, full path will be the input partialPath.
   */
  fullDirPath: string;
  /**
   * The dir name of partialPath.
   * If the partialPath is an absolute path, this will be equal to fullDirPat
   * If partialPath is ./abc/xyz.txt, baseName will be './abc/'
   * If partialPath is /abc/xyz.txt, baseName will be '/abc/'
   */
  dirName: string;
  /**
   * A base name of the partialPath.
   * If partialPath is ./abc/xyz.txt, baseName will be 'xyz.txt'
   * If partialPath is /abc/xyz.txt, baseName will be 'xyz.txt'
   */
  baseName: string;
  /**
   * An updated partialPath which has its / changed to \ on Windows.
   */
  partialPath: string;
  /**
   * The correct node js path for the partial path. This will be either
   * path.win32 or path.posix for further processing.
   */
  path: Path;
}

/**
 * Get path detail.
 *
 * If the currently active document is an untitled document, we will assume the partialPath
 * is a Windows path only when the VS Code is running on Windows, and not remote session; else, posix path.
 *
 * If the currently active document is not an untitled document, we will assume the partialPath
 * is a Windows path when the current uri is local file where the first character of fsPath of the
 * current uri is not "/"; otherwise, posix path. fsPath can return C:\path\avc.txt or \\drive\location\abc.txt
 * on Windows.
 *
 * This is to maximize usability of the combination of Windows and posix machine using remote while browsing
 * file on both local and remote.
 *
 * @param partialPath A string of relative path to the directory of the currentUri,
 * or an absolute path in the environment of the currentUri.
 * ~/ can be used only if active document is local document, or local untitled document.
 * @param currentUri A uri of the currently active document.
 * @param isRemote A boolean to indicate if the current instance is in remote.
 * @return A PathDetail.
 */
export function getPathDetails(
  partialPath: string,
  currentUri: vscode.Uri,
  isRemote: boolean,
): PathDetails {
  let isWindows: boolean;
  if (currentUri.scheme === 'untitled') {
    // Assume remote server is nix only
    isWindows = path === path.win32 && !isRemote;
  } else {
    // Assuming other schemes return full path
    // e.g. 'file' and 'vscode-remote' both return full path
    // Also only scheme that support Windows is 'file', so we can
    // safely check if fsPath returns '/' as the first character
    // (fsPath in 'vscode-remote' on Windows return \ as separator instead of /)
    isWindows = currentUri.scheme === 'file' && currentUri.fsPath[0] !== '/';
  }

  const p = isWindows ? path.win32 : path.posix;
  if (isWindows) {
    // normalize / to \ on windows
    partialPath = partialPath.replace(/\//g, '\\');
  }
  const updatedPartialPath = partialPath;

  if (currentUri.scheme === 'file' || (currentUri.scheme === 'untitled' && !isRemote)) {
    // We can untildify when the scheme is 'file' or 'untitled' on local fs because
    // because we only support opening files mounted locally.
    partialPath = untildify(partialPath);
  }

  const [dirName, baseName] = separatePath(partialPath, p.sep);
  let fullDirPath: string;
  if (p.isAbsolute(dirName)) {
    fullDirPath = dirName;
  } else {
    fullDirPath = p.join(
      // On Windows machine:
      // fsPath returns Windows drive path (C:\xxx\) or UNC path (\\server\xxx)
      // fsPath returns path with \ as separator even if 'vscode-remote' is connect to a linux box
      //
      // path will return /home/user for example even 'vscode-remote' is used on windows
      // as we relied of our isWindows detection
      separatePath(isWindows ? currentUri.fsPath : currentUri.path, p.sep)[0],
      dirName,
    );
  }

  const fullPath = p.join(fullDirPath, baseName);
  return {
    fullPath,
    fullDirPath,
    dirName,
    baseName,
    partialPath: updatedPartialPath,
    path: p,
  };
}

/**
 * Resolve the absolutePath to Uri.
 *
 * @param absolutePath A string of absolute path.
 * @param sep The separator of the absolutePath.
 * This is used to determine we should consider absolutePath a Windows path.
 * @param currentUri A uri to resolve the absolutePath to Uri.
 * @param isRemote A boolean to indicate if the current instance is in remote.
 * @return null if the absolutePath is invalid. A uri resolved with the currentUri.
 */
export function resolveUri(
  absolutePath: string,
  sep: string,
  currentUri: vscode.Uri,
  isRemote: boolean,
) {
  const isWindows = sep === path.win32.sep;
  if (isWindows && !/^(\\\\.+\\)|([a-zA-Z]:\\)/.test(absolutePath)) {
    // if it is windows and but don't have either
    // UNC path or the windows drive
    return null;
  }
  if (!isWindows && absolutePath[0] !== sep) {
    // if it is not windows, but the absolute path doesn't begin with /
    return null;
  }

  const isLocalUntitled = !isRemote && currentUri.scheme === 'untitled';
  return isWindows
    ? // Create new local Uri when it's on windows.
      // Only local resource is support (vscode-remote doesn't have windows path)
      // UNC path like //server1/folder should also work.
      vscode.Uri.file(absolutePath)
    : currentUri.with({
        // search local file with currently active document is a local untitled doc
        scheme: isLocalUntitled ? 'file' : currentUri.scheme,
        path: absolutePath,
      });
}

/**
 * Get the name of the items in a directory.
 * @param absolutePath A string of absolute path.
 * @param sep The separator of the absolutePath.
 * @param currentUri A uri of the currently active document.
 * @param isRemote A boolean to indicate if the current instance is in remote.
 * @param addCurrentAndUp A boolean to indicate if .{$sep} and ..${sep} should be add to the result
 * @return A Promise which resolves to an array of string. The array can be empty if the path specified is actual
 * empty, of if the absolutePath specified is invalid, or if any error occurred during directory reading.
 * The string in the array will have sep appended if it is a directory.
 */
export async function readDirectory(
  absolutePath: string,
  sep: string,
  currentUri: vscode.Uri,
  isRemote: boolean,
  addCurrentAndUp: boolean,
) {
  try {
    const directoryUri = resolveUri(absolutePath, sep, currentUri, isRemote);
    if (directoryUri === null) {
      return [];
    }
    const directoryResult = await vscode.workspace.fs.readDirectory(directoryUri);
    return (
      directoryResult
        // Add the separator at the end to the path if it is a directory
        .map((d) => d[0] + (d[1] === vscode.FileType.Directory ? sep : ''))
        // Add ./ and ../ to the result if specified
        .concat(addCurrentAndUp ? [`.${sep}`, `..${sep}`] : [])
    );
  } catch {
    return [];
  }
}

export function join(...paths: string[]): string {
  return path.join(...paths);
}
