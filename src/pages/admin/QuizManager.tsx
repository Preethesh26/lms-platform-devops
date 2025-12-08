import React, { useEffect, useState } from 'react';
import { useStore } from '../../lib/store';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Clock, Activity, Edit, Trash } from 'lucide-react';

// Simplified view for now, effectively "Your Quizzes"
const QuizManager = () => {
    const navigate = useNavigate();
    // In a real app we'd fetch quizzes list from store/API
    // For now we assume we can list them or link to them from Courses
    // But let's verify if store has quizzes exposed. It has `quizzes` state but it needs to be populated.

    // Actually, quizzes are tied to courses. It's better to show quizzes nested in courses or a flat list.
    // Let's create a placeholder for now as we focus on creation flow first.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Quiz Manager
                </h1>
                <button
                    onClick={() => navigate('/admin/quizzes/create')}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create Quiz
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">View and manage quizzes here.</p>
                {/* To fully implement list, we'd need a getAllQuizzes endpoint or iterate courses */}
                <button
                    onClick={() => navigate('/admin/quizzes/create')}
                    className="text-purple-400 hover:text-purple-300 underline"
                >
                    Create your first quiz
                </button>
            </div>
        </div>
    );
};

export default QuizManager;
