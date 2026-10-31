# Terramar visual configurator

An unofficial local 3D configurator built around the supplied Cupra Terramar GLB.

## Run it on your laptop

1. Install [Node.js 20 LTS](https://nodejs.org/) or newer.
2. Extract this ZIP to a folder with a short path, for example `C:\projects\cupra-car-configurator`.
3. Open a terminal in that folder.
4. Run `npm install` once.
5. Run `npm run dev`.
6. Open the local address shown in the terminal, normally `http://localhost:5173`.

For a production build, run `npm run build`. It creates a `dist` folder that can be deployed to any static web host.

## Included functions

- Paint swatches plus a custom color picker
- Drag-to-rotate and scroll-to-zoom controls
- Front, side, rear, and interior camera presets
- Door and tailgate animations provided by the GLB
- PNG screenshot download
- Touch-friendly controls, collapsed mobile configurator panel, and adaptive render resolution

## Model notes

The GLB is at `public/assets/cupra-terramar.glb`. It is self-contained and already includes its textures. The project changes cloned exterior paint materials only, so cabin materials do not accidentally change color.

If a future replacement model sits too high or too low, adjust `CAR_FLOOR_OFFSET` in `src/CarScene.tsx`.

Use this only if you have the appropriate rights to use the supplied 3D model and any vehicle branding.

## Mobile performance note

The interface and renderer adapt for phones and tablets, but the included GLB is still approximately 30 MB and high-detail. Before a large public launch, create a compressed mobile model (KTX2/WebP textures plus Meshopt or Draco geometry compression) and load that version on smaller screens.
