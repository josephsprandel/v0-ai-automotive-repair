# Voice Assistant Guide

## Overview

RO Engine now includes a voice-enabled AI assistant that allows technicians and service advisors to interact with the system using natural language voice commands.

## Features

- 🎤 **Voice Input** - Native browser speech recognition (Chrome/Edge)
- 🤖 **AI-Powered** - Gemini AI understands natural language
- 🔊 **Voice Feedback** - Text-to-speech responses
- ⚡ **Real-time** - Live transcript as you speak
- 🎯 **Context-Aware** - Knows what page you're on

## Browser Support

### ✅ Fully Supported
- Google Chrome (desktop)
- Microsoft Edge (desktop)

### ⚠️ Text-Only (no voice)
- Firefox (no Web Speech API support)
- Safari (limited support)
- Mobile browsers (limited)

**Recommendation:** Use Chrome or Edge for best experience.

## How to Use

### 1. **Click the Microphone Button**
Located in the search bar at the top of every page.

### 2. **Grant Microphone Permission** (first time only)
Browser will ask: "Allow microphone access?"
Click **Allow**.

### 3. **Speak Your Command**
Wait for the red recording indicator, then speak naturally.

### 4. **Listen to Response**
The AI will:
- Show transcript in search box
- Speak response out loud
- Execute the action (navigate, show data, etc.)

## Supported Commands

### 🔧 Maintenance Recommendations
- "What services are due?"
- "Check maintenance for this vehicle"
- "Show me the maintenance schedule"

**Action:** Opens maintenance dialog (TODO: implement modal)

### 🔍 Search
- "Find customer Bob Johnson"
- "Search for repair order 12345"
- "Show me vehicles"

**Action:** Performs search (TODO: implement search results)

### 📍 Navigation
- "Go to customers"
- "Open repair orders"
- "Navigate to parts manager"
- "Take me to settings"

**Action:** Navigates to requested page

### 🚗 VIN Lookup
- "Look up VIN 1HGBH41JXMN109186"
- "Decode VIN for this vehicle"

**Action:** Decodes VIN (TODO: implement VIN display)

### 📝 Repair Order
- "Create new repair order"
- "Start new RO"

**Action:** Navigates to `/repair-orders/new`

### ❓ Help
- "Hello"
- "What can you do?"
- "Help me"

**Action:** Lists available commands

## Examples

### Example 1: Check Maintenance
```
👤 User: "What services are due?"
🤖 AI: "Let me check what services are due for your vehicle."
📊 Action: Shows maintenance recommendations
```

### Example 2: Navigate
```
👤 User: "Go to customers"
🤖 AI: "Taking you to the customers page."
📍 Action: Navigates to /customers
```

### Example 3: Search
```
👤 User: "Find Bob Johnson"
🤖 AI: "Searching for Bob Johnson in customers."
🔍 Action: Performs search
```

## Visual States

### Idle
```
┌─────────────────────────────────────────────┬───┐
│ 🔍 Search ROs, customers, vehicles...      │🎤 │
└─────────────────────────────────────────────┴───┘
```

### Listening
```
┌─────────────────────────────────────────────┬───┐
│ 🎤 Listening... "what services are due"    │🔴 │
└─────────────────────────────────────────────┴───┘
         ↑ Shows live transcript as you speak
         Red pulsing mic button
```

### Processing
```
┌─────────────────────────────────────────────┬───┐
│ 🤖 Processing...                            │⌛ │
└─────────────────────────────────────────────┴───┘
```

## Technical Details

### Architecture

```
Voice Input
    ↓
Web Speech Recognition API (browser)
    ↓
Transcript Text
    ↓
POST /api/ai-assistant
    ↓
Gemini AI (intent detection)
    ↓
Route to Handler
    ├─ Maintenance API (existing)
    ├─ Navigation (client-side)
    ├─ Search (TODO)
    └─ Generic Response
    ↓
Voice Response (Speech Synthesis API)
```

### Files

**Frontend:**
- `components/layout/global-search.tsx` - Voice-enabled search component
- `components/layout/header.tsx` - Header with GlobalSearch

**Backend:**
- `app/api/ai-assistant/route.ts` - AI command processor
- `app/api/maintenance-recommendations/route.ts` - Existing maintenance API

### APIs Used

1. **Web Speech Recognition API**
   - Native browser API (Chrome/Edge only)
   - Real-time speech-to-text
   - No external dependencies

2. **Speech Synthesis API**
   - Native browser API (all modern browsers)
   - Text-to-speech responses
   - No external dependencies

3. **Gemini AI**
   - Intent classification
   - Natural language understanding
   - Already integrated in RO Engine

## Troubleshooting

### "Microphone access denied"
**Solution:** 
1. Click the lock icon in browser address bar
2. Change microphone to "Allow"
3. Refresh page

### "Speech recognition not supported"
**Solution:** Use Chrome or Edge browser.

### AI doesn't understand command
**Solution:** Try rephrasing more clearly:
- ✅ "Go to customers"
- ❌ "Take me there"

### No voice response
**Solution:** 
1. Check system volume
2. Check browser permissions for audio
3. Try text-to-speech in browser settings

## Privacy & Security

- ✅ Voice data is processed in real-time only
- ✅ No voice recordings are stored
- ✅ Transcripts not saved to database
- ✅ All API calls go through your backend (not external)
- ✅ Browser permission required (user control)

## Future Enhancements

### Phase 2 (Coming Soon)
- [ ] Keyboard shortcut to activate (Ctrl+Space)
- [ ] Voice settings (rate, pitch, voice selection)
- [ ] Command history
- [ ] Custom commands per shop

### Phase 3
- [ ] Multi-language support
- [ ] Mobile app integration
- [ ] Voice-to-text SMS responses
- [ ] Integration with phone system

## Development

### Testing Commands

```bash
# Test in Chrome DevTools Console

// Start recognition
document.querySelector('button[title*="voice"]').click()

// Check if supported
console.log('webkitSpeechRecognition' in window)

// Test speech synthesis
const utterance = new SpeechSynthesisUtterance("Hello")
speechSynthesis.speak(utterance)
```

### Adding New Commands

Edit `app/api/ai-assistant/route.ts`:

```typescript
// Add to prompt examples:
User: "your new command"
Response:
{
  "intent": "new_intent",
  "message": "Conversational response",
  "action": "your_action",
  "data": { ... }
}

// Add to switch statement:
case 'new_intent':
  return NextResponse.json({
    ...data,
    action: 'your_action',
    message: "Your message"
  })
```

## Support

For issues or questions:
1. Check browser console for errors
2. Review API logs in terminal
3. Test with text input first (type in search box)
4. Verify Gemini API key is configured

---

**Last Updated:** January 27, 2026
**Version:** 1.0.0
