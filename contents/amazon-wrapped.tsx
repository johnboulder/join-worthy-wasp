import type {PlasmoCSConfig} from "plasmo"
import React from "react"
import {createRoot} from "react-dom/client"
import {motion, AnimatePresence} from "framer-motion"
import anvilImage from "data-base64:~assets/anvil.jpg"
import slide1Bg from "data-base64:~assets/slides/slide_1.png"
import slide2Bg from "data-base64:~assets/slides/slide_2.png"
import slide3Bg from "data-base64:~assets/slides/slide_3.png"
import slide4Bg from "data-base64:~assets/slides/slide_4.png"
import slide5Bg from "data-base64:~assets/slides/slide_5.png"
import slide6Bg from "data-base64:~assets/slides/slide_6.png"
import slide7Bg from "data-base64:~assets/slides/slide_7.png"
import snowLight from "data-base64:~assets/ambient/ambient-snow-light.png"
import sparkleGold from "data-base64:~assets/ambient/ambient-sparkle-gold.png"
import ribbonBlue from "data-base64:~assets/ambient/ribbon-curve-blue.png"
import ribbonLarge from "data-base64:~assets/ambient/ribbon-curve-lg.png"

export const config: PlasmoCSConfig = {
    matches: ["https://www.amazon.com/*"],
    run_at: "document_idle",
    world: "MAIN",
    all_frames: false
}

console.log("🎁 Amazon Wrapped content script loaded")

// Inject CSS manually for MAIN world
const injectStyles = () => {
    const styleId = "amazon-wrapped-styles"
    if (document.getElementById(styleId)) return // Already injected

    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
    /* Amazon Wrapped Container - holds backdrop and content */
    .amazon-wrapped-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
    }

    /* Backdrop overlay - separate layer with opacity */
    .amazon-wrapped-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw !important;
      height: 100vh !important;
      z-index: -1;
      backdrop-filter: blur(12px) saturate(0.8);
      -webkit-backdrop-filter: blur(12px) saturate(0.8);
      pointer-events: auto;
      cursor: pointer;
    }

    /* Content wrapper - sits above backdrop with full opacity */
    .amazon-wrapped-content-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      cursor: pointer;
    }

    /* Allow clicks on the slide itself */
    .amazon-wrapped-slide {
      pointer-events: auto;
      width: 90vw;
      max-width: 500px;
      height: 85vh;
      max-height: 700px;
      border-radius: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      box-shadow: 
        0 30px 80px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
      z-index: 1000001;
    }

    /* Add a subtle gradient overlay for depth */
    .amazon-wrapped-slide::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Close Button */
    .amazon-wrapped-close {
      position: absolute;
      top: 30px;
      right: 30px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      color: white;
      font-size: 28px;
      cursor: pointer;
      z-index: 10;
      transition: all 0.3s ease;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .amazon-wrapped-close:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: rotate(90deg);
      border-color: rgba(255, 255, 255, 0.4);
    }

    /* Large Stat Number */
    .amazon-wrapped-stat {
      font-size: 140px;
      font-weight: 900;
      color: white;
      margin-bottom: 20px;
      text-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 8px 40px rgba(0, 0, 0, 0.2);
      line-height: 1;
      letter-spacing: -0.02em;
      position: relative;
      z-index: 1;
    }

    /* Smaller stat for long numbers */
    .amazon-wrapped-stat-small {
      font-size: 100px;
      font-weight: 900;
      color: white;
      margin-bottom: 20px;
      text-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 8px 40px rgba(0, 0, 0, 0.2);
      line-height: 1;
      letter-spacing: -0.02em;
      position: relative;
      z-index: 1;
    }

    /* Title */
    .amazon-wrapped-title {
      font-size: 52px;
      font-weight: 800;
      color: white;
      margin: 20px 0;
      text-align: center;
      text-shadow: 
        0 2px 10px rgba(0, 0, 0, 0.3),
        0 4px 20px rgba(0, 0, 0, 0.2);
      line-height: 1.1;
      letter-spacing: -0.01em;
      position: relative;
      z-index: 1;
    }

    /* Subtitle */
    .amazon-wrapped-subtitle {
      font-size: 26px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin: 15px 0;
      text-align: center;
      max-width: 85%;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
      line-height: 1.3;
    }

    /* Subtext - minor commentary */
    .amazon-wrapped-subtext {
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.75);
      margin: 8px 0;
      text-align: center;
      max-width: 85%;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
      line-height: 1.4;
    }

    /* Detail Text */
    .amazon-wrapped-detail {
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
      margin: 15px 0 10px 0;
      text-align: center;
      max-width: 90%;
      font-style: italic;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
      line-height: 1.4;
    }

    /* Product Image */
    .amazon-wrapped-image {
      width: 300px;
      height: 200px;
      object-fit: cover;
      border-radius: 20px;
      margin: 20px 0;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      position: relative;
      z-index: 1;
    }

    /* Progress Dots */
    .amazon-wrapped-progress {
      display: flex;
      gap: 14px;
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
    }

    .amazon-wrapped-progress-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .amazon-wrapped-progress-dot.active {
      background: white;
      width: 14px;
      height: 14px;
      box-shadow: 
        0 0 0 4px rgba(255, 255, 255, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .amazon-wrapped-progress-dot.completed {
      background: rgba(255, 255, 255, 0.7);
      transform: scale(0.9);
    }

    /* Hint Text */
    .amazon-wrapped-hint {
      position: absolute;
      bottom: 35px;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    /* Trigger Button */
    .amazon-wrapped-trigger {
      position: fixed;
      bottom: 30px;
      right: 30px;
      padding: 18px 32px;
      background: linear-gradient(135deg, #FF9900 0%, #FF6B00 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 
        0 10px 30px rgba(255, 153, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      z-index: 999998;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      letter-spacing: 0.3px;
    }

    .amazon-wrapped-trigger:hover {
      box-shadow: 
        0 15px 40px rgba(255, 153, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }

    .amazon-wrapped-trigger:active {
      transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .amazon-wrapped-slide {
        width: 95vw;
        height: 90vh;
        padding: 50px 30px;
        border-radius: 20px;
      }

      .amazon-wrapped-stat {
        font-size: 100px;
      }

      .amazon-wrapped-title {
        font-size: 42px;
      }

      .amazon-wrapped-subtitle {
        font-size: 22px;
      }

      .amazon-wrapped-detail {
        font-size: 18px;
      }

      .amazon-wrapped-close {
        top: 20px;
        right: 20px;
        width: 45px;
        height: 45px;
        font-size: 24px;
      }

      .amazon-wrapped-trigger {
        bottom: 20px;
        right: 20px;
        padding: 16px 28px;
        font-size: 15px;
      }
    }

    /* Ensure it doesn't interfere with Amazon's styles */
    #amazon-wrapped-root * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    }

    /* Ambient animations container */
    .ambient-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1000002;
      overflow: hidden;
    }

    /* Falling snow */
    .snow-flake {
      position: absolute;
      width: 30px;
      height: 30px;
      opacity: 0;
      animation: snow-fall linear forwards;
    }

    @keyframes snow-fall {
      0% {
        transform: translateY(-100px) translateX(0) rotate(0deg);
        opacity: 0.8;
      }
      100% {
        transform: translateY(100vh) translateX(var(--drift)) rotate(360deg);
        opacity: 0.3;
      }
    }

    /* Sparkling gold - fade in/out randomly */
    .sparkle {
      position: absolute;
      width: 40px;
      height: 40px;
      opacity: 0;
      animation: sparkle-twinkle 3s ease-in-out infinite;
    }

    @keyframes sparkle-twinkle {
      0%, 100% {
        opacity: 0;
        transform: scale(0.5) rotate(0deg);
      }
      50% {
        opacity: 1;
        transform: scale(1.2) rotate(180deg);
      }
    }

    /* Ribbon animations - wind effect */
    .ribbon {
      position: absolute;
      pointer-events: none;
      animation: ribbon-sway ease-in-out infinite;
    }

    .ribbon-blue {
      width: 150px;
      height: auto;
    }

    .ribbon-large {
      width: 200px;
      height: auto;
    }

    @keyframes ribbon-sway {
      0%, 100% {
        transform: translateX(0) translateY(0) rotate(0deg);
      }
      25% {
        transform: translateX(15px) translateY(-10px) rotate(5deg);
      }
      50% {
        transform: translateX(0) translateY(-15px) rotate(0deg);
      }
      75% {
        transform: translateX(-15px) translateY(-10px) rotate(-5deg);
      }
    }

    /* Delivery message */
    .amazon-wrapped-delivery {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000003;
      text-align: center;
      cursor: pointer;
      pointer-events: auto;
    }

    .delivery-box {
      font-size: 120px;
      animation: box-bounce 1s ease-in-out infinite;
      margin-bottom: 30px;
    }

    @keyframes box-bounce {
      0%, 100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-20px) scale(1.1);
      }
    }

    .delivery-message {
      font-size: 36px;
      font-weight: 800;
      color: white;
      text-shadow: 
        0 2px 10px rgba(0, 0, 0, 0.5),
        0 4px 20px rgba(0, 0, 0, 0.3);
      margin-bottom: 15px;
      animation: message-fade-in 0.5s ease-out 0.5s forwards;
      opacity: 0;
    }

    .delivery-cta {
      font-size: 20px;
      font-weight: 600;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      animation: message-fade-in 0.5s ease-out 1s forwards;
      opacity: 0;
      padding: 12px 24px;
      background: linear-gradient(135deg, #FF9900 0%, #FF6B00 100%);
      border-radius: 25px;
      display: inline-block;
      border: 2px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(255, 153, 0, 0.4);
    }

    .delivery-cta:hover {
      background: linear-gradient(135deg, #FFB020 0%, #FF7B10 100%);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.05);
      box-shadow: 0 10px 25px rgba(255, 153, 0, 0.5);
    }

    @keyframes message-fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
    document.head.appendChild(style)
}

// Inject styles immediately
injectStyles()


// Main Wrapped Component
const AmazonWrapped = ({onClose}: { onClose: () => void }) => {
    const [currentSlide, setCurrentSlide] = React.useState(0)
    const [showDelivery, setShowDelivery] = React.useState(true)

    const slides = [
        // ...existing code...
        {
            title: "Your 2025 Amazon Year",
            subtitle: "Let's look back at your shopping journey",
            color: "#FF9900",
            backgroundImage: slide1Bg
        },
        {
            subtitle: "You ordered 354 items this year",
            subtext: "That's almost one a day ya lil shopping freak!",
            stat: "354",
            color: "#146EB4",
            backgroundImage: slide2Bg
        },
        {
            subtitle: "Total Spent on Amazon in 2025",
            subtext: "That's higher than the average individual US wage, ok money-bags!",
            stat: "$77,526",
            statSize: "small",
            color: "#232F3E",
            backgroundImage: slide3Bg
        },
        {
            title: "Your Top Category",
            subtitle: "Tools & Home Improvement",
            subtext: "You really love building things!",
            color: "#FF9900",
            backgroundImage: slide4Bg
        },
        {
            title: "Most Ordered Item",
            subtitle: "VEVOR Cast Iron Anvil",
            subtext: "Ordered 354 times this year!",
            image: anvilImage,
            detail: "Wow! That's dedication!",
            color: "#146EB4",
            backgroundImage: slide5Bg
        },
        {
            title: "Most Returned Item",
            subtitle: "VEVOR Cast Iron Anvil",
            subtext: "Returned 354 times this year!",
            image: anvilImage,
            detail: "Wait a sec- are you just ordering and returning the same anvil over and over?",
            color: "#232F3E",
            backgroundImage: slide6Bg
        },
        {
            title: "That's a wrap!",
            subtitle: "Thanks for shopping with Amazon in 2025",
            color: "#FF9900",
            backgroundImage: slide7Bg
        }
    ]

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            onClose()
        }
    }

    const startSlideshow = () => {
        setShowDelivery(false)
    }

    // Generate falling snow
    const generateSnow = () => {
        const snowFlakes = []

        for (let i = 0; i < 50; i++) {
            const left = Math.random() * 100
            const delay = Math.random() * 5
            const duration = 8 + Math.random() * 4
            const drift = (Math.random() - 0.5) * 100 // Random horizontal drift

            snowFlakes.push(
                <img
                    key={`snow-${i}`}
                    src={snowLight}
                    alt=""
                    className="snow-flake"
                    style={{
                        left: `${left}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`,
                        '--drift': `${drift}px`
                    } as React.CSSProperties}
                />
            )
        }

        return snowFlakes
    }

    // Generate sparkles that appear and disappear
    const generateSparkles = () => {
        const sparkles = []

        for (let i = 0; i < 15; i++) {
            const left = Math.random() * 90 + 5 // 5-95%
            const top = Math.random() * 90 + 5 // 5-95%
            const delay = Math.random() * 3
            const duration = 2 + Math.random() * 2

            sparkles.push(
                <img
                    key={`sparkle-${i}`}
                    src={sparkleGold}
                    alt=""
                    className="sparkle"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`
                    }}
                />
            )
        }

        return sparkles
    }

    // Generate wind-blown ribbons
    const generateRibbons = () => {
        const ribbons = []

        // Blue ribbon positions
        const bluePositions = [
            { left: '10%', top: '15%' },
            { left: '85%', top: '25%' },
            { left: '15%', top: '70%' }
        ]

        // Large ribbon positions
        const largePositions = [
            { left: '75%', top: '60%' },
            { left: '5%', top: '45%' }
        ]

        bluePositions.forEach((pos, i) => {
            ribbons.push(
                <img
                    key={`ribbon-blue-${i}`}
                    src={ribbonBlue}
                    alt=""
                    className="ribbon ribbon-blue"
                    style={{
                        left: pos.left,
                        top: pos.top,
                        animationDuration: `${4 + Math.random() * 2}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            )
        })

        largePositions.forEach((pos, i) => {
            ribbons.push(
                <img
                    key={`ribbon-large-${i}`}
                    src={ribbonLarge}
                    alt=""
                    className="ribbon ribbon-large"
                    style={{
                        left: pos.left,
                        top: pos.top,
                        animationDuration: `${5 + Math.random() * 2}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            )
        })

        return ribbons
    }

    // React.useEffect(() => {
    //   // Auto-advance slides after 3 seconds
    //   const timer = setTimeout(nextSlide, 3000)
    //   return () => clearTimeout(timer)
    // }, [currentSlide])

    const slide = slides[currentSlide]

    return (
        <div className="amazon-wrapped-container">
            {/* Ambient animations */}
            {!showDelivery && (
                <div className="ambient-container">
                    {generateSnow()}
                    {generateSparkles()}
                    {generateRibbons()}
                </div>
            )}

            {/* Delivery message */}
            {showDelivery && (
                <motion.div
                    className="amazon-wrapped-delivery"
                    onClick={startSlideshow}
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.5}}
                >
                    <div className="delivery-box">📦</div>
                    <div className="delivery-message">Your 2025 Amazon Wrapped</div>
                    <div className="delivery-message">has been delivered!</div>
                    <div className="delivery-cta">Unwrap</div>
                </motion.div>
            )}

            {/* Backdrop overlay - separate from content */}
            <motion.div
                className="amazon-wrapped-backdrop"
                style={{backgroundColor: "black", opacity: .5, width: "100vw", height: "100vh"}}
                initial={{opacity: 0}}
                animate={{opacity: .5}}
                exit={{opacity: 0}}
                onClick={showDelivery ? startSlideshow : nextSlide}
            />

            {/* Content wrapper - full opacity */}
            {!showDelivery && (
                <div className="amazon-wrapped-content-wrapper" onClick={nextSlide}>
                    <motion.div
                        className="amazon-wrapped-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                    >
                        ✕
                    </motion.div>

                    <motion.div
                        key={currentSlide}
                        className="amazon-wrapped-slide"
                        style={{
                            backgroundColor: slide.color,
                            backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                        initial={{scale: 0.8, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        exit={{scale: 1.2, opacity: 0}}
                        transition={{duration: 0.5}}
                    >
                        {/* ...existing slide content... */}
                        {slide.stat && (
                            <motion.div
                                className={slide.statSize === "small" ? "amazon-wrapped-stat-small" : "amazon-wrapped-stat"}
                                initial={{y: 50, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.2}}
                            >
                                {slide.stat}
                            </motion.div>
                        )}

                        <motion.h1
                            className="amazon-wrapped-title"
                            initial={{y: 30, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.3}}
                        >
                            {slide.title}
                        </motion.h1>

                        <motion.p
                            className="amazon-wrapped-subtitle"
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.4}}
                        >
                            {slide.subtitle}
                        </motion.p>

                        {slide.subtext && (
                            <motion.p
                                className="amazon-wrapped-subtext"
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.45}}
                            >
                                {slide.subtext}
                            </motion.p>
                        )}

                        {slide.image && (
                            <motion.img
                                src={slide.image}
                                alt="Product"
                                className="amazon-wrapped-image"
                                initial={{scale: 0.8, opacity: 0}}
                                animate={{scale: 1, opacity: 1}}
                                transition={{delay: 0.5}}
                            />
                        )}

                        {slide.detail && (
                            <motion.p
                                className="amazon-wrapped-detail"
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.5}}
                            >
                                {slide.detail}
                            </motion.p>
                        )}

                        <div className="amazon-wrapped-progress">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    className={`amazon-wrapped-progress-dot ${
                                        index === currentSlide ? "active" : ""
                                    } ${index < currentSlide ? "completed" : ""}`}
                                />
                            ))}
                        </div>

                        <p className="amazon-wrapped-hint">Click or wait to continue</p>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

// Trigger button component
const WrappedTrigger = ({onClick}: { onClick: () => void }) => {
    return (
        <motion.button
            className="amazon-wrapped-trigger"
            onClick={onClick}
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{delay: 1, type: "spring"}}
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
        >
            🎁 Your 2025 Amazon Wrapped
        </motion.button>
    )
}

// Main App Component - Export as default for Plasmo
const AmazonWrappedApp = () => {
    const [showWrapped, setShowWrapped] = React.useState(true)

    return (
        <React.Fragment>
            <AnimatePresence>
                {showWrapped && <AmazonWrapped onClose={() => setShowWrapped(false)}/>}
            </AnimatePresence>
            {!showWrapped && <WrappedTrigger onClick={() => setShowWrapped(true)}/>}
        </React.Fragment>
    )
}

// Manual injection for MAIN world
const injectWrapped = () => {
    // Only inject on the root Amazon page (homepage)
    const shouldInject = window.location.pathname === "/"

    if (!shouldInject || window.self !== window.top) return

    // Create container
    const container = document.createElement("div")
    container.id = "amazon-wrapped-root"
    document.body.appendChild(container)

    // Render React component
    const root = createRoot(container)
    root.render(React.createElement(AmazonWrappedApp))
}

// Wait for page to be ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectWrapped)
} else {
    injectWrapped()
}

// Don't export default - it causes double rendering in MAIN world
// Plasmo uses the config export for MAIN world scripts

