# Desktop packaging icons

The source PNG files are retained alongside Windows multi-resolution ICO files.

| Packaging surface | Icon |
| --- | --- |
| Installed app, executable, taskbar, and shortcuts | `icons/app-icon.ico` |
| Installer and uninstaller | `icons/installer-icon.ico` |

Both ICO files contain 16, 24, 32, 48, 64, 128, and 256 pixel variants.

For an Electron Builder package, map them separately:

```json
{
  "build": {
    "win": {
      "icon": "packaging/icons/app-icon.ico"
    },
    "nsis": {
      "installerIcon": "packaging/icons/installer-icon.ico",
      "uninstallerIcon": "packaging/icons/installer-icon.ico",
      "installerHeaderIcon": "packaging/icons/installer-icon.ico"
    }
  }
}
```
