import React from "react";

interface Badge {
  id?: string;
  badge_id?: string;
  badge_name?: string;
  badge_description?: string | null;
  badge_category?: string;
  earned_at?: string;
}

interface ReportAchievementsProps {
  badges: Badge[];
}

export function ReportAchievements({ badges }: ReportAchievementsProps) {
  if (!badges || badges.length === 0) {
    return (
      <section className="report-page">
        <h2 className="report-section-title">Achievements & Milestones</h2>
        <p className="report-subtitle">Earned badges and accomplishments</p>
        <div className="no-data-message">
          <p>No badges earned yet. Complete training sessions to unlock achievements.</p>
        </div>
      </section>
    );
  }

  // Group badges by category
  const grouped = badges.reduce((acc, badge) => {
    const cat = badge.badge_category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Achievements & Milestones</h2>
      <p className="report-subtitle">Earned badges and accomplishments</p>

      <div className="badges-container">
        {Object.entries(grouped).map(([category, categoryBadges]) => (
          <div key={category} className="badge-category">
            <h3 className="badge-category-title">{category}</h3>
            <div className="badges-grid">
              {categoryBadges.map((badge) => (
                <div key={badge.badge_id ?? badge.id} className="badge-card">
                  <div className="badge-icon">🏆</div>
                  <div className="badge-info">
                    <span className="badge-name">{badge.badge_name ?? "Badge"}</span>
                    {badge.badge_description && (
                      <span className="badge-description">{badge.badge_description}</span>
                    )}
                    {badge.earned_at && (
                      <span className="badge-date">
                        {new Date(badge.earned_at).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="badges-summary">
        <span className="badges-total">{badges.length} badges earned</span>
      </div>
    </section>
  );
}
