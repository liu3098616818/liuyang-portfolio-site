import { useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import About from './components/About.jsx'
import Works from './components/Works.jsx'
import Strengths from './components/Strengths.jsx'
import Contact from './components/Contact.jsx'
import Lightbox from './components/Lightbox.jsx'
import Cursor from './components/Cursor.jsx'
import EditorPanel from './editor/EditorPanel.jsx'
import TextBlockBar from './editor/TextBlockBar.jsx'
import { EditorProvider } from './editor/EditorContext.jsx'
import { useScrollProgress, useActiveSection } from './hooks/useSite.js'
import './editor/editor.css'

const SECTIONS = ['hero', 'about', 'works', 'strengths', 'contact']

export default function App() {
  return (
    <EditorProvider>
      <Site />
    </EditorProvider>
  )
}

function Site() {
  const progress = useScrollProgress()
  const active = useActiveSection(SECTIONS)
  const [openWork, setOpenWork] = useState(null)

  return (
    <>
      <div className="grain" />
      <div className="scanlines" />
      <Cursor />
      <div className="progress" style={{ width: `${progress * 100}%` }} />

      <Nav active={active} />

      <main>
        <Hero />
        <Marquee />
        <About />
        <Marquee dark />
        <Works onOpen={setOpenWork} />
        <Strengths />
        <Contact />
      </main>

      {openWork && <Lightbox work={openWork} onClose={() => setOpenWork(null)} />}
      <TextBlockBar />
      <EditorPanel />
    </>
  )
}
