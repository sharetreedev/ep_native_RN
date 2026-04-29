import { motion } from 'motion/react';
import { X, ChevronLeft } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

const emotionZones = {
  topLeft: {
    base: '#C85A3E',
    emotions: [
      { name: 'Enraged', color: '#C85A3E' },
      { name: 'Angry', color: '#E89B88' },
      { name: 'Overwhelmed', color: '#D87B6A' },
      { name: 'Strained', color: '#F5C4B8' }
    ]
  },
  topRight: {
    base: '#6BB169',
    emotions: [
      { name: 'Excited', color: '#9FD89D' },
      { name: 'Ecstatic', color: '#6BB169' },
      { name: 'Engaged', color: '#A8D9A6' },
      { name: 'Happy', color: '#8BC989' }
    ]
  },
  bottomLeft: {
    base: '#888888',
    emotions: [
      { name: 'Anxious', color: '#B0B0B0' },
      { name: 'Flat', color: '#C8C8C8' },
      { name: 'Depressed', color: '#7A7A7A' },
      { name: 'Sad', color: '#A0A0A0' }
    ]
  },
  bottomRight: {
    base: '#7BA8C4',
    emotions: [
      { name: 'Reflective', color: '#A5C9DD' },
      { name: 'Content', color: '#92B8D1' },
      { name: 'Calm', color: '#6B9BB8' },
      { name: 'Blissful', color: '#5A8CAF' }
    ]
  }
};

export default function UserProfile({ onClose }: UserProfileProps) {
  const currentEmotion = 'Engaged';
  const userName = 'Alex Chen';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-[#FAFAF9] z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </button>
        <button
          onClick={onClose}
          className="p-2 -mr-2 hover:opacity-70 transition-opacity"
        >
          <X size={24} color="#1A1A1A" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 pt-4 pb-8 flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white mb-4"
          style={{
            backgroundColor: '#6BB169',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '32px'
          }}
        >
          AC
        </div>

        {/* User Name */}
        <h2
          className="text-2xl mb-3"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            color: '#1A1A1A'
          }}
        >
          {userName}
        </h2>

        {/* Current Emotion */}
        <p
          className="text-xl"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: '#666666'
          }}
        >
          I'm feeling, <span style={{ color: '#6BB169', fontStyle: 'italic' }}>{currentEmotion}</span>
        </p>
      </div>

      {/* Emotion Map */}
      <div className="px-6 pb-8">
        <h3
          className="text-base mb-4 uppercase tracking-wide"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            color: '#999999',
            letterSpacing: '0.1em'
          }}
        >
          Emotional Spectrum
        </h3>

        <div className="grid grid-cols-4 gap-2 aspect-square max-w-[400px] mx-auto">
          {/* Top Left Quadrant - Red/Orange */}
          {emotionZones.topLeft.emotions.map((emotion, index) => (
            <motion.div
              key={`tl-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl flex items-center justify-center text-center p-3 cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: emotion.color,
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {emotion.name}
            </motion.div>
          ))}

          {/* Top Right Quadrant - Green */}
          {emotionZones.topRight.emotions.map((emotion, index) => (
            <motion.div
              key={`tr-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 4) * 0.05 }}
              className="rounded-2xl flex items-center justify-center text-center p-3 cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: emotion.color,
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {emotion.name}
            </motion.div>
          ))}

          {/* Bottom Left Quadrant - Gray */}
          {emotionZones.bottomLeft.emotions.map((emotion, index) => (
            <motion.div
              key={`bl-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 8) * 0.05 }}
              className="rounded-2xl flex items-center justify-center text-center p-3 cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: emotion.color,
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {emotion.name}
            </motion.div>
          ))}

          {/* Bottom Right Quadrant - Blue */}
          {emotionZones.bottomRight.emotions.map((emotion, index) => (
            <motion.div
              key={`br-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 12) * 0.05 }}
              className="rounded-2xl flex items-center justify-center text-center p-3 cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: emotion.color,
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {emotion.name}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-[400px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C85A3E' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#666666' }}>
              High Energy, Unpleasant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6BB169' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#666666' }}>
              High Energy, Pleasant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#888888' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#666666' }}>
              Low Energy, Unpleasant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7BA8C4' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#666666' }}>
              Low Energy, Pleasant
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
