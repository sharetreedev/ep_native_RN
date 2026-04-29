import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  MoveRight,
  ChevronUp,
  ChevronRight,
  Home,
  Activity,
  HandHeart,
  Bell,
  AlertTriangle,
  User,
  GraduationCap,
} from "lucide-react";
import UserProfile from "./components/UserProfile";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Mock data
const currentEmotion = {
  name: "Engaged",
  color: "#6BB169",
  trend: "up" as "up" | "down" | "neutral",
};

const actions = [
  {
    id: 1,
    mainText: "Check In with Sarah",
    subText: "Sarah hasn't checked in within 7 days",
    action: "Check In",
    bgColor: "#9B86BD",
    icon: "user",
  },
  {
    id: 2,
    mainText: "New Support Request",
    subText: "Someone in your network has requested support",
    action: "Respond",
    bgColor: "#F5A864",
    icon: "alert",
  },
  {
    id: 3,
    mainText: "Do your daily mini course",
    subText: "Start Lesson #3",
    action: "Start",
    bgColor: "#91A27D",
    icon: "graduation",
  },
];

const pairs = [
  {
    id: 1,
    name: "Emma",
    initials: "ER",
    emotion: "Calm",
    emotionColor: "#7BA8C4",
    movingTowards: "Blissful",
    trend: "up" as "up" | "down" | "neutral",
    avatarColor: "#7BA8C4",
  },
  {
    id: 2,
    name: "Marcus",
    initials: "MK",
    emotion: "Excited",
    emotionColor: "#9FD89D",
    movingTowards: "Ecstatic",
    trend: "up" as "up" | "down" | "neutral",
    avatarColor: "#9FD89D",
  },
  {
    id: 3,
    name: "Zara",
    initials: "ZT",
    emotion: "Content",
    emotionColor: "#92B8D1",
    movingTowards: "Happy",
    trend: "neutral" as "up" | "down" | "neutral",
    avatarColor: "#92B8D1",
  },
];

const groups = [
  {
    id: 1,
    name: "Wellness Warriors",
    initials: "WW",
    emotion: "Engaged",
    emotionColor: "#6BB169",
    movingTowards: "Ecstatic",
    trend: "up" as "up" | "down" | "neutral",
    avatarColor: "#6BB169",
    members: 8,
  },
  {
    id: 2,
    name: "Mindful Mondays",
    initials: "MM",
    emotion: "Reflective",
    emotionColor: "#A5C9DD",
    movingTowards: "Content",
    trend: "up" as "up" | "down" | "neutral",
    avatarColor: "#A5C9DD",
    members: 12,
  },
  {
    id: 3,
    name: "Support Circle",
    initials: "SC",
    emotion: "Happy",
    emotionColor: "#8BC989",
    movingTowards: "Excited",
    trend: "neutral" as "up" | "down" | "neutral",
    avatarColor: "#8BC989",
    members: 6,
  },
];

const TrendIcon = ({
  trend,
}: {
  trend: "up" | "down" | "neutral";
}) => {
  const Icon =
    trend === "up"
      ? ArrowUp
      : trend === "down"
        ? ArrowDown
        : ArrowRight;
  return <Icon size={28} strokeWidth={2.5} />;
};

const carouselSlides = [
  {
    id: "current",
    title: "My Last Check In",
    prefix: "I'm feeling,",
    emotion: currentEmotion.name,
    trend: currentEmotion.trend,
    movingTowards: "Active & Flow",
    baseColor: "#E89B88",
    movingColor1: currentEmotion.color,
    movingColor2: currentEmotion.color,
    emotionColor: currentEmotion.color,
    movingTowardsColor: "#6BB169",
  },
  {
    id: "7days",
    title: "Last 7 Days",
    prefix: "I've been feeling,",
    emotion: "Reflective",
    trend: "up" as const,
    movingTowards: "Calm & Content",
    baseColor: "#6BB169",
    movingColor1: "#6BB169",
    movingColor2: "#4A90E2",
    emotionColor: "#A5C9DD", // Changed from green to blue
    movingTowardsColor: "#4A90E2",
  },
  {
    id: "30days",
    title: "Last 30 Days",
    prefix: "I've been feeling,",
    emotion: "Calm",
    trend: "up" as const,
    movingTowards: "Active & Flow",
    baseColor: "#4A90E2",
    movingColor1: "#6BB169",
    movingColor2: "#4A90E2",
    emotionColor: "#4A90E2",
    movingTowardsColor: "#6BB169",
  },
];

const CarouselSlide = ({
  slide,
  isActive,
}: {
  slide: any;
  isActive: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    if (isActive) {
      setDisplayedText("");
      setShowArrow(false);
      let index = 0;
      const fullText = `${slide.prefix} ${slide.emotion}`;
      const timer = setInterval(() => {
        if (index <= fullText.length) {
          setDisplayedText(fullText.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
          setShowArrow(true);
        }
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayedText(`${slide.prefix} ${slide.emotion}`);
      setShowArrow(true);
    }
  }, [isActive, slide]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 px-4 w-full">
      <div className="flex flex-col items-center space-y-2 mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-body)",
            color: "#666666",
            fontWeight: 600,
            letterSpacing: "0.15em",
          }}
        >
          {slide.title}
        </span>
        {showArrow ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <div
              className="p-3 border-2"
              style={{
                borderRadius: "16px",
                borderColor: "rgba(0, 0, 0, 0.5)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendIcon trend={slide.trend} />
            </div>
          </motion.div>
        ) : (
          <div className="h-[56px]" /> // placeholder for icon
        )}
      </div>

      <h1
        className="text-[36px] tracking-tight leading-tight text-center whitespace-nowrap"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          color: "#1A1A1A",
        }}
      >
        {displayedText.split(",")[0]}
        {displayedText.includes(",") ? "," : ""}{" "}
        {displayedText.split(",")[1] && (
          <span
            className="shine-text"
            style={{
              color: slide.emotionColor,
              fontStyle: "italic",
              position: "relative",
              display: "inline-block",
            }}
          >
            {displayedText.split(",")[1].trim()}
          </span>
        )}
        {!showArrow && <span className="animate-pulse">|</span>}
      </h1>

      <p
        className="text-[24px] tracking-tight leading-tight text-center"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          color: "#666666",
        }}
      >
        moving towards{" "}
        <span
          style={{
            color:
              slide.movingTowardsColor || slide.emotionColor,
            fontStyle: "italic",
          }}
        >
          {slide.movingTowards}
        </span>
      </p>
    </div>
  );
};

export default function App() {
  const [activeSheet, setActiveSheet] = useState<
    "actions" | "pairs" | "groups" | null
  >(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = carouselSlides[activeSlideIndex];

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    beforeChange: (current: number, next: number) =>
      setActiveSlideIndex(next),
    appendDots: (dots: React.ReactNode) => (
      <ul className="slick-dots" style={{ bottom: "-50px" }}>
        {" "}
        {dots}{" "}
      </ul>
    ),
    customPaging: () => (
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      />
    ),
  };

  return (
    <div className="relative size-full overflow-y-auto bg-[#FAFAF9]">
      {/* Emotional Cloud - Aurora Effect Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Stable red-orange base layer */}
        <motion.div
          className="absolute left-0 top-1/4 w-[700px] h-[700px] rounded-full blur-3xl transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              ${activeSlide.baseColor}70 0%,
              ${activeSlide.baseColor}60 25%,
              ${activeSlide.baseColor}45 45%,
              ${activeSlide.baseColor}30 60%,
              transparent 75%)`,
          }}
          animate={{
            opacity: [0.6, 0.75, 0.65, 0.7, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Second stable red-orange layer */}
        <motion.div
          className="absolute right-0 bottom-1/4 w-[550px] h-[550px] rounded-full blur-2xl transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              ${activeSlide.baseColor}65 0%,
              ${activeSlide.baseColor}50 30%,
              ${activeSlide.baseColor}35 50%,
              transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 0.65, 0.55, 0.6, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Moving green layer 1 */}
        <motion.div
          className="absolute w-[750px] h-[750px] rounded-full blur-3xl transition-colors duration-1000"
          style={{
            background: `radial-gradient(ellipse at var(--gradient-x, 50%) var(--gradient-y, 50%),
              ${activeSlide.movingColor1}80 0%,
              ${activeSlide.movingColor1}70 25%,
              ${activeSlide.movingColor1}55 45%,
              ${activeSlide.movingColor1}40 60%,
              transparent 75%)`,
          }}
          animate={{
            "--gradient-x": [
              "50%",
              "35%",
              "65%",
              "30%",
              "70%",
              "45%",
              "50%",
            ],
            "--gradient-y": [
              "50%",
              "60%",
              "40%",
              "55%",
              "45%",
              "58%",
              "50%",
            ],
            x: [
              "-40%",
              "-20%",
              "-50%",
              "-30%",
              "-45%",
              "-25%",
              "-40%",
            ],
            y: [
              "-10%",
              "10%",
              "-20%",
              "0%",
              "-15%",
              "15%",
              "-10%",
            ],
            opacity: [0.7, 0.9, 0.75, 0.95, 0.8, 0.85, 0.7],
            scale: [1, 1.1, 0.98, 1.12, 1.05, 1.08, 1],
            rotate: [0, 5, -3, 8, -5, 3, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Moving green layer 2 */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-2xl transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              ${activeSlide.movingColor2}75 0%,
              ${activeSlide.movingColor2}60 30%,
              ${activeSlide.movingColor2}45 50%,
              transparent 70%)`,
          }}
          animate={{
            x: [
              "60%",
              "40%",
              "70%",
              "50%",
              "80%",
              "55%",
              "60%",
            ],
            y: [
              "40%",
              "50%",
              "30%",
              "55%",
              "35%",
              "60%",
              "40%",
            ],
            opacity: [0.6, 0.8, 0.65, 0.85, 0.7, 0.75, 0.6],
            scale: [1, 1.15, 0.95, 1.2, 1.05, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />

        {/* Moving green layer 3 */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle at 50% 50%,
              ${currentEmotion.color}70 0%,
              ${currentEmotion.color}50 35%,
              transparent 65%)`,
          }}
          animate={{
            x: ["20%", "0%", "30%", "10%", "35%", "5%", "20%"],
            y: [
              "60%",
              "70%",
              "50%",
              "75%",
              "55%",
              "80%",
              "60%",
            ],
            opacity: [0.5, 0.75, 0.6, 0.8, 0.65, 0.7, 0.5],
            rotate: [0, -5, 5, -3, 3, -2, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6,
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <h2
          className="text-lg"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "#1A1A1A",
          }}
        >
          My Pulse
        </h2>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:opacity-70 transition-opacity">
            <AlertTriangle
              size={22}
              color="#1A1A1A"
              strokeWidth={2}
            />
          </button>
          <button className="p-2 hover:opacity-70 transition-opacity">
            <Bell size={22} color="#1A1A1A" strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm"
            style={{
              backgroundColor: "#6BB169",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            AC
          </button>
        </div>
      </div>

      {/* Main Content - Carousel */}
      <motion.div
        className="relative flex flex-col z-10 pb-[280px]"
        animate={{ opacity: activeSheet ? 0.3 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Carousel Section */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 pt-10">
          <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
            <div className="w-full relative" style={{ paddingBottom: "62px" }}>
              <Slider {...sliderSettings}>
                {carouselSlides.map((slide, index) => (
                  <div key={slide.id} className="outline-none">
                    <CarouselSlide
                      slide={slide}
                      isActive={activeSlideIndex === index}
                    />
                  </div>
                ))}
              </Slider>
            </div>
            <div className="flex justify-center w-full">
              <button
                onClick={() => setShowProfile(true)}
                className="flex justify-center items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 bg-transparent"
                style={{
                  color: "#333333",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                My Trends →
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Check In Button - Above Cards */}
      <div className="fixed left-0 right-0 z-20 flex items-center justify-center w-full px-6" style={{ bottom: "calc(68px + 220px)" }}>
        <button
          className="w-full py-3 rounded-full transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: "#91A27D",
            color: "white",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            border: "1.5px solid #91A27D",
          }}
        >
          Check In
        </button>
      </div>

      {/* Bottom Stacked Containers (Apple Wallet Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-10 w-full flex flex-col items-center px-4" style={{ paddingBottom: "68px" }}>
        {/* Card 1: Things to do */}
        <div
          onClick={() => setActiveSheet("actions")}
          className="w-full bg-[#fbfbfb] rounded-t-[32px] pt-6 pb-6 px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] cursor-pointer transition-transform relative z-10"
          style={{
            borderTop: "1px solid rgba(0, 0, 0, 0.03)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-sm tracking-wide uppercase"
              style={{
                fontFamily: "var(--font-body)",
                color: "#333333",
                letterSpacing: "0.1em",
                fontWeight: 500,
              }}
            >
              Things to do {actions.length}
            </h3>
            <span
              className="text-sm opacity-60"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              View all
            </span>
          </div>
        </div>

        {/* Card 2: My Pairs */}
        <div
          onClick={() => setActiveSheet("pairs")}
          className="w-full bg-white rounded-t-[32px] pt-6 pb-6 px-6 shadow-[0_-12px_32px_rgba(0,0,0,0.08)] -mt-4 cursor-pointer relative z-20"
          style={{
            borderTop: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-sm tracking-wide uppercase"
              style={{
                fontFamily: "var(--font-body)",
                color: "#333333",
                letterSpacing: "0.1em",
                fontWeight: 500,
              }}
            >
              My Pairs
            </h3>
            <span
              className="text-sm opacity-60"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              View all
            </span>
          </div>
        </div>

        {/* Card 3: My Groups */}
        <div
          onClick={() => setActiveSheet("groups")}
          className="w-full bg-white rounded-t-[32px] pt-6 pb-10 px-6 shadow-[0_-16px_40px_rgba(0,0,0,0.10)] -mt-4 cursor-pointer relative z-30"
          style={{
            borderTop: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-sm tracking-wide uppercase"
              style={{
                fontFamily: "var(--font-body)",
                color: "#333333",
                letterSpacing: "0.1em",
                fontWeight: 500,
              }}
            >
              My Groups
            </h3>
            <span
              className="text-sm opacity-60"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              View all
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] z-40">
        <div className="flex items-center justify-around px-6 py-3">
          <button
            onClick={() => setActiveTab("home")}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
          >
            <Home
              size={24}
              strokeWidth={2}
              style={{
                color:
                  activeTab === "home" ? "#91A27D" : "#999999",
              }}
            />
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                color:
                  activeTab === "home" ? "#91A27D" : "#999999",
              }}
            >
              Home
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pulse")}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
          >
            <Activity
              size={24}
              strokeWidth={2}
              style={{
                color:
                  activeTab === "pulse" ? "#91A27D" : "#999999",
              }}
            />
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                color:
                  activeTab === "pulse" ? "#91A27D" : "#999999",
              }}
            >
              Pulse
            </span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
          >
            <HandHeart
              size={24}
              strokeWidth={2}
              style={{
                color:
                  activeTab === "support"
                    ? "#91A27D"
                    : "#999999",
              }}
            />
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                color:
                  activeTab === "support"
                    ? "#91A27D"
                    : "#999999",
              }}
            >
              Get Support
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Bottom Sheet */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setActiveSheet(null)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed inset-x-0 bottom-0 top-20 bg-[#FBFBFB] rounded-t-[32px] shadow-2xl overflow-y-auto z-50 flex flex-col"
            >
              {/* Close Handle */}
              <div
                className="flex justify-center pt-4 pb-2 sticky top-0 bg-[#FBFBFB] z-10"
                onClick={() => setActiveSheet(null)}
              >
                <button className="w-12 h-1.5 rounded-full bg-[#E5E5E5] cursor-pointer hover:bg-[#CCCCCC] transition-colors" />
              </div>

              {activeSheet === "actions" && (
                <div className="px-6 pb-8 pt-4">
                  <h2
                    className="text-xl mb-6"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      color: "#1A1A1A",
                    }}
                  >
                    Things to do
                  </h2>

                  <div className="space-y-4">
                    {actions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:opacity-90 bg-white"
                        style={{
                          border:
                            "1px solid rgba(0, 0, 0, 0.05)",
                          boxShadow:
                            "0 4px 12px rgba(0,0,0,0.02)",
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: action.bgColor,
                          }}
                        >
                          {action.icon === "user" && (
                            <User
                              size={22}
                              color="white"
                              strokeWidth={2}
                            />
                          )}
                          {action.icon === "alert" && (
                            <AlertTriangle
                              size={22}
                              color="white"
                              strokeWidth={2}
                            />
                          )}
                          {action.icon === "graduation" && (
                            <GraduationCap
                              size={22}
                              color="white"
                              strokeWidth={2}
                            />
                          )}
                        </div>

                        <div className="text-left flex-1">
                          <p
                            className="text-[18px] mb-1"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              color: action.bgColor,
                            }}
                          >
                            {action.mainText}
                          </p>
                          <p
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-body)",
                              color: "#666666",
                            }}
                          >
                            {action.subText}
                          </p>
                        </div>

                        {/* Action Button */}
                        <button
                          className="p-2 rounded-full transition-all hover:scale-105"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            flexShrink: 0,
                          }}
                        >
                          <ChevronRight
                            size={22}
                            color={action.bgColor}
                            strokeWidth={2.5}
                          />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSheet === "pairs" && (
                <div className="px-6 pb-24 pt-4">
                  <h2
                    className="text-xl mb-6"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      color: "#1A1A1A",
                    }}
                  >
                    My Pairs
                  </h2>

                  <div
                    className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 after:content-[''] after:w-4 after:flex-shrink-0"
                    style={{
                      scrollbarWidth: "none",
                    }}
                  >
                    {pairs.map((pair, index) => (
                      <motion.div
                        key={pair.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-shrink-0 w-[176px] p-5 rounded-[24px] bg-white"
                        style={{
                          border: "1px solid rgba(0, 0, 0, 0.05)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                            style={{
                              backgroundColor: pair.avatarColor,
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              fontSize: "14px",
                            }}
                          >
                            {pair.initials}
                          </div>
                          <div
                            className="p-1.5 border-2 rounded-xl"
                            style={{
                              borderColor: pair.emotionColor,
                            }}
                          >
                            {pair.trend === "up" && (
                              <ArrowUp
                                size={18}
                                color={pair.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                            {pair.trend === "down" && (
                              <ArrowDown
                                size={18}
                                color={pair.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                            {pair.trend === "neutral" && (
                              <ArrowRight
                                size={18}
                                color={pair.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                        </div>

                        <h4
                          className="text-[20px] mb-1 truncate"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "#1A1A1A",
                            fontWeight: 400,
                          }}
                        >
                          {pair.name}
                        </h4>
                        <p
                          className="text-sm mb-4 italic"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: pair.emotionColor,
                          }}
                        >
                          {pair.emotion}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSheet === "groups" && (
                <div className="px-6 pb-24 pt-4">
                  <h2
                    className="text-xl mb-6"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      color: "#1A1A1A",
                    }}
                  >
                    My Groups
                  </h2>

                  <div
                    className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 after:content-[''] after:w-4 after:flex-shrink-0"
                    style={{
                      scrollbarWidth: "none",
                    }}
                  >
                    {groups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-shrink-0 w-[176px] p-5 rounded-[24px] bg-white"
                        style={{
                          border: "1px solid rgba(0, 0, 0, 0.05)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                              style={{
                                backgroundColor: group.avatarColor,
                                fontFamily: "var(--font-body)",
                                fontWeight: 500,
                                fontSize: "14px",
                              }}
                            >
                              {group.initials}
                            </div>
                            <div
                              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full flex items-center justify-center gap-0.5 px-1.5 py-0.5 border border-black/5"
                              style={{
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                              }}
                            >
                              <User
                                size={10}
                                color="#666666"
                                strokeWidth={2.5}
                              />
                              <span
                                className="text-[10px]"
                                style={{
                                  fontFamily: "var(--font-body)",
                                  color: "#666666",
                                  fontWeight: 600,
                                  lineHeight: 1,
                                }}
                              >
                                {group.members}
                              </span>
                            </div>
                          </div>
                          <div
                            className="p-1.5 border-2 rounded-xl"
                            style={{
                              borderColor: group.emotionColor,
                            }}
                          >
                            {group.trend === "up" && (
                              <ArrowUp
                                size={18}
                                color={group.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                            {group.trend === "down" && (
                              <ArrowDown
                                size={18}
                                color={group.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                            {group.trend === "neutral" && (
                              <ArrowRight
                                size={18}
                                color={group.emotionColor}
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                        </div>

                        <h4
                          className="text-[20px] mb-1 truncate mt-2"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "#1A1A1A",
                            fontWeight: 400,
                          }}
                        >
                          {group.name}
                        </h4>
                        <p
                          className="text-sm mb-4 italic"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: group.emotionColor,
                          }}
                        >
                          {group.emotion}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Profile */}
      <AnimatePresence>
        {showProfile && (
          <UserProfile onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}