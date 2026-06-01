// Example React component for course viewer
import React, { useState } from 'react';

interface CourseContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'heading';
  content: string;
  order: number;
}

interface CourseViewerProps {
  courseId: string;
  content: CourseContent[];
  onProgress: (step: number, progress: number) => void;
}

export function CourseViewer({ courseId, content, onProgress }: CourseViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    const nextStep = Math.min(currentStep + 1, content.length - 1);
    setCurrentStep(nextStep);
    const progress = Math.round(((nextStep + 1) / content.length) * 100);
    onProgress(nextStep, progress);
  };

  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
  };

  const currentContent = content[currentStep];
  const progress = Math.round(((currentStep + 1) / content.length) * 100);

  const renderContent = () => {
    switch (currentContent?.type) {
      case 'heading':
        return <h2 className="text-3xl font-bold">{currentContent.content}</h2>;
      case 'text':
        return <p className="text-lg leading-relaxed">{currentContent.content}</p>;
      case 'image':
        return <img src={currentContent.content} alt="Course content" className="w-full" />;
      case 'video':
        return (
          <video controls className="w-full">
            <source src={currentContent.content} type="video/mp4" />
          </video>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Course Learning</h1>
            <span className="text-sm font-medium text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">{renderContent()}</div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {currentStep + 1} / {content.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentStep === content.length - 1}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseViewer;
