# Desktop packaging icons

The source PNG files are retained alongside Windows multi-resolution ICO files.

| Packaging surface | Icon |
| --- | --- |
| Installed app, executable, taskbar, and shortcuts | `icons/app-icon.ico` |
| Installer and uninstaller | `icons/installer-icon.ico` |

Both ICO files contain 16, 24, 32, 48, 64, 128, and 256 pixel variants.

The Windows desktop build uses Electron Builder and produces:

- An NSIS installer with a selectable installation directory.
- A portable EXE that can run without installation.

The application serves its bundled interface and question bank from a loopback-only
local service. Practice history, settings, goals, mistakes, and writing reports stay
in Electron's local application profile. Internet access is only needed for optional
AI writing review and outbound official-resource links.

The icons are mapped separately:

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
