export const COLORS = {
    RED: '#EF4444',
    BLUE: '#3B82F6',
    GREEN: '#22C55E',
    YELLOW: '#EAB308',
    PURPLE: '#A855F7',
    ORANGE: '#F97316',
    BROWN: '#A0522D',
  };
  
  export const COLOR_NAMES = Object.keys(COLORS);
  
  export const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * COLOR_NAMES.length);
    return COLOR_NAMES[randomIndex];
  };
  
  type ButtonState = {
    word: string;
    color: string;
  } | null;
  
  export const generateNewRound = () => {
    // Select random word and color for the target
    const word = getRandomColor();
    let displayColor;
    do {
      displayColor = getRandomColor();
    } while (displayColor === word);
  
    // Keep track of used colors to prevent duplicates
    const usedColors = new Set([displayColor]);
  
    // Create array with the correct answer first
    let correctOptionColor;
    do {
      correctOptionColor = getRandomColor();
    } while (correctOptionColor === displayColor || correctOptionColor === word); // Ensure the color isn't the same as the word
  
    const options: { word: string; color: string }[] = [
      {
        word: displayColor, // The word should be the target color (correct answer)
        color: correctOptionColor // This can be any color except the word's actual color
      }
    ];
    usedColors.add(correctOptionColor);
  
    // Add two random incorrect options
    while (options.length < 3) {
      let newWord: string, newColor: string;
      
      do {
        newWord = getRandomColor();
        do {
          newColor = getRandomColor();
        } while (
          usedColors.has(newColor) || 
          newColor === newWord // Ensure the color isn't the same as the word
        );
      } while (
        newWord === displayColor || 
        options.some(opt => opt.word === newWord)
      );
  
      options.push({
        word: newWord,
        color: newColor,
      });
      usedColors.add(newColor);
    }
  
    // Rest of the function remains the same
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
    const positions = Array.from({ length: 9 }, (_, i) => i);
    const selectedPositions = [];
    
    while (selectedPositions.length < 3) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      selectedPositions.push(positions.splice(randomIndex, 1)[0]);
    }
  
    const newButtonStates: ButtonState[] = Array(9).fill(null);
    selectedPositions.forEach((position, index) => {
      newButtonStates[position] = shuffledOptions[index];
    });
  
    return {
      targetWord: word,
      targetColor: displayColor,
      buttonStates: newButtonStates
    };
  };
  
  export const checkAnswer = (clickedWord: string, targetColor: string) => {
    return clickedWord === targetColor;
  };