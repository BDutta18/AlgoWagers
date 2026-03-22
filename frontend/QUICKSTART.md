# Quick Start Guide - AgentPay Dashboard

## What is AgentPay?

AgentPay is a premium dark-mode AI commerce dashboard that showcases real-time agent management, blockchain payment tracking, and cinematic animations. It's a self-contained demo with no backend required.

## Installation & Running

### Option 1: Using Antigravity (Recommended)
1. Download the ZIP file from v0
2. Extract to your Antigravity projects folder
3. Open Antigravity and select the Azentyc project
4. Run `pnpm install && pnpm dev`
5. Open http://localhost:3000

### Option 2: Manual Installation
```bash
# Clone or extract the project
cd azentyc

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### Option 3: Production Build
```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Deploy to Vercel or any Node.js host
```

## Dashboard Overview

### Main Sections (Left to Right)

1. **Left Sidebar**
   - Shows your available ETH balance
   - Lists all active agents with status
   - Click to select an agent

2. **Center Column**
   - **Top**: Task execution panel with task selection
   - **Bottom**: Blockchain audit trail with transaction history

3. **Right Sidebar (Terminal)**
   - Live event stream updating every 2.5 seconds
   - Click PLAY/PAUSE to control the feed
   - Color-coded events for easy parsing

4. **Bottom Bar**
   - Network status and coordinator address
   - Current blockchain block height
   - Gas prices and sync status

## Using the Dashboard

### Executing a Task
1. Select a task from the task pills (Web Scraping, Sentiment Analysis, etc.)
2. Review the task details
3. Click **EXECUTE TASK**
4. Watch the progress in the Result Window
5. See the cost and duration once complete

### Monitoring Events
- Watch the terminal on the right for real-time updates
- Green = Success, Red = Error, Yellow = Warning, Blue = Event
- Click PAUSE to freeze the stream, PLAY to resume
- Scroll up to see historical events

### Checking Audit Trail
- Review all completed transactions in the table
- Click on transaction hashes to view details
- Status indicators show if transactions are completed/pending/failed
- Table auto-updates with new transactions every 15 seconds

### Agent Selection
- View agent names, models, and hourly rates in the left panel
- Active agents show a green indicator
- Idle agents show gray
- Balance updates in real-time

## Keyboard Shortcuts & Tips

- Click any task pill to select it
- Enter custom commands in the input field (for demos)
- Click transaction hashes to simulate navigation
- All animations are smooth at 60 FPS
- Responsive design works on mobile/tablet

## Demo Loop Behavior

The dashboard automatically:
- Generates new terminal events every 2.5 seconds
- Updates audit trail every 15 seconds
- Simulates task execution for 2-5 seconds
- Calculates realistic costs based on agent rates
- Updates network status continuously

**You can interrupt the demo by clicking EXECUTE TASK manually.**

## What You're Seeing

### Terminal Events (Right Panel)
```
[INIT] AgentPay network initialized...
[SYNC] Blockchain state synced with 847 validators
[SUCCESS] DataExtract Pro completed task in 2.3s
[PAYMENT] Transferring 0.0047 ETH to agent-001
```

### Audit Trail (Bottom Table)
Shows every transaction with:
- Transaction hash (linked, clickable)
- Agent name that executed the task
- Task that was completed
- Amount paid (in ETH)
- Transaction status

## Mobile Usage

The dashboard is fully responsive:
- **Tablet (768px+)**: Shows sidebar and main content
- **Mobile (< 768px)**: Single-column layout with scroll
- All buttons and inputs are touch-friendly
- Terminal and tables scroll independently

## Browser Compatibility

Works on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari (iPad/iPhone)
- Chrome Mobile (Android)

## Customization

### Change Task Names
Edit `lib/mockData.ts` and modify `MOCK_TASKS`

### Change Agent Names
Edit `lib/mockData.ts` and modify `MOCK_AGENTS`

### Change Colors
Edit `app/globals.css` CSS variables:
```css
--accent-primary: #your-color;
--accent-secondary: #your-color;
```

### Adjust Animation Speed
Edit keyframes in `app/globals.css`:
```css
@keyframes gradient-cycle {
  animation: ... 3s ease-in-out infinite; /* Change 3s */
}
```

## Troubleshooting

**"Events not appearing?"**
- Check if PLAY button is active in terminal
- Refresh the page (F5)
- Check browser console for errors

**"Dashboard looks broken?"**
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure you're using a modern browser
- Try a different browser

**"Commands not working?"**
- Make sure to press EXECUTE TASK
- Try clicking different tasks
- Page should be fully loaded first

**"Mobile layout issues?"**
- Rotate your device to landscape
- Zoom out slightly
- Try on a different browser

## Next Steps

1. **Explore**: Click around and interact with all panels
2. **Execute**: Run some tasks and watch results appear
3. **Monitor**: Observe the terminal stream and audit trail
4. **Customize**: Modify colors/tasks/agents to your liking
5. **Deploy**: Push to Vercel or your own server

## Support & Documentation

- See `README.md` for technical details
- See `BUILD_SUMMARY.md` for architecture overview
- All code is well-commented and type-safe
- Components are modular and reusable

## Key Design Highlights

- Cyberpunk aesthetic with deep void blacks and neon accents
- Premium typography (Space Grotesk + JetBrains Mono)
- Smooth 60 FPS animations throughout
- Real-time data simulation without backend
- Fully responsive design
- Accessibility-first approach

---

**Start by clicking EXECUTE TASK and watch the magic happen!**

For questions or issues, refer to the README.md or BUILD_SUMMARY.md files.
