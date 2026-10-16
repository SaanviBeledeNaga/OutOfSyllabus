import { useEffect, useRef, useState, type FormEvent, type SyntheticEvent } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { stories, type Story } from './data/stories'
import { cofounders, type Cofounder } from './data/cofounders'

const videoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4'
export const START_OFFSET = 0.15
const contactEmail = 'outofsyllabus.hello@gmail.com'

function Brand() {
  return <Link to="/" aria-label="OutOfSyllabus home" className="brand">OutOfSyllabus<sup>®</sup></Link>
}

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="site-header">
    <div className="nav-inner">
      <Brand />
      <button className="mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      <nav className={`main-nav ${open ? 'nav-open' : ''}`} aria-label="Main navigation">
        <a onClick={close} className="nav-active" href="/#home">Home</a>
        <a onClick={close} href="/#stories">Stories</a>
        <a onClick={close} href="/#cofounders">Co-founders</a>
        <a onClick={close} href="/#contact">Get in Touch</a>
        <a onClick={close} href="/#stories" className="button button-small">Read Stories <ArrowRight size={15} /></a>
      </nav>
    </div>
  </header>
}

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reducedMotion) {
      video?.pause()
      if (video) video.style.opacity = '0'
      return
    }
    let frame = 0
    let fallbackFrame = 0
    let restartTimer = 0
    let videoFrame = 0
    let mounted = true
    let readyToShow = false
    let fadeStart = 0
    let waitingForSeek = false
    let fallbackPlayingListener: (() => void) | null = null
    const videoWithFrameCallback = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }
    const revealAfterFrame = () => {
      if (!mounted) return
      const show = () => {
        if (!mounted) return
        readyToShow = true
        fadeStart = video.currentTime
      }
      if (videoWithFrameCallback.requestVideoFrameCallback) {
        videoFrame = videoWithFrameCallback.requestVideoFrameCallback(show)
      }
    }
    const playAfterSeek = () => {
      if (!mounted) return
      waitingForSeek = false
      if (!videoWithFrameCallback.requestVideoFrameCallback) {
        fallbackPlayingListener = () => { fallbackFrame = requestAnimationFrame(() => {
          if (mounted) {
            readyToShow = true
            fadeStart = video.currentTime
          }
        }) }
        video.addEventListener('playing', fallbackPlayingListener, { once: true })
      }
      void video.play().then(revealAfterFrame).catch(() => undefined)
    }
    const seekToStart = () => {
      if (!mounted || waitingForSeek) return
      readyToShow = false
      video.style.opacity = '0'
      waitingForSeek = true
      if (Math.abs(video.currentTime - START_OFFSET) < 0.01) {
        playAfterSeek()
      } else {
        video.addEventListener('seeked', playAfterSeek, { once: true })
        video.currentTime = START_OFFSET
      }
    }
    const loaded = () => seekToStart()
    const monitor = () => {
      if (!mounted) return
      const duration = video.duration
      if (readyToShow && Number.isFinite(duration) && duration > 0) {
        const remaining = duration - video.currentTime
        const fade = Math.min(1, Math.max(0, (video.currentTime - fadeStart) / 0.5), Math.max(0, remaining / 0.5))
        video.style.opacity = String(Math.max(0, fade))
      }
      frame = requestAnimationFrame(monitor)
    }
    const ended = () => {
      video.style.opacity = '0'
      window.clearTimeout(restartTimer)
      restartTimer = window.setTimeout(() => {
        if (!mounted) return
        seekToStart()
      }, 100)
    }
    // Keep every pre-rendered frame hidden; revealing only a decoded playback frame prevents the startup flash.
    video.style.opacity = '0'
    video.addEventListener('loadeddata', loaded)
    video.addEventListener('ended', ended)
    frame = requestAnimationFrame(monitor)
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) loaded()
    return () => {
      mounted = false
      cancelAnimationFrame(frame)
      cancelAnimationFrame(fallbackFrame)
      if (videoFrame && videoWithFrameCallback.cancelVideoFrameCallback) videoWithFrameCallback.cancelVideoFrameCallback(videoFrame)
      window.clearTimeout(restartTimer)
      video.removeEventListener('loadeddata', loaded)
      video.removeEventListener('ended', ended)
      video.removeEventListener('seeked', playAfterSeek)
      if (fallbackPlayingListener) video.removeEventListener('playing', fallbackPlayingListener)
      video.pause()
    }
  }, [reducedMotion])

  return <div className="hero-media" aria-hidden="true">
    <video ref={videoRef} className="hero-video" src={videoUrl} muted playsInline preload="auto" autoPlay={false} />
    <div className="video-overlay" />
  </div>
}

function StoryCard({ story }: { story: Story }) {
  return <Link to={`/stories/${story.slug}`} className="story-card featured-card">
    <div className="story-image-wrap"><img src={story.photo} alt={`Portrait of ${story.name}`} loading="lazy" /><span className="image-arrow"><ArrowUpRight size={18} /></span></div>
    <div className="story-copy">
      <p className="eyebrow">{story.college}</p>
      <h3>{story.name}</h3>
      <p className="story-summary">{story.summary}</p>
      <span className="feature-link">Read the story <ArrowRight size={15} /></span>
    </div>
  </Link>
}

function CofounderCard({ person }: { person: Cofounder }) {
  const handlePhotoError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = 'none'
    event.currentTarget.parentElement?.classList.add('cofounder-image-missing')
  }
  return <article className="cofounder-card">
    <div className="cofounder-photo"><img src={person.photo} alt={`Portrait of ${person.name}`} loading="lazy" onError={handlePhotoError} /><span aria-hidden="true">Photo to come</span></div>
    <div className="cofounder-info"><h3>{person.name}</h3><p className="cofounder-role">{person.role}</p><p className="cofounder-bio">{person.bio}</p>
      {(person.linkedin || person.github) && <div className="cofounder-links">{person.linkedin && <a href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={13} /></a>}{person.github && <a href={person.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a>}</div>}
    </div>
  </article>
}

type ContactFields = 'name' | 'email' | 'message'
type ContactValues = Record<ContactFields, string>
const emptyContactValues: ContactValues = { name: '', email: '', message: '' }

async function sendContactMessage(_values: ContactValues): Promise<void> {
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT
  if (!endpoint) {
    const subject = encodeURIComponent(`Message from ${_values.name.trim()}`)
    const body = encodeURIComponent(`${_values.message.trim()}\n\nFrom: ${_values.name.trim()} <${_values.email.trim()}>`)
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
    throw new Error('Email app opened')
  }
  const payload = new FormData()
  payload.set('name', _values.name.trim())
  payload.set('email', _values.email.trim())
  payload.set('_replyto', _values.email.trim())
  payload.set('message', _values.message.trim())
  const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: payload })
  if (!response.ok) throw new Error('Contact form request failed')
}

function ContactSection() {
  const [values, setValues] = useState<ContactValues>(emptyContactValues)
  const [touched, setTouched] = useState<Record<ContactFields, boolean>>({ name: false, email: false, message: false })
  const [submitted, setSubmitted] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [copied, setCopied] = useState(false)
  const errors: ContactValues = {
    name: values.name.trim() ? '' : 'Please enter your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? '' : 'Enter a valid email address.',
    message: values.message.trim() ? '' : 'Please write a message.',
  }

  const update = (field: ContactFields, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
    setSent(false)
    setSendError(false)
  }
  const showError = (field: ContactFields) => (touched[field] || submitted) ? errors[field] : ''
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setTouched({ name: true, email: true, message: true })
    if (Object.values(errors).some(Boolean)) return
    try {
      await sendContactMessage(values)
      setSent(true)
      setSendError(false)
      setValues(emptyContactValues)
      setTouched({ name: false, email: false, message: false })
      setSubmitted(false)
    } catch {
      if (import.meta.env.VITE_FORM_ENDPOINT) setSendError(true)
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { setCopied(false) }
  }

  return <section className="section community-section">
    <div className="community-grid">
      <div className="community-cofounders" id="cofounders">
        <h2 className="section-title">Meet the co-founders</h2>
        <div className="cofounders-grid">{cofounders.map(person => <CofounderCard key={person.id} person={person} />)}</div>
      </div>
      <div className="community-contact" id="contact">
        <h2 className="section-title">Get in touch</h2>
        <p className="contact-intro">Have a story to share or a question for us? Write to us.</p>
        <div className="contact-layout">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" autoComplete="name" required value={values.name} onChange={event => update('name', event.target.value)} onBlur={() => setTouched(current => ({ ...current, name: true }))} aria-invalid={!!showError('name')} aria-describedby={showError('name') ? 'contact-name-error' : undefined} />{showError('name') && <span className="field-error" id="contact-name-error">{showError('name')}</span>}</div>
        <div className="form-field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" autoComplete="email" required value={values.email} onChange={event => update('email', event.target.value)} onBlur={() => setTouched(current => ({ ...current, email: true }))} aria-invalid={!!showError('email')} aria-describedby={showError('email') ? 'contact-email-error' : undefined} />{showError('email') && <span className="field-error" id="contact-email-error">{showError('email')}</span>}</div>
        <div className="form-field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows={5} required value={values.message} onChange={event => update('message', event.target.value)} onBlur={() => setTouched(current => ({ ...current, message: true }))} aria-invalid={!!showError('message')} aria-describedby={showError('message') ? 'contact-message-error' : undefined} />{showError('message') && <span className="field-error" id="contact-message-error">{showError('message')}</span>}</div>
            <div className="form-submit-row"><button type="submit" className="button">Send message <ArrowRight size={16} /></button>{sent && <span className="form-success" role="status">Message sent</span>}{sendError && <span className="form-error" role="alert">Something went wrong. Email us directly.</span>}</div>
          </form>
          <aside className="contact-details"><span className="section-index">SAY HELLO</span><div className="email-copy-row"><a className="contact-email" href={`mailto:${contactEmail}`}>{contactEmail}</a><button className="copy-email" type="button" onClick={copyEmail} aria-live="polite">{copied ? 'Copied' : 'Copy'}</button></div><div className="contact-socials"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={14} /></a></div></aside>
        </div>
      </div>
    </div>
  </section>
}

function Footer() {
  return <footer className="footer footer-minimal"><span>© 2026 OutOfSyllabus<sup>®</sup></span></footer>
}

function HomePage() {
  const featured = stories.slice(0, 3)
  return <>
    <section className="hero-shell" id="home">
      <HeroVideo />
      <Header />
      <div className="hero-content">
        <span className="hero-kicker animate-fade-rise">FIELD NOTES FROM THE JOURNEY</span>
        <h1 className="animate-fade-rise">Behind every offer letter<br className="desktop-break" /> is a <em>messy middle.</em></h1>
        <p className="hero-description animate-fade-rise-delay">Real students. Real timelines. The rejections, the resources, and the month-by-month steps behind every success.</p>
        <a href="#stories" className="button hero-cta animate-fade-rise-delay-2">Read Stories <ArrowDown size={16} /></a>
      </div>
      <div className="hero-bottom"><span>HONEST JOURNEYS, INDIAN ENGINEERING</span><span>SCROLL TO EXPLORE <ArrowDown size={13} /></span></div>
    </section>

    <main>
      <section className="section stories-section" id="stories">
        <h2 className="section-title">Stories worth staying for</h2>
        <div className="featured-grid">{featured.map(story => <StoryCard key={story.slug} story={story} />)}</div>
      </section>

      <ContactSection />
    </main>
    <Footer />
  </>
}

function Timeline({ story }: { story: Story }) {
  const milestones = story.timeline.split(' · ')
  return <div className="timeline" aria-label={`Journey timeline: ${story.timeline}`}>
    {Array.from({ length: 6 }, (_, index) => <div className="timeline-month" key={index}><span className="timeline-dot" /><span className="timeline-label">Month {index + 1}</span><span className="timeline-event">{milestones[index] ?? 'Kept going'}</span></div>)}
  </div>
}

function StoryPage() {
  const { slug } = useParams()
  const story = stories.find(item => item.slug === slug)
  if (!story) return <><Header /><main className="not-found"><span className="section-index">404 / STORY NOT FOUND</span><h1>That story isn’t here.</h1><Link className="text-link" to="/">Back to all stories <ArrowRight size={15} /></Link></main><Footer /></>
  return <><Header /><main className="article-page">
    <Link className="back-link" to="/"><ArrowLeft size={15} /> All stories</Link>
    <div className="article-hero"><span className="section-index">A STUDENT JOURNEY <span>·</span> {story.readTime.toUpperCase()}</span><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="author-line"><img src={story.photo} alt={`Portrait of ${story.name}`} /><div><strong>{story.name}</strong><span>{story.college} · {story.year}</span></div></div></div>
    <figure className="article-cover"><img src={story.photo} alt={`${story.name}, student at ${story.college}`} /><figcaption>A little context from {story.name}’s journey.</figcaption></figure>
    <div className="article-layout"><aside className="quick-facts"><span className="section-index">AT A GLANCE</span><h2>Quick facts</h2><dl><dt>College</dt><dd>{story.college}</dd><dt>Year</dt><dd>{story.year}</dd><dt>Timeline</dt><dd>{story.timeline}</dd><dt>Key resources</dt><dd>{story.resources.join(' · ')}</dd></dl></aside>
      <article className="article-body"><section><span className="section-index">01 / THE STARTING POINT</span><h2>Background</h2><p>{story.background}</p></section><section><span className="section-index">02 / THE FIRST MOVE</span><h2>First step</h2><p>{story.firstStep}</p><blockquote>{story.quote}</blockquote></section><section><span className="section-index">03 / THE HARD PART</span><h2>Biggest setback</h2><p>{story.setback}</p></section><section><span className="section-index">04 / THE TOOLKIT</span><h2>Resources</h2><p>These are the resources that helped along the way:</p><ul>{story.resources.map(resource => <li key={resource}>{resource}</li>)}</ul></section><section><span className="section-index">05 / PASS IT ON</span><h2>Advice</h2><p>{story.advice}</p></section></article>
    </div>
    <section className="article-timeline"><span className="section-index">THE LONG WAY, DRAWN OUT</span><h2>One step at a time.</h2><Timeline story={story} /></section>
    <div className="next-story"><span className="section-index">KEEP READING</span><Link to={`/stories/${stories[(stories.indexOf(story) + 1) % stories.length].slug}`}>Another journey <ArrowRight size={17} /></Link></div>
  </main><Footer /></>
}

export default function App() {
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/stories/:slug" element={<StoryPage />} /></Routes>
}
