# Vercel Deployment Guide

## Quick Deployment Steps

### Option 1: Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? **classic-pool-game**
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from Git repository or upload folder
4. Select this project folder
5. Click "Deploy"

### Option 3: GitHub Integration
1. Push your code to GitHub
2. Connect GitHub to Vercel
3. Import the repository
4. Vercel will auto-deploy on pushes

## Project Structure
- `index.html` - Main game file
- `script/` - Game logic and modules
- `assets/` - Game assets (sprites, sounds)
- `css/` - Stylesheets
- `vercel.json` - Vercel configuration
- `package.json` - Project metadata

## Build Information
- **Type**: Static site (no build step required)
- **Entry Point**: `index.html`
- **Framework**: Vanilla HTML/JS/CSS
- **Assets**: All included in repository

## Post-Deployment
After deployment, Vercel will provide:
- **Live URL**: Your game's public URL
- **Preview URLs**: For each deployment
- **Domain management**: Custom domain setup

## Local Development
To run locally:
```bash
npm run dev
```
Or simply open `index.html` in a browser.

## Notes
- All game assets are included
- No server-side code required
- Static deployment handles all routing
- Game works entirely in the browser