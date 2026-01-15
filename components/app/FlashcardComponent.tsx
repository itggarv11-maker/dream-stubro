import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

interface FlashcardComponentProps {
  flashcards: Flashcard[];
}

type CardStatus = 'unseen' | 'known' | 'unknown';

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState<CardStatus[]>([]);

  useEffect(() => {
    setCardStatuses(new Array(flashcards.length).fill('unseen'));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
      } else {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
      }
    }, 150);
  }, [flashcards.length]);

  const handleStatusUpdate = (status: 'known' | 'unknown') => {
    const newStatuses = [...cardStatuses];
    newStatuses[currentIndex] = status;
    setCardStatuses(newStatuses);
    navigate('next');
  };

  const handleShuffle = () => {
    const newStatuses = new Array(flashcards.length).fill('unseen');
    setCardStatuses(newStatuses);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      navigate('next');
    } else if (event.key === 'ArrowLeft') {
      navigate('prev');
    } else if (event.key === ' ') {
      event.preventDefault();
      setIsFlipped(f => !f);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  if (!flashcards || flashcards.length === 0) {
    return <Card variant="light"><p>No flashcards were generated.</p></Card>;
  }
  
  const currentCard = flashcards[currentIndex];

  const knownCount = cardStatuses.filter(s => s === 'known').length;
  const unknownCount = cardStatuses.filter(s => s === 'unknown').length;
  const unseenCount = flashcards.length - knownCount - unknownCount;

  return (
    <Card variant="light" className="max-w-2xl mx-auto text-center !p-4 md:!p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Flashcards</h2>
        <Button onClick={handleShuffle} variant="ghost" size="sm">Reset & Shuffle</Button>
      </div>
      
      <div className="h-64 [perspective:1000px] mb-6 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div 
          className={`relative w-full h-full text-center transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* Front of Card */}
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-white to-slate-50 rounded-lg flex items-center justify-center p-6 border border-slate-200 shadow-lg">
            <div>
              <p className="text-3xl font-bold text-slate-800">{currentCard.term}</p>
              {currentCard.tip && !isFlipped && (
                  <p className="text-sm text-slate-500 mt-4 italic">💡 Tip: {currentCard.tip}</p>
              )}
            </div>
          </div>
          {/* Back of Card */}
          <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-violet-50 to-indigo-100 rounded-lg flex items-center justify-center p-6 border border-violet-200 shadow-lg">
            <p className="text-lg text-slate-700">{currentCard.definition}</p>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 mb-4 h-4 font-semibold">{isFlipped ? "Did you know this?" : "Click card to flip (or press spacebar)"}</p>

      {/* Controls */}
      {isFlipped ? (
        <div className="flex items-center justify-center gap-4">
            <Button onClick={() => handleStatusUpdate('unknown')} variant="outline" className="!border-red-500 !text-red-500 hover:!bg-red-500/10 w-32">
              <XCircleIcon className="w-5 h-5"/>
              Didn't Know
            </Button>
            <Button onClick={() => handleStatusUpdate('known')} variant="outline" className="!border-green-500 !text-green-500 hover:!bg-green-500/10 w-32">
               <CheckCircleIcon className="w-5 h-5"/>
              Knew It!
            </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('prev')} variant="secondary">
              <ArrowLeftIcon className="w-5 h-5"/>
              Prev
          </Button>
          <span className="font-semibold text-slate-700">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <Button onClick={() => navigate('next')} variant="secondary">
              Next
              <ArrowRightIcon className="w-5 h-5"/>
          </Button>
        </div>
      )}

      {/* Progress Bars */}
       <div className="mt-8 space-y-2 text-left">
          <p className="text-sm font-semibold text-slate-600">Your Progress:</p>
          <div className="flex w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="bg-green-500" style={{ width: `${(knownCount / flashcards.length) * 100}%` }}></div>
            <div className="bg-red-500" style={{ width: `${(unknownCount / flashcards.length) * 100}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-medium">
              <span className="text-green-600">Known: {knownCount}</span>
              <span className="text-red-600">Try Again: {unknownCount}</span>
              <span className="text-slate-500">Unseen: {unseenCount}</span>
          </div>
      </div>
    </Card>
  );
};

export default FlashcardComponent;
