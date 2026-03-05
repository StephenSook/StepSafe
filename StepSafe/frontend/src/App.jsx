import { useState, useRef, useCallback } from 'react'
import { BackgroundCircles } from './components/ui/background-circles'
import { PixelTrail } from './components/ui/pixel-trail'
import { useScreenSize } from './components/hooks/use-screen-size'

const MOCK_RESULTS = {
  predictions: { infection: 0.87, ischemia: 0.08, gangrene: 0.03, normal: 0.02 },
  severity_score: 0.78,
}

const CLASSIFICATIONS = ['infection', 'ischemia', 'gangrene', 'normal']

const CLASS_CONFIG = {
  infection: { label: 'Infection', color: '#F59E0B', bg: '#FEF3C7' },
  ischemia: { label: 'Ischemia', color: '#EF4444', bg: '#FEE2E2' },
  gangrene: { label: 'Gangrene', color: '#DC2626', bg: '#FECACA' },
  normal: { label: 'Normal', color: '#0D9488', bg: '#CCFBF1' },
}

const WOUND_LOCATIONS = [
  'Left Foot - Plantar (Sole)',
  'Left Foot - Dorsal (Top)',
  'Left Foot - Heel',
  'Left Foot - Toes',
  'Left Foot - Medial (Inner)',
  'Left Foot - Lateral (Outer)',
  'Right Foot - Plantar (Sole)',
  'Right Foot - Dorsal (Top)',
  'Right Foot - Heel',
  'Right Foot - Toes',
  'Right Foot - Medial (Inner)',
  'Right Foot - Lateral (Outer)',
]

const STATS = [
  { value: '20 sec', desc: 'Every 20 seconds a limb is lost to diabetes' },
  { value: '80%', desc: 'of amputations are preventable with early detection' },
  { value: '2.5M', desc: 'Americans affected by diabetic foot ulcers annually' },
]

function getRecommendation(topClass, severity) {
  if (topClass === 'normal') return 'No immediate concern. Continue routine diabetic foot care and schedule regular follow-up assessments.'
  if (severity > 0.75) return 'URGENT: Immediate clinical evaluation recommended. Consider wound culture, vascular assessment, and specialist referral. Initiate broad-spectrum antibiotic therapy if infection is confirmed.'
  if (severity > 0.5) return 'Schedule priority clinical evaluation within 24-48 hours. Obtain wound measurements and photograph for documentation. Consider referral to wound care specialist.'
  return 'Monitor closely. Schedule follow-up assessment within 1 week. Educate patient on wound care, offloading, and signs of worsening.'
}

function getSeverity(score) {
  if (score <= 0.33) return { label: 'Low', color: '#0D9488', bg: '#CCFBF1' }
  if (score <= 0.66) return { label: 'Moderate', color: '#F59E0B', bg: '#FEF3C7' }
  return { label: 'High', color: '#EF4444', bg: '#FEE2E2' }
}

// --- Icons as inline SVGs ---
function IconUpload() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function IconCamera() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconClipboard() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
  )
}
function IconDocument() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}
function IconHeart() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

// --- Components ---

function ClassificationBar({ label, confidence, color, bg, isTop }) {
  const pct = (confidence * 100).toFixed(1)
  return (
    <div className={`p-3 rounded-xl transition-all ${isTop ? 'ring-2' : ''}`} style={isTop ? { backgroundColor: bg + '60', ringColor: color } : { backgroundColor: '#f1f5f9' }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function SeverityIndicator({ score }) {
  const sev = getSeverity(score)
  const pct = (score * 100).toFixed(0)
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: sev.bg }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: sev.color }}>
        {pct}%
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: sev.color }}>{sev.label} Severity</div>
        <div className="text-xs text-slate-500">Based on AI confidence analysis</div>
      </div>
    </div>
  )
}

function generateReportText(results, woundLocation) {
  const topEntry = Object.entries(results.predictions).reduce((a, b) => (b[1] > a[1] ? b : a))
  const sev = getSeverity(results.severity_score)
  const rec = getRecommendation(topEntry[0], results.severity_score)
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return `CLINICAL WOUND ASSESSMENT NOTE
========================================
Generated by StepSafe AI | ${dateStr} at ${timeStr}

PATIENT WOUND ASSESSMENT
----------------------------------------
Wound Location: ${woundLocation || 'Not specified'}
Assessment Method: AI-Assisted Image Analysis

CLASSIFICATION RESULTS
----------------------------------------
${CLASSIFICATIONS.map(c => `  ${CLASS_CONFIG[c].label.padEnd(12)} ${(results.predictions[c] * 100).toFixed(1)}%`).join('\n')}

PRIMARY CLASSIFICATION: ${CLASS_CONFIG[topEntry[0]].label} (${(topEntry[1] * 100).toFixed(1)}% confidence)
SEVERITY LEVEL: ${sev.label} (${(results.severity_score * 100).toFixed(0)}%)

RECOMMENDED ACTION
----------------------------------------
${rec}

ATTACHED DOCUMENTATION
----------------------------------------
- Digital wound photograph (attached)
- AI analysis confidence scores (above)

NOTE: This assessment was generated using StepSafe AI-powered
wound analysis. Results should be validated by a qualified
healthcare professional. This tool is intended to support,
not replace, clinical judgment.
========================================
StepSafe | HMI Hackathon 2026 | Kennesaw State University`
}

function StatsSection() {
  const screenSize = useScreenSize()

  return (
    <section className="relative min-h-[500px] bg-gray-50 overflow-hidden">
      {/* Pixel trail background */}
      <div className="absolute inset-0 z-0">
        <PixelTrail
          pixelSize={screenSize.lessThan('md') ? 48 : 64}
          fadeDuration={0}
          delay={800}
          pixelClassName="rounded-full bg-teal-400/40"
        />
      </div>

      {/* Content on top */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 pointer-events-none">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 mb-3">
          Why Early Detection Matters
        </h2>
        <p className="text-slate-500 text-center mb-12 text-sm sm:text-base">
          The numbers behind the urgency
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-gray-100"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#0D9488]">
                  {i === 0 ? <IconHeart /> : i === 1 ? <IconShield /> : <IconChart />}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#0D9488] mb-3">
                {stat.value}
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [imagePreview, setImagePreview] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [woundLocation, setWoundLocation] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const uploadRef = useRef(null)
  const resultsRef = useRef(null)

  const handleImageSelect = useCallback((file) => {
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setResults(null)
    setShowReport(false)
    setCopied(false)
  }, [])

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const analyzeImage = () => {
    if (!imagePreview) return
    setLoading(true)
    setTimeout(() => {
      setResults(MOCK_RESULTS)
      setLoading(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }, 1800)
  }

  const reset = () => {
    setImagePreview(null)
    setResults(null)
    setShowReport(false)
    setCopied(false)
    setWoundLocation('')
  }

  const copyReport = () => {
    const text = generateReportText(results, woundLocation)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportPDF = () => {
    const text = generateReportText(results, woundLocation)
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>StepSafe Report</title><style>body{font-family:monospace;white-space:pre-wrap;padding:40px;font-size:13px;line-height:1.6;color:#1e293b;max-width:700px;margin:0 auto;}@media print{body{padding:20px;}}</style></head><body>${text.replace(/</g, '&lt;')}</body></html>`)
    w.document.close()
    w.print()
  }

  const topClass = results
    ? Object.entries(results.predictions).reduce((a, b) => (b[1] > a[1] ? b : a))
    : null

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488] flex items-center justify-center">
              <IconShield />
            </div>
            <span className="font-bold text-xl text-slate-800">
              Step<span className="text-[#0D9488]">Safe</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:block">HMI Hackathon 2026 | KSU</span>
            <button
              onClick={scrollToUpload}
              className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-[#0F766E] transition-colors cursor-pointer"
            >
              Start Scan
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <BackgroundCircles className="min-h-screen py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0D9488] text-sm font-medium mb-8">
            <IconShield />
            AI-Powered Detection
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5 leading-tight bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(13,148,136,0.3)]">
            StepSafe
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            AI-Powered Diabetic Foot Ulcer Detection
          </p>
          <button
            onClick={scrollToUpload}
            className="px-10 py-4 rounded-xl bg-[#0D9488] text-white font-semibold text-base hover:bg-[#0F766E] transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            Get Started
          </button>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-14 justify-center">
            {[
              { icon: <IconChart />, text: 'Instant Classification' },
              { icon: <IconShield />, text: 'Clinical-Grade AI' },
              { icon: <IconHeart />, text: 'Patient-Centered' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-slate-600 shadow-sm">
                <span className="text-[#0D9488]">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </BackgroundCircles>

      {/* Upload Section */}
      <section ref={uploadRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Wound Analysis</h2>
          <p className="text-slate-500">Upload or capture an image of the foot for AI-powered assessment</p>
        </div>

        <div className="max-w-xl mx-auto">
          {!imagePreview ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center hover:border-[#0D9488]/40 transition-colors shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-slate-500 mb-6 text-sm">
                Drag and drop an image here, or use the buttons below
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors shadow-sm cursor-pointer"
                >
                  <IconUpload />
                  Upload Image
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border-2 border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  <IconCamera />
                  Take Photo
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleImageSelect(e.target.files[0])} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={e => handleImageSelect(e.target.files[0])} className="hidden" />
              <p className="text-xs text-slate-400 mt-4">Supports JPG, PNG, HEIC. Max 10MB.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img src={imagePreview} alt="Selected" className="w-full max-h-80 object-contain bg-slate-50" />
                {loading && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-[#0D9488] text-sm font-semibold">Analyzing wound...</span>
                    <span className="text-slate-400 text-xs mt-1">Running AI classification model</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                {!results && !loading && (
                  <button
                    onClick={analyzeImage}
                    className="px-8 py-3 rounded-xl font-semibold text-sm bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors shadow-sm cursor-pointer"
                  >
                    Analyze Image
                  </button>
                )}
                <button
                  onClick={reset}
                  className="px-6 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {results ? 'New Scan' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {results && (
        <section ref={resultsRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 scroll-mt-20">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Image + Severity */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-slate-800">Submitted Image</h3>
                </div>
                <img src={imagePreview} alt="Wound" className="w-full max-h-72 object-contain bg-slate-50" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Severity Assessment</h3>
                <SeverityIndicator score={results.severity_score} />
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommended Action</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {getRecommendation(topClass[0], results.severity_score)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Classification */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Classification Results</h3>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: CLASS_CONFIG[topClass[0]].bg, color: CLASS_CONFIG[topClass[0]].color }}
                  >
                    {CLASS_CONFIG[topClass[0]].label} Detected
                  </span>
                </div>
                <div className="space-y-2.5">
                  {CLASSIFICATIONS.map(cls => (
                    <ClassificationBar
                      key={cls}
                      label={CLASS_CONFIG[cls].label}
                      confidence={results.predictions[cls]}
                      color={CLASS_CONFIG[cls].color}
                      bg={CLASS_CONFIG[cls].bg}
                      isTop={topClass[0] === cls}
                    />
                  ))}
                </div>
              </div>

              {/* Generate Report */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Clinical Report</h3>
                {!showReport ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-4">Generate a formatted wound assessment note for your EHR system</p>
                    <button
                      onClick={() => setShowReport(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0F766E] transition-colors cursor-pointer"
                    >
                      <IconDocument />
                      Generate Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Wound Location</label>
                      <select
                        value={woundLocation}
                        onChange={e => setWoundLocation(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                      >
                        <option value="">Select location...</option>
                        {WOUND_LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 max-h-48 overflow-y-auto border border-slate-100">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                        {generateReportText(results, woundLocation)}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyReport}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
                      >
                        <IconClipboard />
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                      <button
                        onClick={exportPDF}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors cursor-pointer"
                      >
                        <IconDocument />
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Banner */}
      <StatsSection scrollToUpload={scrollToUpload} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0D9488] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="font-semibold text-slate-700">Step<span className="text-[#0D9488]">Safe</span></span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-slate-500">HMI Hackathon 2026 | Kennesaw State University</p>
              <p className="text-xs text-slate-400 mt-1">For educational & demonstration purposes only. Not medical advice.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
