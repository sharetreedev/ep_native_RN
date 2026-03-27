export type StateCoordinate = {
    id: number;
    emotion_state_id: number;
    x: number;
    y: number;
    label: string;
};

export type Emotion = {
    id: string;
    name: string;
    color: string;
    quadrant: 'enraged' | 'angry' | 'excited' | 'ecstatic' | 'overwhelmed' | 'strained' | 'engaged' | 'happy' | 'anxious' | 'flat' | 'reflective' | 'content' | 'depressed' | 'sad' | 'calm' | 'blissful';
    energy: 'high' | 'low';
    pleasantness: 'high' | 'low';
    row: number;
    col: number;
    description: string;
    regulationStrategy: string;
};

export const EMOTIONS: Emotion[] = [
    // Top Row (High Energy)
    {
        id: 'enraged',
        name: 'Enraged',
        color: 'bg-emotional-enraged',
        quadrant: 'enraged',
        energy: 'high',
        pleasantness: 'low',
        row: 0,
        col: 0,
        description: 'Intense anger that feels uncontrollable. Your body might feel hot, tense, or ready to explode.',
        regulationStrategy: 'Remove yourself from the situation immediately. Splash cold water on your face or do intense exercise to burn off the energy.'
    },
    {
        id: 'angry',
        name: 'Angry',
        color: 'bg-emotional-angry',
        quadrant: 'angry',
        energy: 'high',
        pleasantness: 'low',
        row: 0,
        col: 1,
        description: 'Feeling mad or frustrated. You might have a strong urge to speak up or fight back.',
        regulationStrategy: 'Take deep, slow breaths. Count to ten before reacting. Write down what is making you angry.'
    },
    {
        id: 'excited',
        name: 'Excited',
        color: 'bg-emotional-excited',
        quadrant: 'excited',
        energy: 'high',
        pleasantness: 'high',
        row: 0,
        col: 2,
        description: 'High energy and positive anticipation. You feel ready to take action and engage.',
        regulationStrategy: 'Channel this energy into a productive task or share your enthusiasm with others.'
    },
    {
        id: 'ecstatic',
        name: 'Ecstatic',
        color: 'bg-emotional-ecstatic',
        quadrant: 'ecstatic',
        energy: 'high',
        pleasantness: 'high',
        row: 0,
        col: 3,
        description: 'Overwhelming joy and delight. You feel on top of the world.',
        regulationStrategy: 'Savor the moment! Share your joy, but be mindful that this high energy state is temporary.'
    },

    // Second Row
    {
        id: 'overwhelmed',
        name: 'Overwhelmed',
        color: 'bg-emotional-overwhelmed',
        quadrant: 'overwhelmed',
        energy: 'high',
        pleasantness: 'low',
        row: 1,
        col: 0,
        description: 'Feeling like there is too much to handle. Your mind might be racing.',
        regulationStrategy: 'Stop single-tasking. Pick one small thing to do, complete it, and then pick the next. Focus on your breath.'
    },
    {
        id: 'strained',
        name: 'Strained',
        color: 'bg-emotional-strained',
        quadrant: 'strained',
        energy: 'high',
        pleasantness: 'low',
        row: 1,
        col: 1,
        description: 'Feeling pressured or tense, but not quite breaking point. You are holding it together, but it takes effort.',
        regulationStrategy: 'Take a short break. Stretch your body. Ask for help if you have too much on your plate.'
    },
    {
        id: 'engaged',
        name: 'Engaged',
        color: 'bg-emotional-engaged',
        quadrant: 'engaged',
        energy: 'high',
        pleasantness: 'high',
        row: 1,
        col: 2,
        description: 'Feeling interested and involved. You are focused and present in what you are doing.',
        regulationStrategy: 'Maintain this flow state by minimizing distractions. This is a great state for work or hobbies.'
    },
    {
        id: 'happy',
        name: 'Happy',
        color: 'bg-emotional-happy',
        quadrant: 'happy',
        energy: 'high',
        pleasantness: 'high',
        row: 1,
        col: 3,
        description: 'Generaly feeling good and positive. Life feels manageable and pleasant.',
        regulationStrategy: 'Practice gratitude. Notice what is going well and appreciate it.'
    },

    // Third Row
    {
        id: 'anxious',
        name: 'Anxious',
        color: 'bg-emotional-anxious',
        quadrant: 'anxious',
        energy: 'low',
        pleasantness: 'low',
        row: 2,
        col: 0,
        description: 'Feeling worried or uneasy about something. Your stomach might feel tight.',
        regulationStrategy: 'Focus on what you can control. Ground yourself by naming 5 things you can see, 4 you can touch, etc.'
    },
    {
        id: 'flat',
        name: 'Flat',
        color: 'bg-emotional-flat',
        quadrant: 'flat',
        energy: 'low',
        pleasantness: 'low',
        row: 2,
        col: 1,
        description: 'Feeling indifferent or lacking energy. Not necessarily sad, just "blah".',
        regulationStrategy: 'Try gentle movement like a walk. Listen to some music that usually lifts your spirits.'
    },
    {
        id: 'reflective',
        name: 'Reflective',
        color: 'bg-emotional-reflective',
        quadrant: 'reflective',
        energy: 'low',
        pleasantness: 'high',
        row: 2,
        col: 2,
        description: 'Thinking deeply and calmly. You are looking inward.',
        regulationStrategy: 'Journal your thoughts. Ensure you don\'t get stuck in overthinking – balance reflection with action.'
    },
    {
        id: 'content',
        name: 'Content',
        color: 'bg-emotional-content',
        quadrant: 'content',
        energy: 'low',
        pleasantness: 'high',
        row: 2,
        col: 3,
        description: 'Feeling at peace with how things are. You don\'t need anything to change right now.',
        regulationStrategy: 'Enjoy this peaceful state. It is a great place to rest and recharge.'
    },

    // Bottom Row (Low Energy)
    {
        id: 'depressed',
        name: 'Depressed',
        color: 'bg-emotional-depressed',
        quadrant: 'depressed',
        energy: 'low',
        pleasantness: 'low',
        row: 3,
        col: 0,
        description: 'Feeling very low, hopeless, or empty. It feels hard to do anything.',
        regulationStrategy: 'Be very gentle with yourself. Do one tiny thing, like drinking a glass of water or sitting outside. Reach out to a support person.'
    },
    {
        id: 'sad',
        name: 'Sad',
        color: 'bg-emotional-sad',
        quadrant: 'sad',
        energy: 'low',
        pleasantness: 'low',
        row: 3,
        col: 1,
        description: 'Feeling unhappy or sorrowful. You might feel like crying.',
        regulationStrategy: 'Allow yourself to cry if you need to. It releases stress. Talk to a friend or write about your feelings.'
    },
    {
        id: 'calm',
        name: 'Calm',
        color: 'bg-emotional-calm',
        quadrant: 'calm',
        energy: 'low',
        pleasantness: 'high',
        row: 3,
        col: 2,
        description: 'Feeling relaxed and peaceful. Your body feels loose and easy.',
        regulationStrategy: 'Deepen this relaxation with deep breathing or meditation. This is the optimal state for recovery.'
    },
    {
        id: 'blissful',
        name: 'Blissful',
        color: 'bg-emotional-blissful',
        quadrant: 'blissful',
        energy: 'low',
        pleasantness: 'high',
        row: 3,
        col: 3,
        description: 'Deep, quiet happiness and peace. You feel totally at ease.',
        regulationStrategy: 'Bask in this feeling. It helps build resilience for harder times.'
    },
];

export function findEmotionAtCoordinate(row: number, col: number): Emotion | undefined {
    return EMOTIONS.find(e => e.row === row && e.col === col);
}
