import React, { useState } from 'react';
import { api } from '../api/client.js';

export default function PulseSurveyModal({ onClose, teacherId, schoolId }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      if (teacherId) {
        await api.post('/api/hr/teacher-ratings/', {
          teacher: teacherId,
          score: rating,
          comment: comment,
        });
      } else if (schoolId) {
        await api.post('/api/core/school-ratings/', {
          school: schoolId,
          score: rating,
          comment: comment,
        });
      }
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Une erreur est survenue lors de la soumission. Merci de réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-control bg-surface p-6 shadow-xl text-center">
          <span className="material-symbols-outlined text-5xl text-success-600 mb-4">check_circle</span>
          <h2 className="text-xl font-bold text-ink">Merci pour votre retour !</h2>
          <p className="mt-2 text-ink-muted">Votre évaluation a bien été enregistrée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-control bg-surface p-6 shadow-xl">
        <h2 className="text-xl font-bold text-ink text-center">Comment s'est passée la session ?</h2>
        <p className="mt-2 text-sm text-ink-muted text-center mb-6">
          Votre avis est important pour nous aider à améliorer la qualité de l'enseignement.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <span className={`material-symbols-outlined text-4xl ${star <= (hoveredRating || rating) ? 'text-warning-400 font-variation-fill' : 'text-surface-border'}`}>
                  star
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="comment" className="block text-sm font-medium text-ink">
              Commentaire (Optionnel)
            </label>
            <textarea
              id="comment"
              rows={3}
              className="mt-1 block w-full rounded-control border-surface-border bg-surface-hover p-3 text-ink shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Qu'avez-vous particulièrement apprécié ou que pourrions-nous améliorer ?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-control px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-hover focus:outline-none"
              disabled={isSubmitting}
            >
              Passer
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="rounded-control bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
