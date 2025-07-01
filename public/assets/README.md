# Avatar Assets

Place your 3D avatar files in this directory.

## Supported Formats
- GLB (recommended)
- GLTF

## File Naming
- You can name your avatar file anything (e.g., `my-avatar.glb`)
- Then reference it in the app as `./assets/my-avatar.glb`

## Avatar Requirements
- Optimized for web (under 10MB recommended)
- Should include these animations for best results:
  - `idle` or `breathe` (for when not speaking)
  - `talk` or `speak` (for when character is speaking)
- Forward-facing by default
- Centered at origin

## Example Usage
If you place a file called `avatar.glb` in this folder, you can reference it in the app configuration as:
```
./assets/avatar.glb
```

Or if hosting externally:
```
https://yourwebsite.com/path/to/avatar.glb
``` 