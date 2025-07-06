import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface CustomQuestionsManagerProps {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

const CustomQuestionsManager: React.FC<CustomQuestionsManagerProps> = ({ questions, onChange }) => {
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: false,
      options: []
    };
    setEditingQuestion(newQuestion);
    setShowAddForm(true);
  };

  const editQuestion = (question: CustomQuestion) => {
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const saveQuestion = (question: CustomQuestion) => {
    if (question.question.trim() === '') {
      alert('Question text is required');
      return;
    }

    if ((question.type === 'radio' || question.type === 'checkbox') && (!question.options || question.options.length === 0)) {
      alert('Options are required for radio and checkbox questions');
      return;
    }

    const existingIndex = questions.findIndex(q => q.id === question.id);
    if (existingIndex >= 0) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[existingIndex] = question;
      onChange(updatedQuestions);
    } else {
      // Add new question
      onChange([...questions, question]);
    }

    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const updateQuestionField = (field: keyof CustomQuestion, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const addOption = () => {
    if (!editingQuestion) return;
    const newOptions = [...(editingQuestion.options || []), ''];
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion || !editingQuestion.options) return;
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!editingQuestion || !editingQuestion.options) return;
    const newOptions = editingQuestion.options.filter((_, i) => i !== index);
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Custom Application Questions</h3>
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Existing Questions */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{question.question}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{question.type}</span>
                  <span>{question.required ? 'Required' : 'Optional'}</span>
                  {question.options && question.options.length > 0 && (
                    <span>{question.options.length} options</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editQuestion(question)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Question Form */}
      {showAddForm && editingQuestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {questions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'Add New Question'}
          </h4>
          
          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <input
                type="text"
                value={editingQuestion.question}
                onChange={(e) => updateQuestionField('question', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your question"
              />
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={editingQuestion.type}
                onChange={(e) => updateQuestionField('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text">Short Text</option>
                <option value="textarea">Long Text</option>
                <option value="radio">Single Choice</option>
                <option value="checkbox">Multiple Choice</option>
              </select>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={editingQuestion.required}
                onChange={(e) => updateQuestionField('required', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                This question is required
              </label>
            </div>

            {/* Options for Radio/Checkbox */}
            {(editingQuestion.type === 'radio' || editingQuestion.type === 'checkbox') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                <div className="space-y-2">
                  {(editingQuestion.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => saveQuestion(editingQuestion)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Question
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {questions.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No custom questions added yet.</p>
          <p className="text-sm">Add questions to gather specific information from applicants.</p>
        </div>
      )}
    </div>
  );
};

export default CustomQuestionsManager; 