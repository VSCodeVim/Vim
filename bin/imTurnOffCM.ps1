# This program turns off IME conversion mode on the nearest ancestor
# who has the resouce of WindowHandle.

# PowerShell::IME class is based on the article described in
# https://stuncloud.wordpress.com/2014/11/19/powershell_turnoff_ime_automatically/ .

if(!('PowerShell.IME' -as [type])) {
    Add-Type –TypeDefinition `
        @'
using System;
using System.Runtime.InteropServices;
namespace PowerShell
{
    public class IME {
        [DllImport("user32.dll")]
        private static extern int SendMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);

        [DllImport("imm32.dll")]
        private static extern IntPtr ImmGetDefaultIMEWnd(IntPtr hWnd);
        public static int GetState(IntPtr hwnd) {
            IntPtr imeHwnd = ImmGetDefaultIMEWnd(hwnd);
            return SendMessage(imeHwnd, 0x0283, 0x0005, 0);
        }
        public static void SetState(IntPtr hwnd, bool state) {
            IntPtr imeHwnd = ImmGetDefaultIMEWnd(hwnd);
            SendMessage(imeHwnd, 0x0283, 0x0006, state?1:0);
        }
    }
}
'@
}

$hwnd = 0;
write-host "START: pid: $pid, hwnd: $hwnd";
for($ps = (Get-Process -Id $PID); ($ps -ne 0) -and ($hwnd -eq 0); $ps = $ps.Parent) {
    $hwnd = $ps.MainWindowHandle;
    write-host "pid: $ps, hwnd: $hwnd";
}
write-host "END: pid: $pid, hwnd: $hwnd";
if ($hwnd -eq 0) {
    exit;
}

$state = [PowerShell.IME]::GetState($hwnd);
write-host "current state: $state";
if ($state) {
    write-host "turn off changing status of IME";
    [PowerShell.IME]::SetState($hwnd, $false)
}
