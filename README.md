# 🎓 Dr. Dissertation Beta App

**Real HAIST© dissertation reviews powered by Claude API**

![Beta Testing](https://img.shields.io/badge/status-beta-orange)
![License](https://img.shields.io/badge/license-Proprietary-blue)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Deploy to Vercel
vercel

# 4. Add API key to Vercel
vercel env add ANTHROPIC_API_KEY

# 5. Deploy to production
vercel --prod
```

**That's it! Your app is live.** 🎉

---

## 📖 What This Is

A fully functional beta testing app that:
- Accepts dissertation uploads (.pdf, .docx)
- Processes with Claude API using HAIST© framework
- Generates comprehensive reviews
- Returns professional feedback
- **Completely free for beta testers** (you pay API costs)

---

## 💰 Costs

- **Hosting:** FREE (Vercel)
- **Per Review:** ~$0.50 (Claude API)
- **20 Beta Reviews:** ~$10-12 total

---

## 🎯 Features

✅ Drag & drop file upload  
✅ Real-time processing status  
✅ Complete HAIST© protocol  
✅ Professional review output  
✅ Mobile responsive  
✅ Error handling  
✅ Automatic file cleanup  

---

## 📂 Structure

```
api/
  haist-prompt.js      # HAIST© review protocol
  process-review.js    # Serverless API handler
components/
  FileUpload.jsx       # Drag & drop component
  ProcessingStatus.jsx # Progress indicator
pages/
  index.jsx            # Main app page
```

---

## 🔧 Configuration

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=production
```

### Vercel Settings

- Max Duration: 300 seconds (5 minutes)
- Memory: 1024 MB
- Region: Auto

---

## 📊 Monitoring

**Vercel Dashboard:**
- https://vercel.com/dashboard
- Track: Requests, errors, performance

**Anthropic Console:**
- https://console.anthropic.com
- Track: API usage, costs

---

## 🐛 Troubleshooting

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.

**Common Issues:**
- API key not configured → Run `vercel env add ANTHROPIC_API_KEY`
- Timeout → Increase `maxDuration` in vercel.json
- File too large → Max 10MB

---

## 📝 Testing

```bash
# Local development
npm run dev

# Visit http://localhost:3000
```

---

## 🎓 HAIST© Framework

Based on research-backed methodology:
- 10-dimensional analysis
- Developmental feedback
- Actionable recommendations
- Defense blocker identification
- Location-aware citations

---

## 📄 License

Proprietary - Dr. John Chick / University of Bridgeport

---

## 🤝 Support

Questions? Issues? Improvements?
Contact: Dr. John Chick

---

**Built with ❤️ for doctoral students**
