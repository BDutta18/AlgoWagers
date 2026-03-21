# AgentPay - AI Commerce Dashboard

A premium dark-mode dashboard for AI agent commerce with real-time event streaming, blockchain transaction tracking, and cinematic animations.

## Features

- **Real-time Terminal Feed**: Live event stream with color-coded syntax highlighting
- **Agent Management**: View active agents with status indicators and hourly rates
- **Task Execution**: Execute tasks with agent assignment and cost tracking
- **Blockchain Audit Trail**: Track all transactions with on-chain verification
- **Responsive Design**: Optimized for desktop (1440px+), tablet (768px), and mobile displays
- **Cinematic Animations**: Gradient cycles, pulse effects, typewriter animations, and smooth transitions

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── globals.css         # Global styles with CSS variables
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── TopNavBar.tsx       # Navigation header
│   ├── LeftSidebar.tsx     # Agent list and balance
│   ├── BottomStatusBar.tsx # Blockchain and network status
│   ├── TaskCommandCenter.tsx # Task selection and execution
│   ├── ResultWindow.tsx    # Execution results display
│   ├── AuditTrailPanel.tsx # Transaction history table
│   └── RightPanel.tsx      # Live event terminal
├── hooks/
│   └── useAgentPay.ts      # Custom hooks for events and execution
├── lib/
│   ├── mockData.ts         # Mock data generators
│   └── animations.ts       # Animation utilities and color system
└── public/                 # Static assets
```

## Design System

### Color Palette
- **Void**: Deep space blacks (#000000 - #151d4d)
- **Surface**: Container backgrounds (#1a2555 - #141f42)
- **Accent**: Interactive colors (Indigo, Cyan, Success/Warning/Danger)
- **Text**: Primary (#f0f9ff), Secondary (#cbd5e1), Muted (#64748b)

### Typography
- **UI Font**: Space Grotesk (headers, UI)
- **Data Font**: JetBrains Mono (code, data)
- **Line Heights**: 1.5 for body, 1.3 for headings

### Animations
- Gradient cycles (3s)
- Pulse glow effects (2s)
- Typewriter text (variable)
- Fade in (0.3s)
- Slide in from left (0.4s)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd azentyc

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
pnpm build
pnpm start
```

## Features Breakdown

### 1. Real-time Events
The dashboard simulates an SSE-like terminal feed with color-coded events:
- **Info**: System initialization and configuration
- **Success**: Task completion and execution
- **Payment**: Blockchain transactions
- **Event**: Network updates and monitoring
- **Error**: System alerts and failures

### 2. Agent Management
- View active agents with status indicators
- See hourly rates and assigned models
- Track agent activity and availability

### 3. Task Execution
- Select from predefined tasks
- Execute with automatic agent assignment
- Real-time cost calculation
- Duration tracking

### 4. Audit Trail
- Blockchain transaction history
- Linked on-chain verification
- Transaction status tracking
- Sortable and filterable records

### 5. Terminal Feed
- Live event stream with timestamps
- Color-coded syntax for easy parsing
- Pause/play controls for stream management
- Auto-scrolling to latest events

## Responsive Breakpoints

- **≥1440px**: Full 3-column layout with all panels
- **1024-1439px**: Sidebar collapses; compact spacing
- **768-1023px**: Mobile-optimized 2-column layout
- **≤768px**: Single-column stacked layout

## Demo Loop

The dashboard runs a continuous demo loop every 30 seconds:
1. New terminal events are generated every 2.5s
2. Audit entries update every 15s
3. Judges can execute tasks manually or watch automatic updates
4. No backend required - all data is simulated

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized for smooth animations (60 FPS)
- Virtual scrolling for large audit trails
- Debounced resize handlers
- Minimal re-renders with React hooks

## Customization

### Adding New Agents
Edit `lib/mockData.ts` and add to `MOCK_AGENTS`:
```typescript
{
  id: 'agent-004',
  name: 'NewAgent',
  model: 'model-name',
  status: 'active',
  hourlyRate: 0.050,
}
```

### Changing Colors
Update CSS variables in `app/globals.css`:
```css
--accent-primary: #your-color;
--accent-secondary: #your-color;
```

### Modifying Animation Timing
Edit keyframes in `app/globals.css` or component animation styles:
```css
@keyframes your-animation {
  /* animation steps */
}
```

## Notes for Judges

- The dashboard runs a self-contained demo loop
- All interactions are simulated with realistic delays
- Animations emphasize premium, cinematic feel
- Responsive design works seamlessly across all devices
- No external APIs or backend required
- All colors, fonts, and animations are intentional design choices

## License

MIT License - Feel free to use this project for any purpose.
