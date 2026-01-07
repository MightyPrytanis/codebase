# Beta Test Installation Guide

**Date:** 2025-12-29  
**Audience:** Beta Testers  
**Purpose:** Detailed installation instructions for Cyrano/LexFiat/Arkiver beta

---

## Quick Installation (Recommended)

### One-Click Setup

1. **From Beta Portal Dashboard:**
   - Click "Install" button
   - System detects your platform
   - Download starts automatically

2. **Run Installer:**
   - macOS: Open .dmg, drag to Applications
   - Windows: Run .exe, follow prompts
   - Linux: Run install script

3. **Verify:**
   - Installer verifies automatically
   - Green checkmark = Success
   - Launch application

**Time:** < 5 minutes

---

## Platform-Specific Instructions

### macOS

**Requirements:**
- macOS 12.0 (Monterey) or later
- 4GB RAM minimum
- 2GB free disk space

**Steps:**
1. Download `Cyrano-Beta-macOS.dmg`
2. Open downloaded .dmg file
3. Drag "Cyrano" to Applications folder
4. Open Applications, find "Cyrano"
5. Right-click → Open (first time only, to bypass Gatekeeper)
6. Click "Open" in security dialog
7. Application launches

**Troubleshooting:**
- **"App can't be opened"** - Right-click → Open, then click "Open" in dialog
- **"Unidentified developer"** - Go to System Preferences → Security → Allow
- **Installation fails** - Check disk space, try again

### Windows

**Requirements:**
- Windows 10 or later
- 4GB RAM minimum
- 2GB free disk space

**Steps:**
1. Download `Cyrano-Beta-Windows.exe`
2. Run downloaded .exe file
3. Click "Yes" in User Account Control dialog
4. Follow installation wizard:
   - Accept license agreement
   - Choose installation location (default recommended)
   - Click "Install"
5. Wait for installation to complete
6. Click "Finish"
7. Launch from Start Menu

**Troubleshooting:**
- **"Administrator required"** - Right-click → Run as Administrator
- **Installation fails** - Check Windows updates, try again
- **Can't find application** - Check Start Menu → Cyrano

### Linux

**Requirements:**
- Ubuntu 20.04+ or equivalent
- 4GB RAM minimum
- 2GB free disk space
- curl or wget installed

**Steps:**
1. Download install script:
   ```bash
   curl -O https://cognisint.com/beta/install.sh
   ```
2. Make executable:
   ```bash
   chmod +x install.sh
   ```
3. Run installer:
   ```bash
   ./install.sh
   ```
4. Follow prompts:
   - Accept license
   - Choose installation directory
   - Wait for installation
5. Launch:
   ```bash
   cyrano-beta
   ```

**Troubleshooting:**
- **Permission denied** - Use `sudo ./install.sh`
- **Dependencies missing** - Installer will prompt, follow instructions
- **Installation fails** - Check system requirements, try again

---

## Verification

### Automatic Verification

After installation, the installer automatically:
1. Checks system requirements
2. Verifies file integrity
3. Tests application launch
4. Shows success/failure status

### Manual Verification

**Check Installation:**
1. Launch application
2. Should see welcome screen
3. No error messages
4. Can navigate to login

**If Verification Fails:**
- Use Cyrano Pathfinder support (click "Get Help")
- Check system requirements
- Review error messages
- Try reinstalling

---

## Post-Installation

### First Launch

1. **Welcome Screen**
   - Read welcome message
   - Click "Get Started"

2. **Account Connection**
   - Enter beta tester email
   - Enter password
   - Click "Connect"

3. **Initial Setup**
   - Choose preferences
   - Complete setup wizard
   - Start testing!

### Configuration

**Recommended Settings:**
- UI Mode: Start with "Full Stack" (can switch later)
- Theme: "Control Room" (default)
- Notifications: Enable for important updates

**Can Change Later:**
- All settings can be changed in Settings panel
- No need to get everything perfect on first launch

---

## Troubleshooting

### Common Issues

**Issue: Installation fails immediately**
- **Solution:** Check system requirements, ensure sufficient disk space

**Issue: "Module not found" error**
- **Solution:** Use Cyrano Pathfinder support, will guide through dependency installation

**Issue: Application won't launch**
- **Solution:** Check system logs, use Pathfinder support for diagnosis

**Issue: Slow performance**
- **Solution:** Check system resources, close other applications

### Getting Help

**Automated Support:**
- Click "Get Help" button in portal
- Use Cyrano Pathfinder
- Ask questions in natural language
- Get instant assistance

**Escalation:**
- If Pathfinder can't resolve, creates support ticket
- Human support will contact you
- Response within 24 hours

---

## Uninstallation

### macOS
1. Open Applications folder
2. Drag "Cyrano" to Trash
3. Empty Trash

### Windows
1. Open Settings → Apps
2. Find "Cyrano Beta"
3. Click "Uninstall"
4. Follow prompts

### Linux
```bash
sudo ./uninstall.sh
```

---

**Need Help?** Use Cyrano Pathfinder support (click "Get Help" on any page)

**Last Updated:** 2025-12-29
