; ═══════════════════════════════════════════════════════════════════════════════
; Greenpack Pro — Inno Setup 6.x Installer Script
; Build: ISCC.exe installer/GreenpackPro.iss
; Output: GreenpackPro_Setup_v1.0.exe (~400-500MB)
; ═══════════════════════════════════════════════════════════════════════════════

#define AppName      "Greenpack Pro"
#define AppVersion   "1.0.0"
#define AppPublisher "Aura Tech Labs"
#define AppURL       "https://greenpackpro.com"
#define AppExeName   "GreenpackPro.exe"
#define ServiceName  "GreenpackProEngine"
#define AppInstDir   "{autopf}\GreenpackPro"

[Setup]
; App identity
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} v{#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}/support
AppUpdatesURL={#AppURL}/download

; Installation
DefaultDirName={#AppInstDir}
DefaultGroupName={#AppName}
AllowNoIcons=no
OutputDir=..\dist\installer
OutputBaseFilename=GreenpackPro_Setup_v{#AppVersion}

; Windows requirements
MinVersion=10.0.17763
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=

; Appearance
SetupIconFile=..\assets\greenpack.ico
WizardStyle=modern
WizardSizePercent=120
DisableWelcomePage=no
LicenseFile=..\LICENSE.txt

; Compression
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMADictionarySize=131072
LZMANumFastBytes=128

; Safety
CreateUninstallRegKey=yes
UninstallDisplayIcon={app}\app\{#AppExeName}
UninstallDisplayName={#AppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"

[Messages]
WelcomeLabel2=This will install [name/ver] on your computer.%n%nGreenpack Pro is a label print inspection system for Windows 10/11. It runs completely offline with no internet connection required.%n%nClick Next to continue.

[Dirs]
; Data directories with user write permissions
Name: "{app}\data";      Permissions: users-full
Name: "{app}\files";     Permissions: users-full
Name: "{app}\reports";   Permissions: users-full
Name: "{app}\templates"; Permissions: users-full
Name: "{app}\models";    Permissions: users-full
Name: "{app}\logs";      Permissions: users-full
Name: "{app}\temp";      Permissions: users-full
Name: "{app}\backups";   Permissions: users-full
Name: "{app}\bin";       Permissions: users-full

[Files]
; ── Python Engine (PyInstaller compiled) ─────────────────────────────────────
Source: "..\backend\dist\greenpack_engine\*"; \
  DestDir: "{app}\engine"; \
  Flags: ignoreversion recursesubdirs createallsubdirs; \
  Permissions: users-full

; ── Electron Desktop App ─────────────────────────────────────────────────────
Source: "..\electron\dist-electron\{#AppExeName}"; \
  DestDir: "{app}\app"; \
  Flags: ignoreversion
Source: "..\electron\dist-electron\*.dll"; \
  DestDir: "{app}\app"; \
  Flags: ignoreversion skipifsourcedoesntexist
Source: "..\electron\dist-electron\resources\*"; \
  DestDir: "{app}\app\resources"; \
  Flags: ignoreversion recursesubdirs skipifsourcedoesntexist

; ── Tesseract OCR for Windows ─────────────────────────────────────────────────
; Download: https://github.com/UB-Mannheim/tesseract/wiki
Source: "..\deps\tesseract\*"; \
  DestDir: "{app}\bin\tesseract"; \
  Flags: ignoreversion recursesubdirs skipifsourcedoesntexist

; ── Poppler for Windows (required by pdf2image) ──────────────────────────────
; Download: https://github.com/oschwartz10612/poppler-windows/releases
Source: "..\deps\poppler\*"; \
  DestDir: "{app}\bin\poppler"; \
  Flags: ignoreversion recursesubdirs skipifsourcedoesntexist

; ── NSSM — Windows Service Manager ───────────────────────────────────────────
; Download: https://nssm.cc/download
Source: "..\deps\nssm\win64\nssm.exe"; \
  DestDir: "{app}\bin\nssm"; \
  Flags: ignoreversion skipifsourcedoesntexist

; ── Visual C++ Redistributable ────────────────────────────────────────────────
Source: "..\deps\vc_redist.x64.exe"; \
  DestDir: "{tmp}"; \
  Flags: deleteafterinstall skipifsourcedoesntexist

; ── EasyOCR Pre-downloaded Models ─────────────────────────────────────────────
; Pre-download with: python scripts/download_easyocr_models.py
Source: "..\deps\easyocr_models\*"; \
  DestDir: "{app}\models"; \
  Flags: ignoreversion recursesubdirs skipifsourcedoesntexist

; ── Dynamic Web TWAIN Service (scanner integration) ──────────────────────────
; Download: https://www.dynamsoft.com/web-twain/downloads/
Source: "..\deps\DynamicWebTWAINServiceSetup.exe"; \
  DestDir: "{tmp}"; \
  Flags: deleteafterinstall skipifsourcedoesntexist

; ── Default configuration ─────────────────────────────────────────────────────
Source: "..\backend\.env.example"; \
  DestDir: "{app}\engine"; \
  DestName: ".env"; \
  Flags: ignoreversion onlyifdoesntexist

; ── App icon for shortcuts ────────────────────────────────────────────────────
Source: "..\assets\greenpack.ico"; \
  DestDir: "{app}"; \
  Flags: ignoreversion

; ── License ───────────────────────────────────────────────────────────────────
Source: "..\LICENSE.txt"; \
  DestDir: "{app}"; \
  Flags: ignoreversion

[Icons]
; Start menu
Name: "{group}\{#AppName}"; \
  Filename: "{app}\app\{#AppExeName}"; \
  IconFilename: "{app}\greenpack.ico"; \
  Comment: "Label Print Inspection System"

Name: "{group}\Uninstall {#AppName}"; \
  Filename: "{uninstallexe}"

; Desktop shortcut
Name: "{commondesktop}\{#AppName}"; \
  Filename: "{app}\app\{#AppExeName}"; \
  IconFilename: "{app}\greenpack.ico"; \
  Tasks: desktopicon

[Tasks]
Name: "desktopicon"; \
  Description: "Create a desktop shortcut"; \
  GroupDescription: "Additional shortcuts:"; \
  Flags: checked

Name: "startupitem"; \
  Description: "Start Greenpack Pro engine automatically with Windows (recommended)"; \
  GroupDescription: "Windows startup:"; \
  Flags: checked

[Run]
; 1. Install Visual C++ Redistributable (required for pyzbar, OpenCV DLLs)
Filename: "{tmp}\vc_redist.x64.exe"; \
  Parameters: "/install /quiet /norestart"; \
  Flags: runhidden waituntilterminated skipifdoesntexist; \
  StatusMsg: "Installing Visual C++ Runtime..."

; 2. Install Dynamic Web TWAIN Service (scanner integration)
Filename: "{tmp}\DynamicWebTWAINServiceSetup.exe"; \
  Parameters: "/S"; \
  Flags: runhidden waituntilterminated skipifdoesntexist; \
  StatusMsg: "Installing scanner driver service..."

; 3. Register Greenpack Engine as Windows Service via NSSM
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "install {#ServiceName} ""{app}\engine\greenpack_engine\greenpack_engine.exe"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist; \
  StatusMsg: "Registering Windows service..."

; 4. Set service startup type (Automatic — starts with Windows)
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} Start SERVICE_AUTO_START"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 5. Set service description
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} Description ""Greenpack Pro Label Inspection Engine"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 6. Set working directory for service
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} AppDirectory ""{app}\engine"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 7. Redirect stdout/stderr to log file
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} AppStdout ""{app}\logs\engine.log"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist

Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} AppStderr ""{app}\logs\engine_error.log"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 8. Set crash recovery (restart after 5 seconds)
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "set {#ServiceName} AppRestartDelay 5000"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 9. Configure Windows Firewall rules
Filename: "netsh"; \
  Parameters: "advfirewall firewall add rule name=""Greenpack Pro Engine"" dir=in action=allow protocol=TCP localport=18080 profile=private"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

Filename: "netsh"; \
  Parameters: "advfirewall firewall add rule name=""Greenpack Pro Scanner"" dir=in action=allow protocol=TCP localport=18622 profile=private"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 10. Add Windows Defender exclusion for install folder (prevents false positives)
Filename: "powershell"; \
  Parameters: "-ExecutionPolicy Bypass -Command ""Add-MpPreference -ExclusionPath '{app}' -ErrorAction SilentlyContinue"""; \
  Flags: runhidden waituntilterminated skipifdoesntexist; \
  StatusMsg: "Configuring security exceptions..."

; 11. Create daily backup task in Windows Task Scheduler
Filename: "schtasks"; \
  Parameters: "/create /tn ""GreenpackProBackup"" /tr ""{app}\engine\greenpack_engine\greenpack_engine.exe backup"" /sc daily /st 02:00 /ru SYSTEM /f"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; 12. Start the Windows service
Filename: "net"; \
  Parameters: "start {#ServiceName}"; \
  Flags: runhidden waituntilterminated skipifdoesntexist; \
  StatusMsg: "Starting Greenpack Pro engine..."

; 13. Launch the app after install
Filename: "{app}\app\{#AppExeName}"; \
  Description: "Launch Greenpack Pro"; \
  Flags: nowait postinstall skipifsilent

[UninstallRun]
; Stop service
Filename: "net"; \
  Parameters: "stop {#ServiceName}"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; Remove service
Filename: "{app}\bin\nssm\nssm.exe"; \
  Parameters: "remove {#ServiceName} confirm"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

; Remove firewall rules
Filename: "netsh"; \
  Parameters: "advfirewall firewall delete rule name=""Greenpack Pro Engine"""; \
  Flags: runhidden skipifdoesntexist

Filename: "netsh"; \
  Parameters: "advfirewall firewall delete rule name=""Greenpack Pro Scanner"""; \
  Flags: runhidden skipifdoesntexist

; Remove scheduled task
Filename: "schtasks"; \
  Parameters: "/delete /tn ""GreenpackProBackup"" /f"; \
  Flags: runhidden skipifdoesntexist

[Code]
// ── Inno Setup Pascal Code ────────────────────────────────────────────────────

function IsWindowsVersionOK: Boolean;
begin
  // Require Windows 10 1809 (build 17763) or later
  Result := (GetWindowsVersion >= $0A000000);
end;

function Is64BitOS: Boolean;
begin
  Result := Is64BitInstallMode;
end;

function HasEnoughDiskSpace: Boolean;
var
  FreeSpace: Int64;
begin
  GetDiskFreeSpaceEx(ExpandConstant('{autopf}'), FreeSpace, 0, 0);
  // Require at least 2GB free
  Result := FreeSpace > 2147483648;
end;

function InitializeSetup: Boolean;
begin
  Result := True;
  
  if not IsWindowsVersionOK then
  begin
    MsgBox(
      'Greenpack Pro requires Windows 10 (version 1809 or later) or Windows 11.' + #13#10 +
      'Your version of Windows is not supported.',
      mbError, MB_OK
    );
    Result := False;
    Exit;
  end;

  if not Is64BitOS then
  begin
    MsgBox(
      'Greenpack Pro requires a 64-bit version of Windows.' + #13#10 +
      'This PC is running a 32-bit version, which is not supported.',
      mbError, MB_OK
    );
    Result := False;
    Exit;
  end;

  if not HasEnoughDiskSpace then
  begin
    MsgBox(
      'Greenpack Pro requires at least 2 GB of free disk space.' + #13#10 +
      'Please free up some space and try again.',
      mbError, MB_OK
    );
    Result := False;
    Exit;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Wait a moment for service to start
    Sleep(3000);
  end;
end;
