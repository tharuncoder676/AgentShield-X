using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;

public class ChronosPortableLauncher
{
    [STAThread]
    public static void Main(string[] args)
    {
        try
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string targetExe = Path.Combine(baseDir, "chronos_app", "Chronos Desktop.exe");

            if (!File.Exists(targetExe))
            {
                targetExe = Path.Combine(baseDir, "Chronos Desktop.exe");
            }

            if (!File.Exists(targetExe))
            {
                string localApp = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Chronos Desktop", "Chronos Desktop.exe");
                if (File.Exists(localApp)) targetExe = localApp;
            }

            if (File.Exists(targetExe))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = targetExe;
                psi.WorkingDirectory = Path.GetDirectoryName(targetExe);
                Process.Start(psi);
            }
            else
            {
                MessageBox.Show("Chronos Desktop application files not found. Please run Chronos-Desktop-Setup.exe to install.", "Chronos Desktop", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show("Error starting Chronos Desktop: " + ex.Message, "Chronos Desktop", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
