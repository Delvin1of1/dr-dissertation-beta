import { useEffect, useState } from 'react';

export default function ProcessingStatus({ stage }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stages = [
    { id: 'upload', label: 'Uploading Document', icon: '📤' },
    { id: 'analyzing', label: 'Analyzing with HAIST© Framework', icon: '🔍' },
    { id: 'theoretical', label: 'Theoretical Framework', icon: '✓' },
    { id: 'literature', label: 'Literature Review', icon: '✓' },
    { id: 'methodology', label: 'Methodology & Design', icon: '⏳' },
    { id: 'questions', label: 'Research Questions', icon: '⏳' },
    { id: 'ethics', label: 'Ethical Considerations', icon: '⏳' },
    { id: 'contribution', label: 'Scholarly Contribution', icon: '⏳' },
    { id: 'writing', label: 'Academic Writing', icon: '⏳' },
    { id: 'generating', label: 'Generating Report', icon: '📝' }
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="processing-container">
      <div className="processing-header">
        <h2>Analyzing Your Dissertation{dots}</h2>
        <p>This typically takes 5-10 minutes</p>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
        />
      </div>

      <div className="stages-list">
        {stages.map((s, idx) => (
          <div 
            key={s.id}
            className={`stage-item ${idx < currentIndex ? 'complete' : idx === currentIndex ? 'active' : 'pending'}`}
          >
            <span className="stage-icon">{s.icon}</span>
            <span className="stage-label">{s.label}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .processing-container {
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .processing-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .processing-header h2 {
          font-size: 1.5rem;
          color: #1E293B;
          margin-bottom: 0.5rem;
        }

        .processing-header p {
          color: #64748B;
        }

        .progress-bar {
          height: 8px;
          background: #E2E8F0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366F1, #8B5CF6);
          transition: width 0.5s ease;
        }

        .stages-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stage-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .stage-item.complete {
          background: #F0FDF4;
          color: #166534;
        }

        .stage-item.active {
          background: #EEF2FF;
          color: #4338CA;
          font-weight: 600;
        }

        .stage-item.pending {
          color: #94A3B8;
        }

        .stage-icon {
          font-size: 1.25rem;
          min-width: 2rem;
        }

        .stage-label {
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
}
