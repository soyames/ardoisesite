import React, { useState } from 'react';

const EVALUATION_RUBRICS = [
  {
    key: 'pedagogy_score',
    label: 'Clarté et pédagogie',
    description: "L'enseignant explique-t-il les concepts clairement et avec la bonne méthode ?",
  },
  {
    key: 'subject_mastery_score',
    label: 'Maîtrise du sujet',
    description: "L'enseignant démontre-t-il une bonne maîtrise de sa matière ?",
  },
  {
    key: 'punctuality_score',
    label: 'Ponctualité et professionnalisme',
    description: "L'enseignant est-il ponctuel et respecte-t-il les règles de l'école ?",
  },
  {
    key: 'engagement_score',
    label: 'Engagement et interaction avec les élèves',
    description: "L'enseignant encourage-t-il la participation et l'interaction des élèves ?",
  },
  {
    key: 'communication_score',
    label: 'Communication et écoute',
    description: "L'enseignant est-il à l'écoute des élèves et des parents/administration ?",
  }
];

export const DetailedTeacherEvaluationForm = ({
  teacherId,
  evaluatorRole,
  onClose,
  onSubmitSuccess,
  apiSubmit
}) => {
  const [scores, setScores] = useState({
    pedagogy_score: 0,
    subject_mastery_score: 0,
    punctuality_score: 0,
    engagement_score: 0,
    communication_score: 0,
  });
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const isFormValid = Object.values(scores).every(score => score >= 1 && score <= 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Veuillez noter tous les critères avant de soumettre.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        teacher: teacherId,
        evaluator_role: evaluatorRole,
        ...scores,
        additional_comments: comments,
      };

      await apiSubmit('/api/hr/detailed-evaluations/', payload);

      onSubmitSuccess && onSubmitSuccess();
      onClose && onClose();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Évaluation détaillée de l'enseignant</h2>
            <p className="text-sm text-slate-500 mt-1">Veuillez évaluer l'enseignant selon les critères scientifiques suivants.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-6">
            {EVALUATION_RUBRICS.map(rubric => (
              <div key={rubric.key} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-800">{rubric.label}</h3>
                <p className="text-sm text-slate-500 mb-4 mt-1">{rubric.description}</p>
                <div className="flex items-center gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleScoreChange(rubric.key, val)}
                      className={`
                        w-12 h-12 rounded-full font-medium transition-all duration-200 flex items-center justify-center
                        ${scores[rubric.key] === val 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:scale-105 border border-slate-200'}
                      `}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                  <span>Médiocre</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-800">
              Commentaires additionnels <span className="text-slate-400 font-normal">(Optionnel)</span>
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all min-h-[120px] resize-y"
              placeholder="Avez-vous d'autres remarques ou observations ?"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Soumettre l\'évaluation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
