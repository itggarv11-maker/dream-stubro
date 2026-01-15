import { auth } from '../services/firebase';
import { WorkHistoryItem } from '../types';

export const saveWorkToHistory = (item: Omit<WorkHistoryItem, 'id' | 'date'>) => {
    const user = auth?.currentUser;
    if (!user) return;

    const historyKey = `userWorkHistory_${user.uid}`;
    const history: WorkHistoryItem[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const newItem: WorkHistoryItem = {
        ...item,
        id: Date.now().toString(),
        date: new Date().toISOString(),
    };

    history.unshift(newItem); // Add to the beginning
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50))); // Limit to 50 items
};

export const getWorkHistory = (): WorkHistoryItem[] => {
    const user = auth?.currentUser;
    if (!user) return [];
    
    const historyKey = `userWorkHistory_${user.uid}`;
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
};
