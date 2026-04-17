import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function FloatingBackground() {
  const [elements, setElements] = useState([]);
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    // Elegant soothing food symbols
    const symbols = ['🥑', '🥗', '🍎', '🍵', '🌿', '🥥', '🥦', '🫐', '🍉'];
    const newElements = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 100, 
      y: Math.random() * 100,
      size: Math.random() * 80 + 60, // 60 to 140px
      duration: Math.random() * 30 + 30, // Very slow: 30 to 60 seconds
      delay: Math.random() * 10
    }));

    // Ambient floating text to make it less boring
    const words = ['Nourish', 'Balance', 'Thrive', 'Heal', 'Intuitive', 'Wellness', 'Vitality'];
    const textElements = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      word: words[Math.floor(Math.random() * words.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      duration: Math.random() * 40 + 40,
      delay: Math.random() * 5
    }));

    setElements(newElements);
    setTexts(textElements);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, overflow: 'hidden', pointerEvents: 'none', background: 'var(--bg-base)' }}>
      
      {/* Dynamic Glowing Orbs - Earthy/Pastel */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(176, 212, 179, 0.5) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(242, 206, 141, 0.4) 0%, transparent 70%)', filter: 'blur(100px)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', top: '20%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(220, 174, 120, 0.3) 0%, transparent 70%)', filter: 'blur(90px)' }}
      />

      {/* Floating Emojis */}
      {elements.map((el) => (
        <motion.div
          key={`emoji-${el.id}`}
          initial={{ x: `${el.x}vw`, y: `${el.y}vh`, opacity: 0, rotate: 0 }}
          animate={{
            y: [`${el.y}vh`, `${(el.y + 40) % 100}vh`, `${el.y}vh`],
            x: [`${el.x}vw`, `${(el.x + 30) % 100}vw`, `${el.x}vw`],
            rotate: [0, 180, 360],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "linear",
            delay: el.delay
          }}
          style={{ position: 'absolute', fontSize: `${el.size}px`, filter: 'drop-shadow(0px 10px 15px rgba(108,154,106,0.15))' }}
        >
          {el.symbol}
        </motion.div>
      ))}

      {/* Floating Ambient Texts */}
      {texts.map((t) => (
        <motion.div
          key={`txt-${t.id}`}
          initial={{ x: `${t.x}vw`, y: `${t.y}vh`, opacity: 0 }}
          animate={{
            y: [`${t.y}vh`, `${(t.y - 30) % 100}vh`, `${t.y}vh`],
            x: [`${t.x}vw`, `${(t.x + 20) % 100}vw`, `${t.x}vw`],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{
            duration: t.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: t.delay
          }}
          style={{ position: 'absolute', fontSize: '5rem', fontWeight: 900, color: 'var(--primary)', filter: 'blur(1px)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
        >
          {t.word}
        </motion.div>
      ))}

      {/* Light Overlay to ensure readability and classiness */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(247, 249, 242, 0.4) 0%, rgba(247, 249, 242, 0.8) 100%)' }} />
    </div>
  );
}
