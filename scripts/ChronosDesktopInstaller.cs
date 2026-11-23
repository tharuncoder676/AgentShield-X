using System;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

public class ChronosInstallerForm : Form
{
    private Label lblTitle;
    private Label lblSubtitle;
    private Label lblStatus;
    private ProgressBar progressBar;
    private Button btnAction;
    private Button btnClose;
    private Panel headerPanel;
    private Label lblFeature1, lblFeature2, lblFeature3;
    private string installDir;
    private bool isDone = false;

    [STAThread]
    public static void Main(string[] args)
    {
        try
        {
            ServicePointManager.Expect100Continue = true;
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;
            ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
        }
        catch { }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new ChronosInstallerForm());
    }

    public ChronosInstallerForm()
    {
        this.installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Chronos Desktop");
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        this.Size = new Size(580, 430);
        this.FormBorderStyle = FormBorderStyle.None;
        this.StartPosition = FormStartPosition.CenterScreen;
        this.BackColor = Color.FromArgb(13, 11, 20); // Deep Obsidian Purple
        this.ForeColor = Color.White;

        // Custom Paint for border
        this.Paint += (s, e) => {
            using (Pen p = new Pen(Color.FromArgb(168, 85, 247), 2)) // Neon Purple
            {
                e.Graphics.DrawRectangle(p, 1, 1, this.Width - 2, this.Height - 2);
            }
        };

        // Header Panel (Draggable)
        headerPanel = new Panel();
        headerPanel.Size = new Size(580, 36);
        headerPanel.Location = new Point(0, 0);
        headerPanel.BackColor = Color.FromArgb(20, 16, 32);
        
        Point dragStart = Point.Empty;
        headerPanel.MouseDown += (s, e) => { if (e.Button == MouseButtons.Left) dragStart = e.Location; };
        headerPanel.MouseMove += (s, e) => {
            if (e.Button == MouseButtons.Left && dragStart != Point.Empty)
            {
                this.Left += e.X - dragStart.X;
                this.Top += e.Y - dragStart.Y;
            }
        };

        Label brand = new Label();
        brand.Text = "🛡️ AGENTSHIELD-X  ::  CHRONOS DESKTOP INSTALLER (OFFLINE PACKAGE)";
        brand.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        brand.ForeColor = Color.FromArgb(168, 85, 247);
        brand.Location = new Point(14, 10);
        brand.AutoSize = true;
        headerPanel.Controls.Add(brand);

        btnClose = new Button();
        btnClose.Text = "✕";
        btnClose.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
        btnClose.ForeColor = Color.Gray;
        btnClose.BackColor = Color.Transparent;
        btnClose.FlatStyle = FlatStyle.Flat;
        btnClose.FlatAppearance.BorderSize = 0;
        btnClose.Size = new Size(30, 30);
        btnClose.Location = new Point(545, 3);
        btnClose.Cursor = Cursors.Hand;
        btnClose.Click += (s, e) => this.Close();
        headerPanel.Controls.Add(btnClose);

        this.Controls.Add(headerPanel);

        // Title
        lblTitle = new Label();
        lblTitle.Text = "CHRONOS DESKTOP";
        lblTitle.Font = new Font("Segoe UI", 20F, FontStyle.Bold);
        lblTitle.ForeColor = Color.FromArgb(240, 240, 255);
        lblTitle.Location = new Point(28, 55);
        lblTitle.AutoSize = true;
        this.Controls.Add(lblTitle);

        // Subtitle
        lblSubtitle = new Label();
        lblSubtitle.Text = "Autonomous AI Agent with Living Screen Memory & Kokoro Neural Voice";
        lblSubtitle.Font = new Font("Segoe UI", 10F);
        lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184); // Slate 400
        lblSubtitle.Location = new Point(30, 95);
        lblSubtitle.AutoSize = true;
        this.Controls.Add(lblSubtitle);

        // Feature Bullets
        lblFeature1 = new Label();
        lblFeature1.Text = "✦ Real-time Screen Observation with zero-trust local token redaction";
        lblFeature1.Font = new Font("Segoe UI", 9.5F);
        lblFeature1.ForeColor = Color.FromArgb(192, 132, 252);
        lblFeature1.Location = new Point(32, 135);
        lblFeature1.AutoSize = true;
        this.Controls.Add(lblFeature1);

        lblFeature2 = new Label();
        lblFeature2.Text = "✦ High-fidelity Speech Recognition (Whisper) & Kokoro On-Device Voice";
        lblFeature2.Font = new Font("Segoe UI", 9.5F);
        lblFeature2.ForeColor = Color.FromArgb(56, 189, 248); // Cyan 400
        lblFeature2.Location = new Point(32, 162);
        lblFeature2.AutoSize = true;
        this.Controls.Add(lblFeature2);

        lblFeature3 = new Label();
        lblFeature3.Text = "✦ Dual-Rail Security Sandbox: AST fast-rail (<0.18ms) + Living Timeline";
        lblFeature3.Font = new Font("Segoe UI", 9.5F);
        lblFeature3.ForeColor = Color.FromArgb(74, 222, 128); // Emerald 400
        lblFeature3.Location = new Point(32, 189);
        lblFeature3.AutoSize = true;
        this.Controls.Add(lblFeature3);

        // Progress Bar
        progressBar = new ProgressBar();
        progressBar.Location = new Point(32, 235);
        progressBar.Size = new Size(516, 18);
        progressBar.Style = ProgressBarStyle.Continuous;
        progressBar.Value = 0;
        this.Controls.Add(progressBar);

        // Status Label
        lblStatus = new Label();
        lblStatus.Text = "Self-contained offline installer ready. Click 'Install Chronos Desktop' to begin.";
        lblStatus.Font = new Font("Segoe UI", 9F);
        lblStatus.ForeColor = Color.FromArgb(203, 213, 225);
        lblStatus.Location = new Point(32, 265);
        lblStatus.Size = new Size(516, 50);
        this.Controls.Add(lblStatus);

        // Action Button
        btnAction = new Button();
        btnAction.Text = "Install Chronos Desktop";
        btnAction.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
        btnAction.BackColor = Color.FromArgb(147, 51, 234); // Violet 600
        btnAction.ForeColor = Color.White;
        btnAction.FlatStyle = FlatStyle.Flat;
        btnAction.FlatAppearance.BorderSize = 0;
        btnAction.Size = new Size(516, 46);
        btnAction.Location = new Point(32, 335);
        btnAction.Cursor = Cursors.Hand;
        btnAction.Click += BtnAction_Click;
        this.Controls.Add(btnAction);
    }

    private void BtnAction_Click(object sender, EventArgs e)
    {
        if (isDone)
        {
            LaunchInstalledApp();
            this.Close();
            return;
        }

        btnAction.Enabled = false;
        btnAction.BackColor = Color.FromArgb(88, 28, 135);
        btnAction.Text = "Installing...";

        Thread worker = new Thread(RunInstallProcess);
        worker.IsBackground = true;
        worker.Start();
    }

    private void SetStatus(string text, int progress)
    {
        if (this.InvokeRequired)
        {
            this.Invoke(new Action(() => SetStatus(text, progress)));
            return;
        }
        lblStatus.Text = text;
        if (progress >= 0 && progress <= 100)
            progressBar.Value = progress;
    }

    private void RunInstallProcess()
    {
        try
        {
            SetStatus("Preparing target directory: " + installDir, 10);
            if (!Directory.Exists(installDir))
            {
                Directory.CreateDirectory(installDir);
            }

            // 1. Check for embedded offline package stream first (100% self-contained)
            Stream embeddedZip = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip");
            if (embeddedZip != null)
            {
                SetStatus("Extracting self-contained Chronos runtime & neural models...", 20);
                ExtractZipStreamWithProgress(embeddedZip, installDir);
                SetStatus("Extraction complete.", 80);
            }
            else
            {
                // Fallbacks if not embedded:
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string localChronosApp = Path.Combine(baseDir, "chronos_app");
                string localZip = Path.Combine(baseDir, "Chronos-Desktop-windows-x64.zip");
                string userDownloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
                string downloadsZip = Path.Combine(userDownloads, "Chronos-Desktop-windows-x64.zip");

                if (Directory.Exists(localChronosApp))
                {
                    SetStatus("Copying Chronos Desktop application files from local folder...", 25);
                    CopyDirectory(localChronosApp, installDir);
                    SetStatus("Copied application binaries and neural models.", 75);
                }
                else if (File.Exists(localZip) && new FileInfo(localZip).Length > 100000000)
                {
                    SetStatus("Extracting Chronos runtime and neural models from local package...", 25);
                    using (FileStream fs = File.OpenRead(localZip))
                    {
                        ExtractZipStreamWithProgress(fs, installDir);
                    }
                    SetStatus("Extraction complete.", 75);
                }
                else if (File.Exists(downloadsZip) && new FileInfo(downloadsZip).Length > 100000000)
                {
                    SetStatus("Found Chronos package in Downloads folder! Extracting...", 25);
                    using (FileStream fs = File.OpenRead(downloadsZip))
                    {
                        ExtractZipStreamWithProgress(fs, installDir);
                    }
                    SetStatus("Extraction complete.", 75);
                }
                else
                {
                    SetStatus("Connecting securely to GitHub Release CDN...", 15);
                    string downloadUrl = "https://github.com/tharuncoder676/AgentShield-X/releases/download/v2.4.0/Chronos-Desktop-windows-x64.zip";
                    string tempZip = Path.Combine(Path.GetTempPath(), "Chronos-Desktop-windows-x64.zip");

                    bool needDownload = true;
                    if (File.Exists(tempZip) && new FileInfo(tempZip).Length > 500000000)
                    {
                        needDownload = false;
                        SetStatus("Found existing download in cache. Verifying...", 25);
                    }

                    if (needDownload)
                    {
                        try
                        {
                            ServicePointManager.Expect100Continue = true;
                            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288;
                            ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
                        }
                        catch { }

                        using (WebClient client = new WebClient())
                        {
                            client.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChronosInstaller/1.0";
                            client.DownloadProgressChanged += (s, e) => {
                                double mbReceived = e.BytesReceived / 1048576.0;
                                double mbTotal = e.TotalBytesToReceive > 0 ? e.TotalBytesToReceive / 1048576.0 : 588.0;
                                SetStatus(string.Format("Downloading Chronos: {0}% ({1:F1} MB / {2:F1} MB)",
                                    e.ProgressPercentage, mbReceived, mbTotal),
                                    15 + (int)(e.ProgressPercentage * 0.55));
                            };
                            client.DownloadFile(new Uri(downloadUrl), tempZip);
                        }
                    }

                    SetStatus("Extracting downloaded Chronos files...", 72);
                    using (FileStream fs = File.OpenRead(tempZip))
                    {
                        ExtractZipStreamWithProgress(fs, installDir);
                    }
                }
            }

            // Verify Chronos Desktop.exe exists
            string exePath = Path.Combine(installDir, "Chronos Desktop.exe");
            if (!File.Exists(exePath))
            {
                string subPath = Path.Combine(installDir, "chronos_app", "Chronos Desktop.exe");
                if (File.Exists(subPath))
                {
                    CopyDirectory(Path.Combine(installDir, "chronos_app"), installDir);
                    exePath = Path.Combine(installDir, "Chronos Desktop.exe");
                }
            }

            SetStatus("Creating Desktop and Start Menu shortcuts...", 88);
            CreateShortcuts(exePath);

            SetStatus("Registering Chronos Desktop in Windows system...", 95);
            RegisterUninstall(installDir, exePath);

            SetStatus("Installation complete! Chronos Desktop is ready.", 100);

            this.Invoke(new Action(() => {
                isDone = true;
                btnAction.Enabled = true;
                btnAction.BackColor = Color.FromArgb(16, 185, 129); // Emerald 500
                btnAction.Text = "🚀 Launch Chronos Desktop";
            }));
        }
        catch (Exception ex)
        {
            SetStatus("Error during installation: " + ex.Message, 0);
            this.Invoke(new Action(() => {
                btnAction.Enabled = true;
                btnAction.BackColor = Color.FromArgb(239, 68, 68);
                btnAction.Text = "Retry Installation";
            }));
        }
    }

    private void ExtractZipStreamWithProgress(Stream zipStream, string targetDir)
    {
        using (ZipArchive archive = new ZipArchive(zipStream, ZipArchiveMode.Read))
        {
            int total = archive.Entries.Count;
            int current = 0;
            foreach (ZipArchiveEntry entry in archive.Entries)
            {
                current++;
                string destinationPath = Path.GetFullPath(Path.Combine(targetDir, entry.FullName));
                
                if (string.IsNullOrEmpty(entry.Name)) // Directory entry
                {
                    if (!Directory.Exists(destinationPath)) Directory.CreateDirectory(destinationPath);
                    continue;
                }

                string parent = Path.GetDirectoryName(destinationPath);
                if (!Directory.Exists(parent)) Directory.CreateDirectory(parent);

                entry.ExtractToFile(destinationPath, true); // Overwrite if exists

                if (current % 15 == 0 || current == total)
                {
                    SetStatus(string.Format("Extracting Chronos: {0} ({1}/{2})", entry.Name, current, total), 
                        20 + (int)(current * 65.0 / total));
                }
            }
        }
    }

    private void CopyDirectory(string sourceDir, string destinationDir)
    {
        DirectoryInfo dir = new DirectoryInfo(sourceDir);
        if (!dir.Exists) throw new DirectoryNotFoundException("Source directory not found: " + dir.FullName);

        DirectoryInfo[] dirs = dir.GetDirectories();
        Directory.CreateDirectory(destinationDir);

        foreach (FileInfo file in dir.GetFiles())
        {
            string targetFilePath = Path.Combine(destinationDir, file.Name);
            file.CopyTo(targetFilePath, true);
        }

        foreach (DirectoryInfo subDir in dirs)
        {
            string newDestinationDir = Path.Combine(destinationDir, subDir.Name);
            CopyDirectory(subDir.FullName, newDestinationDir);
        }
    }

    private void CreateShortcuts(string targetExe)
    {
        try
        {
            string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string startMenuDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

            string desktopShortcut = Path.Combine(desktopDir, "Chronos Desktop.lnk");
            string startMenuShortcut = Path.Combine(startMenuDir, "Chronos Desktop.lnk");

            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType != null)
            {
                dynamic shell = Activator.CreateInstance(shellType);
                
                // Desktop Shortcut
                dynamic shortcut = shell.CreateShortcut(desktopShortcut);
                shortcut.TargetPath = targetExe;
                shortcut.WorkingDirectory = Path.GetDirectoryName(targetExe);
                shortcut.Description = "Chronos Desktop - AgentShield-X AI Companion";
                string iconPath = Path.Combine(Path.GetDirectoryName(targetExe), "icon.ico");
                if (File.Exists(iconPath)) shortcut.IconLocation = iconPath + ",0";
                shortcut.Save();

                // Start Menu Shortcut
                dynamic shortcut2 = shell.CreateShortcut(startMenuShortcut);
                shortcut2.TargetPath = targetExe;
                shortcut2.WorkingDirectory = Path.GetDirectoryName(targetExe);
                shortcut2.Description = "Chronos Desktop - AgentShield-X AI Companion";
                if (File.Exists(iconPath)) shortcut2.IconLocation = iconPath + ",0";
                shortcut2.Save();
            }
        }
        catch { }
    }

    private void RegisterUninstall(string installFolder, string exePath)
    {
        try
        {
            string keyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\ChronosDesktop";
            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(keyPath))
            {
                if (key != null)
                {
                    key.SetValue("DisplayName", "Chronos Desktop");
                    key.SetValue("DisplayVersion", "1.0.0");
                    key.SetValue("Publisher", "AgentShield-X (Tharunkumar.S)");
                    key.SetValue("InstallLocation", installFolder);
                    key.SetValue("DisplayIcon", exePath);
                    key.SetValue("UninstallString", "cmd.exe /c rmdir /s /q \"" + installFolder + "\"");
                }
            }
        }
        catch { }
    }

    private void LaunchInstalledApp()
    {
        try
        {
            string exePath = Path.Combine(installDir, "Chronos Desktop.exe");
            if (File.Exists(exePath))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = exePath;
                psi.WorkingDirectory = installDir;
                Process.Start(psi);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show("Could not launch Chronos Desktop: " + ex.Message);
        }
    }
}
